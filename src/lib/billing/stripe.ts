import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

let client: Stripe | null = null;

/**
 * The Stripe API client. Server-only — the secret key must never reach a
 * Client Component; the checkout form gets the publishable key as a prop.
 * Throws if billing is disabled (env.STRIPE_SECRET_KEY does), so call
 * isBillingEnabled() first.
 *
 * `httpClient: Stripe.createFetchHttpClient()` is required, not optional:
 * the SDK's default HTTP client uses Node's `https` module, which edge
 * runtimes such as Cloudflare Workers don't provide (not even with
 * `nodejs_compat`). Without it every Stripe call would work under `next dev`
 * and fail in production there. The fetch client is Stripe's documented
 * path for edge runtimes and works on Node too.
 *
 * No `apiVersion`: the SDK pins the API version its types were generated
 * for, so responses always match the shapes in node_modules/stripe.
 */
export function getStripeClient(): Stripe {
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  return client;
}

/** The id behind an expandable Stripe field (a string id, an expanded object, or null). */
export function idOf(value: string | { id?: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : (value.id ?? null);
}

/** True for Stripe's "no such object" error — the thing is already gone. */
export function isResourceMissing(error: unknown): boolean {
  return error instanceof Stripe.errors.StripeError && error.code === "resource_missing";
}

export type PriceSummary = {
  /** In the currency's minor unit (cents for USD), as Stripe stores it. */
  amount: number;
  currency: string;
  /** Set for recurring prices. */
  interval: { unit: string; count: number } | null;
};

export function summarizePrice(price: Stripe.Price): PriceSummary {
  if (price.unit_amount === null) {
    throw new Error(`Price ${price.id} has no fixed unit_amount — only fixed-amount prices are supported.`);
  }
  return {
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring ? { unit: price.recurring.interval, count: price.recurring.interval_count } : null,
  };
}
