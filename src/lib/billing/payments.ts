import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripeClient, idOf, summarizePrice, type PriceSummary } from "@/lib/billing/stripe";
import {
  getDefaultPaymentMethod,
  getOrCreateStripeCustomer,
  setDefaultPaymentMethodIfNone,
  userIdForCustomer,
} from "@/lib/billing/customers";
import { getPriceId, getProduct, type Product } from "@/lib/billing/products";
import { onPaymentSucceeded } from "@/lib/billing/fulfillment";

type Client = SupabaseClient<Database>;
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentStatus = "succeeded" | "refunded" | "partially_refunded" | "disputed";

/**
 * Marks PaymentIntents this app created for catalog products, so the webhook
 * can tell them from the PaymentIntents Stripe creates for subscription
 * invoices (those are handled as subscriptions, not recorded here).
 */
const ONE_TIME_KIND = "one_time_product";

/** A one-time product and its Stripe price, checked to be a fixed one-time price. */
async function loadOneTimePrice(productKey: string): Promise<{ product: Product; price: Stripe.Price }> {
  const product = getProduct(productKey);
  if (!product || product.mode !== "payment") throw new Error(`"${productKey}" is not a one-time product.`);
  const price = await getStripeClient().prices.retrieve(getPriceId(product));
  if (price.type !== "one_time" || price.unit_amount === null) {
    throw new Error(`Price ${price.id} for "${productKey}" must be a fixed one-time price.`);
  }
  return { product, price };
}

function paymentIntentParams(userId: string, customerId: string, product: Product, price: Stripe.Price) {
  return {
    // The amount always comes from Stripe's Price, never from the client.
    amount: price.unit_amount!,
    currency: price.currency,
    customer: customerId,
    // Read back by the webhook to verify the payment against the catalog.
    // user_id is informational only; ownership comes from billing_customers.
    metadata: { kind: ONE_TIME_KIND, product_key: product.key, price_id: price.id, user_id: userId },
  } satisfies Stripe.PaymentIntentCreateParams;
}

/**
 * A PaymentIntent for the embedded checkout form, for a `mode: "payment"`
 * product. `setup_future_usage: "off_session"` saves the card on the
 * customer so the next purchase can be one click (payWithSavedCard).
 *
 * Opening /checkout creates one each time; an unconfirmed PaymentIntent
 * charges nothing and can simply be left alone. Our `payments` row is
 * written by the webhook once Stripe says it succeeded — never here.
 */
export async function createPaymentIntent(
  userId: string,
  email: string,
  productKey: string
): Promise<{ clientSecret: string; price: PriceSummary }> {
  const [{ product, price }, customerId] = await Promise.all([loadOneTimePrice(productKey), getOrCreateStripeCustomer(userId, email)]);

  const paymentIntent = await getStripeClient().paymentIntents.create({
    ...paymentIntentParams(userId, customerId, product, price),
    automatic_payment_methods: { enabled: true },
    setup_future_usage: "off_session",
  });
  if (!paymentIntent.client_secret) throw new Error(`PaymentIntent ${paymentIntent.id} has no client_secret.`);
  return { clientSecret: paymentIntent.client_secret, price: summarizePrice(price) };
}

export type SavedCardResult =
  /** Paid (or, rarely, still settling). The webhook records it either way. */
  | { kind: "succeeded" | "processing" }
  /** No saved card: send them to /checkout to enter one. */
  | { kind: "no_saved_card" }
  /** The card needs the customer (3-D Secure) or was declined: /checkout handles both. */
  | { kind: "needs_customer" };

/**
 * One-click purchase: charges the customer's saved default card, off
 * session. `idempotencyKey` must be unique per click (the form carries a
 * fresh random nonce), so a double-submitted form charges once.
 */
