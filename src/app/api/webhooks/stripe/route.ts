import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env, isBillingEnabled } from "@/lib/env";
import { getStripeClient, idOf } from "@/lib/billing/stripe";
import { refreshSubscription } from "@/lib/billing/subscriptions";
import { refreshPayment } from "@/lib/billing/payments";

/**
 * Stripe's servers call this, not users: it's authenticated by the
 * `stripe-signature` header (signed with STRIPE_WEBHOOK_SECRET), never a
 * session cookie. /api/* is outside the proxy's matcher (src/proxy.ts), so
 * it's never redirected to /login. See docs/STRIPE.md.
 *
 * The only place billing rows are written. The rules:
 *
 * 1. Verify the signature over the raw body — request.text(), never
 *    request.json(), since re-serialising changes the bytes that were signed.
 * 2. Act on objects re-fetched from Stripe, never the event's copy: events
 *    arrive out of order and are retried for days, so the copy may be stale.
 *    Each handler re-reads and writes the current state, which also makes
 *    every handler idempotent (a repeat does the same write).
 * 3. Whose object it is comes from billing_customers (by customer id), never
 *    metadata.
 * 4. Any handler failure returns 500 so Stripe retries it.
 *
 * Subscribe the endpoint to exactly these events (Dashboard > Developers >
 * Webhooks, or `stripe listen --events ...`):
 *
 *   customer.subscription.created
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   payment_intent.succeeded
 *   charge.refunded
 *   charge.dispute.created
 *   charge.dispute.closed
 *
 * No invoice.* handlers: a paid or failed subscription invoice changes the
 * subscription's status, which customer.subscription.updated delivers.
 */
export async function POST(request: Request) {
  // Billing off: nothing to receive. 503 rather than 404 so that if the env
  // vars were dropped by mistake, Stripe keeps retrying until they're back.
  if (!isBillingEnabled()) {
    return NextResponse.json({ error: "Billing is not enabled" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();
  let event: Stripe.Event;
  try {
    // The async variant works with Web Crypto too, so this also runs on
    // edge runtimes (Cloudflare Workers), not only Node.
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("stripe webhook: signature verification failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await refreshSubscription(event.data.object.id);
        break;

      case "payment_intent.succeeded":
        await refreshPayment(event.data.object.id);
        break;

      case "charge.refunded":
      case "charge.dispute.created":
      case "charge.dispute.closed": {
        const paymentIntentId = idOf(event.data.object.payment_intent);
        if (paymentIntentId) await refreshPayment(paymentIntentId);
        break;
      }

      default:
        // Not subscribed to, or not ours to handle: acknowledge so Stripe stops sending it.
        break;
    }
  } catch (error) {
    // 500 so Stripe retries: every handler is safe to run again.
    console.error(`stripe webhook: ${event.type} failed`, event.id, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
