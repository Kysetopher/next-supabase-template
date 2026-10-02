import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripeClient, idOf, isResourceMissing } from "@/lib/billing/stripe";

type Client = SupabaseClient<Database>;

/**
 * The caller's Stripe customer id, or null if they've never started a
 * checkout. Reads through the request's RLS-scoped client
 * (billing_customers: users read their own row).
 */
export async function getStripeCustomerId(supabase: Client, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.stripe_customer_id ?? null;
}

/**
 * The user's Stripe customer id, creating the customer the first time it's
 * needed (first checkout or one-click purchase).
 *
 * Service client: billing_customers has no insert grant for users — a user
 * who could write their own row could point it at someone else's customer.
 * This is trusted server code doing one narrow write, keyed on a `userId`
 * the caller took from the verified session (db()), never from input.
 *
 * Two concurrent calls (two tabs) mustn't make two customers. The Stripe
 * idempotency key is per user, so a second create within Stripe's 24-hour
 * key window returns the same customer; the insert ignores a duplicate and
 * the stored row is re-read, so both callers get the same id.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const service = createServiceClient();

  const existing = await getStripeCustomerId(service, userId);
  if (existing) return existing;

  const customer = await getStripeClient().customers.create(
    { email, metadata: { user_id: userId } },
    { idempotencyKey: `customer-create:${userId}` }
  );

  const { error: insertError } = await service
    .from("billing_customers")
    .upsert({ user_id: userId, stripe_customer_id: customer.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (insertError) throw insertError;

  const stored = await getStripeCustomerId(service, userId);
  if (!stored) throw new Error(`billing_customers row for ${userId} missing right after insert`);
  return stored;
}

/**
 * The user id behind a Stripe customer, via billing_customers — how the
 * webhook decides whose a subscription or payment is. Never from metadata,
 * which anyone with Dashboard access (or a bug) can change. Null when the
 * customer isn't ours or its user has been deleted.
 */
export async function userIdForCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await createServiceClient()
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data?.user_id ?? null;
}

/**
 * Points the Stripe customer at the account's new email after an email
 * change (/auth/email-change), so receipts follow it. Best effort: the email
 * change has already happened, so failures are logged, not shown. No
 * customer yet means nothing to do — getOrCreateStripeCustomer() will use
 * the new address.
 */
export async function syncStripeCustomerEmail(supabase: Client, userId: string, email: string): Promise<void> {
  try {
    const customerId = await getStripeCustomerId(supabase, userId);
    if (!customerId) return;
    await getStripeClient().customers.update(customerId, { email });
  } catch (error) {
    console.error("syncStripeCustomerEmail: failed", userId, error);
  }
}

/**
 * Deletes a Stripe customer, which also cancels their subscriptions
 * immediately. True when it's gone, including when it already was
 * ("resource_missing" — e.g. a retried account deletion). False on any
 * other failure, which must block the account deletion: going ahead would
 * leave a customer Stripe keeps charging with no account to cancel from.
 */
export async function deleteStripeCustomer(customerId: string): Promise<boolean> {
  try {
    await getStripeClient().customers.del(customerId);
    return true;
  } catch (error) {
    if (isResourceMissing(error)) return true;
    console.error("deleteStripeCustomer: failed", customerId, error);
    return false;
  }
}

export type PaymentMethodSummary = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
};

function summarizeCard(pm: Stripe.PaymentMethod | string | null | undefined): (PaymentMethodSummary & { id: string }) | null {
  if (!pm || typeof pm === "string" || pm.type !== "card" || !pm.card) return null;
  return { id: pm.id, brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year };
}

/**
 * The card a one-click purchase should charge, read live from Stripe (not
 * mirrored into our tables, so there's nothing to keep in sync): the
 * customer's default (invoice_settings.default_payment_method, which the
 * Customer Portal sets), else the default card of their newest active
 * subscription. Null when there's no saved card.
 */
export async function getDefaultPaymentMethod(customerId: string): Promise<(PaymentMethodSummary & { id: string }) | null> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(customerId, { expand: ["invoice_settings.default_payment_method"] });
  if (customer.deleted) return null;

  const fromCustomer = summarizeCard(customer.invoice_settings.default_payment_method);
  if (fromCustomer) return fromCustomer;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
    expand: ["data.default_payment_method"],
  });
  return summarizeCard(subscriptions.data[0]?.default_payment_method);
}

/**
 * Makes a card the customer's default when they have none yet, so a card
 * saved during a one-time checkout is what the next one-click purchase
 * uses. Called from the webhook; safe to repeat.
 */
export async function setDefaultPaymentMethodIfNone(customerId: string, paymentMethodId: string): Promise<void> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || idOf(customer.invoice_settings.default_payment_method)) return;
  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
}
