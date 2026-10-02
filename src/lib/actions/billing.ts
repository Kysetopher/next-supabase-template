"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/supabase/db";
import { env, isBillingEnabled } from "@/lib/env";
import { checkBurst } from "@/lib/rate-limit/burst";
import { getStripeClient } from "@/lib/billing/stripe";
import { getStripeCustomerId } from "@/lib/billing/customers";
import { chargeSavedCard, type SavedCardResult } from "@/lib/billing/payments";
import { getProduct } from "@/lib/billing/products";
import { errorParam } from "@/lib/url-messages";

/**
 * Opens Stripe's own Customer Portal — update the card, see invoices,
 * cancel — rather than custom-built screens. What it allows is configured in
 * the Stripe Dashboard (Settings > Billing > Customer portal). Returns to
 * /account.
 */
export async function manageBilling() {
  if (!isBillingEnabled()) {
    redirect(`/account?${errorParam("billing_unavailable")}`);
  }

  const { supabase, user } = await db();
  if (!(await checkBurst("billing", `portal:${user.id}`))) {
    redirect(`/account?${errorParam("too_many_attempts")}`);
  }

  const customerId = await getStripeCustomerId(supabase, user.id);
  if (!customerId) {
    redirect(`/account?${errorParam("billing_no_customer")}`);
  }

  let url: string;
  try {
    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.SITE_URL}/account`,
    });
    url = session.url;
  } catch (error) {
    console.error("manageBilling: portal session failed", user.id, error);
    redirect(`/account?${errorParam("billing_portal_failed")}`);
  }

  redirect(url);
}

const NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One-click purchase of a one-time (`mode: "payment"`) product with the
 * saved card (PayWithSavedCardButton). The product comes from the catalog by
 * key — never a price or amount from the form. With no saved card, or a
 * card that needs the customer (3-D Secure, a decline), it falls back to the
 * full checkout page, which handles both. Nothing is granted here: the
 * webhook records the payment and runs fulfilment.
 *
 * `nonce` is a fresh random id rendered into each form; it's the Stripe
 * idempotency key, so a double-submitted form charges once. A forged or
 * reused nonce can only make Stripe return the earlier result, never charge
 * someone else: the user and amount come from the session and the catalog.
 */
export async function payWithSavedCard(formData: FormData) {
  if (!isBillingEnabled()) {
    redirect(`/account?${errorParam("billing_unavailable")}`);
  }

  const product = getProduct(formData.get("product"));
  if (!product || product.mode !== "payment") {
    redirect(`/account?${errorParam("invalid_product")}`);
  }
  const checkoutUrl = `/checkout?product=${encodeURIComponent(product.key)}`;

  const nonce = formData.get("nonce");
  if (typeof nonce !== "string" || !NONCE.test(nonce)) {
    redirect(checkoutUrl);
  }

  const { user } = await db();
  if (!user.email) {
    redirect(`/account?${errorParam("account_load_failed")}`);
  }
  if (!(await checkBurst("billing", `pay:${user.id}`))) {
    redirect(`/account?${errorParam("too_many_attempts")}`);
  }

  let result: SavedCardResult;
  try {
    result = await chargeSavedCard(user.id, user.email, product.key, `pay-saved-card:${user.id}:${product.key}:${nonce}`);
  } catch (error) {
    console.error("payWithSavedCard: charge failed", user.id, product.key, error);
    redirect(`/account?${errorParam("payment_failed")}`);
  }

  if (result.kind === "succeeded" || result.kind === "processing") {
    redirect(`/checkout/success?redirect_status=${result.kind}&product=${encodeURIComponent(product.key)}`);
  }
  redirect(result.kind === "no_saved_card" ? checkoutUrl : `${checkoutUrl}&${errorParam("saved_card_failed")}`);
}
