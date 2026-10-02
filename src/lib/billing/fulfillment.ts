import "server-only";

import type { Database } from "@/lib/supabase/types";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

/*
 * ===================================================================
 *  FULFILLMENT HOOKS — where a project grants what was paid for.
 * ===================================================================
 *
 * The webhook calls these after it has re-read the object from Stripe and
 * written our row. They run with no user session (service-role context).
 *
 * Rules:
 *
 *  1. Idempotent. Each is called on EVERY webhook delivery that finds the
 *     paid state — retries, out-of-order events, a refresh after a refund
 *     that was later reversed. Key anything you write on the Stripe id
 *     (`row.stripe_subscription_id` / `row.stripe_payment_intent_id`) with a
 *     unique constraint, e.g. `insert ... on conflict do nothing`.
 *  2. Throw to have Stripe retry. The webhook returns 500 on any error.
 *  3. Prefer not to store access at all. The simplest correct gate reads
 *     the mirror at request time — getActiveSubscription() for
 *     subscriptions, a `payments` row with status 'succeeded' for one-time
 *     purchases — so cancellations, failed renewals, refunds and disputes
 *     revoke access automatically with no "un-fulfil" hook. Use these hooks
 *     for side effects that can't be derived that way (sending a welcome
 *     email, provisioning something external, granting a balance).
 *
 * Nothing here is called from a page load or the client: checkout's success
 * page is UX only and never grants anything.
 */

/** A subscription is `active` (first payment, renewal, or recovered from past_due). */
export async function onSubscriptionActive(subscription: SubscriptionRow): Promise<void> {
  // Grant access for subscription.product_key to subscription.user_id here.
  // product_key is null for a price that isn't in the catalog — decide
  // whether that should grant anything (the default here: nothing to do).
  void subscription;
}

/**
 * A one-time purchase is paid and not refunded or disputed. Only called for
 * payments whose price matched the catalog (`product_key` is set).
 */
export async function onPaymentSucceeded(payment: PaymentRow & { product_key: string }): Promise<void> {
  // Grant payment.product_key to payment.user_id here, keyed on
  // payment.stripe_payment_intent_id so a repeat call is a no-op.
  void payment;
}