export async function chargeSavedCard(
  userId: string,
  email: string,
  productKey: string,
  idempotencyKey: string
): Promise<SavedCardResult> {
  const [{ product, price }, customerId] = await Promise.all([loadOneTimePrice(productKey), getOrCreateStripeCustomer(userId, email)]);

  const card = await getDefaultPaymentMethod(customerId);
  if (!card) return { kind: "no_saved_card" };

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await getStripeClient().paymentIntents.create(
      {
        ...paymentIntentParams(userId, customerId, product, price),
        payment_method: card.id,
        // `allowed_payment_method_types` in this API version (the old
        // `payment_method_types` param no longer exists on create).
        allowed_payment_method_types: ["card"],
        off_session: true,
        confirm: true,
      },
      { idempotencyKey }
    );
  } catch (error) {
    // Declines and "authentication_required" come back as card errors.
    if (error instanceof Stripe.errors.StripeCardError) return { kind: "needs_customer" };
    throw error;
  }

  if (paymentIntent.status === "succeeded") return { kind: "succeeded" };
  if (paymentIntent.status === "processing") return { kind: "processing" };
  return { kind: "needs_customer" };
}

/** Status from the live charge and its disputes. Open or lost disputes win over refunds. */
function paymentStatus(charge: Stripe.Charge, disputes: Stripe.Dispute[]): PaymentStatus {
  const settled = new Set<string>(["won", "warning_closed", "prevented"]);
  if (disputes.some((dispute) => !settled.has(dispute.status))) return "disputed";
  if (charge.refunded) return "refunded";
  if (charge.amount_refunded > 0) return "partially_refunded";
  return "succeeded";
}

/**
 * Re-reads a one-time payment from Stripe (PaymentIntent, its charge, the
 * charge's disputes) and upserts our row to match. Every payment-related
 * webhook event calls this, so it doesn't matter which arrives first or how
 * often: the row always reflects Stripe now.
 *
 * - Only PaymentIntents this app created (metadata kind) are recorded.
 * - The user comes from billing_customers, never metadata.
 * - product_key is set only if the catalog still lists that key as a
 *   one-time product and Stripe received at least that price, in its
 *   currency. Otherwise the payment is recorded with product_key null and
 *   logged — money arrived, but nothing is granted for it.
 */
export async function refreshPayment(paymentIntentId: string): Promise<void> {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
  const metadata = paymentIntent.metadata as Record<string, string | undefined>;
  if (metadata.kind !== ONE_TIME_KIND || paymentIntent.status !== "succeeded") return;

  const customerId = idOf(paymentIntent.customer);
  const userId = customerId ? await userIdForCustomer(customerId) : null;
  if (!customerId || !userId) {
    console.warn("billing: payment for an unknown customer, skipped", paymentIntent.id, customerId);
    return;
  }

  const charge = typeof paymentIntent.latest_charge === "object" ? paymentIntent.latest_charge : null;
  if (!charge) throw new Error(`PaymentIntent ${paymentIntent.id} succeeded but has no charge yet`);
  const disputes = await stripe.disputes.list({ payment_intent: paymentIntent.id, limit: 100 });
  const status = paymentStatus(charge, disputes.data);

  let productKey: string | null = null;
  const product = getProduct(metadata.product_key);
  if (product?.mode === "payment" && metadata.price_id) {
    const price = await stripe.prices.retrieve(metadata.price_id);
    if (price.unit_amount !== null && paymentIntent.amount_received >= price.unit_amount && paymentIntent.currency === price.currency) {
      productKey = product.key;
    }
  }
  if (!productKey) {
    console.error("billing: payment doesn't match a catalog product, recorded without fulfilment", {
      paymentIntent: paymentIntent.id,
      productKey: metadata.product_key,
      priceId: metadata.price_id,
      amountReceived: paymentIntent.amount_received,
    });
  }

  const { data: row, error } = await createServiceClient()
    .from("payments")
    .upsert(
      {
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        product_key: productKey,
        amount: paymentIntent.amount_received,
        currency: paymentIntent.currency,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_payment_intent_id" }
    )
    .select()
    .single();
  if (error) throw error;

  // A card saved during this checkout becomes the default for one-click buys.
  const paymentMethodId = idOf(paymentIntent.payment_method);
  if (status === "succeeded" && paymentMethodId) await setDefaultPaymentMethodIfNone(customerId, paymentMethodId);

  if (status === "succeeded" && row.product_key) await onPaymentSucceeded({ ...row, product_key: row.product_key });
}

/**
 * True when the user has a paid, unrefunded, undisputed purchase of a
 * one-time product — the access check for one-time products. RLS-scoped read.
 */
export async function hasPurchased(supabase: Client, userId: string, productKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("product_key", productKey)
    .eq("status", "succeeded")
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}
