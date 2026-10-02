import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripeClient, idOf, summarizePrice, type PriceSummary } from "@/lib/billing/stripe";
import { getOrCreateStripeCustomer, userIdForCustomer, type PaymentMethodSummary } from "@/lib/billing/customers";
import { getPriceId, getProduct, productKeyForPrice } from "@/lib/billing/products";
import { onSubscriptionActive } from "@/lib/billing/fulfillment";

type Client = SupabaseClient<Database>;
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

/** The four values subscriptions.status allows (see the migration's CHECK). */
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete";

/**
 * Stripe's subscription statuses, narrowed to ours. Only `active` grants
 * access. Trialing counts as active (Stripe is letting them use it).
 * Anything unrecognised — Stripe.Subscription.Status has a forward-compat
 * string catch-all for values this SDK doesn't know yet — maps to past_due,
 * so a new status can never silently grant access.
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return "incomplete";
    default:
      return "past_due";
  }
}

/** The subscription's single item. This template creates one-item subscriptions only. */
function getSubscriptionItem(subscription: Stripe.Subscription): Stripe.SubscriptionItem {
  const item = subscription.items.data[0];
  if (!item) throw new Error(`Subscription ${subscription.id} has no items.`);
  return item;
}

/**
 * Upserts our row from a Subscription the caller just fetched from Stripe.
 *
 * - The user comes from billing_customers by the subscription's customer id,
 *   not metadata. A customer we don't know (not ours, or its user deleted)
 *   is skipped with a log — retrying wouldn't change the answer.
 * - product_key comes from the subscription's actual price, not metadata.
 * - current_period_start/end live on the subscription *item* in this API
 *   version (Stripe.SubscriptionItem), not on the subscription.
 * - An unpaid checkout that Stripe expired (incomplete_expired -> canceled)
 *   was never paid for, so its period ends when it started — otherwise it
 *   would look like "canceled, but paid up until next month".
 */
export async function upsertSubscriptionRow(subscription: Stripe.Subscription): Promise<SubscriptionRow | null> {
  const customerId = idOf(subscription.customer);
  const userId = customerId ? await userIdForCustomer(customerId) : null;
  if (!userId) {
    console.warn("billing: subscription for an unknown customer, skipped", subscription.id, customerId);
    return null;
  }

  const item = getSubscriptionItem(subscription);
  const periodEnd = subscription.status === "incomplete_expired" ? item.current_period_start : item.current_period_end;

  const { data, error } = await createServiceClient()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: item.price.id,
        product_key: productKeyForPrice(item.price.id),
        status: mapStripeStatus(subscription.status),
        current_period_start: new Date(item.current_period_start * 1000).toISOString(),
        current_period_end: new Date(periodEnd * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Re-reads a subscription from Stripe and upserts our row from that. The
 * webhook calls this rather than trusting the event's copy: events arrive
 * out of order and are retried for days, and a stale "active" copy landing
 * after a cancellation would otherwise re-activate it. The live object is
 * always the latest state, so running this twice is harmless.
 */
export async function refreshSubscription(stripeSubscriptionId: string): Promise<void> {
  const subscription = await getStripeClient().subscriptions.retrieve(stripeSubscriptionId);
  const row = await upsertSubscriptionRow(subscription);
  if (row?.status === "active") await onSubscriptionActive(row);
}

/**
 * The subscription the user is on — active, or past_due (a failed renewal
 * they should fix in the Customer Portal) — or null. For display and for
 * "already subscribed?" checks, NOT for granting access: use
 * getActiveSubscription() for that. RLS-scoped read.
 */
export async function getCurrentSubscription(supabase: Client, userId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "past_due"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * The user's `active` subscription, or null — the access check. Gate paid
 * features on this (optionally also on `product_key`), read at request time,
 * so a cancellation or failed payment takes effect as soon as the webhook
 * records it. RLS-scoped read.
 */
export async function getActiveSubscription(supabase: Client, userId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** The card behind a subscription, read live from Stripe (save_default_payment_method puts it on the subscription). */
export async function getSubscriptionPaymentMethod(stripeSubscriptionId: string): Promise<PaymentMethodSummary | null> {
  const subscription = await getStripeClient().subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["default_payment_method"],
  });
  const pm = subscription.default_payment_method;
  if (!pm || typeof pm === "string" || pm.type !== "card" || !pm.card) return null;
  return { brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year };
}

function confirmationSecretOf(subscription: Stripe.Subscription): string | null {
  const invoice = subscription.latest_invoice;
  return typeof invoice === "object" && invoice?.confirmation_secret?.client_secret
    ? invoice.confirmation_secret.client_secret
    : null;
}

/**
 * Starts a subscription for the embedded checkout form and returns the
 * client secret it confirms. `payment_behavior: "default_incomplete"` leaves
 * it `incomplete` until the customer pays its first invoice in the form.
 *
 * The client secret is `latest_invoice.confirmation_secret.client_secret` in
 * this API version — not `latest_invoice.payment_intent.client_secret`,
 * which older examples use and which no longer exists on Invoice.
 *
 * Opening /checkout calls this, so an unpaid subscription from an earlier
 * visit is reused instead of piling up new ones (Stripe expires unpaid ones
 * after about a day anyway). Our row is written by the webhook, not here,
 * so there's one writer.
 */
export async function createSubscription(
  userId: string,
  email: string,
  productKey: string
): Promise<{ clientSecret: string; price: PriceSummary }> {
  const product = getProduct(productKey);
  if (!product || product.mode !== "subscription") throw new Error(`"${productKey}" is not a subscription product.`);

  const stripe = getStripeClient();
  const priceId = getPriceId(product);
  const [customerId, price] = await Promise.all([getOrCreateStripeCustomer(userId, email), stripe.prices.retrieve(priceId)]);
  if (!price.recurring) throw new Error(`Price ${priceId} for "${productKey}" is not recurring.`);

  const pending = await stripe.subscriptions.list({
    customer: customerId,
    price: priceId,
    status: "incomplete",
    limit: 1,
    expand: ["data.latest_invoice.confirmation_secret"],
  });
  const reusable = pending.data[0] ? confirmationSecretOf(pending.data[0]) : null;
  if (reusable) return { clientSecret: reusable, price: summarizePrice(price) };

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.confirmation_secret"],
    // A note for the Dashboard only — nothing reads it back.
    metadata: { user_id: userId, product_key: product.key },
  });

  const clientSecret = confirmationSecretOf(subscription);
  if (!clientSecret) throw new Error(`Subscription ${subscription.id} has no confirmation_secret on its latest_invoice.`);
  return { clientSecret, price: summarizePrice(price) };
}
