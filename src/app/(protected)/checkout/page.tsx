import { notFound, redirect } from "next/navigation";

import { env, isBillingEnabled } from "@/lib/env";
import { db } from "@/lib/supabase/db";
import { getProduct } from "@/lib/billing/products";
import { createSubscription, getCurrentSubscription } from "@/lib/billing/subscriptions";
import { createPaymentIntent } from "@/lib/billing/payments";
import { formatPrice } from "@/lib/billing/format";
import { errorMessage } from "@/lib/url-messages";
import { CheckoutForm } from "@/components/billing/checkout-form";

export const metadata = {
  title: "Checkout",
};

/**
 * `/checkout?product=<key>` — the embedded Stripe payment form for one
 * product from src/lib/billing/products.ts, subscription or one-time. Only
 * catalog keys are accepted (unknown keys 404); the price comes from Stripe.
 * 404s entirely when billing is disabled. Under (protected), so the
 * middleware, the layout and db() below all require a signed-in user.
 *
 * One subscription per user: anyone already on one (active or past_due) is
 * sent to /account, where the Customer Portal handles plan changes and card
 * updates, rather than starting a second subscription.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; error?: string }>;
}) {
  if (!isBillingEnabled()) notFound();

  const { product: productParam, error: errorCode } = await searchParams;
  const product = getProduct(productParam);
  if (!product) notFound();

  const { supabase, user } = await db();
  if (!user.email) {
    throw new Error("This account has no email address, so it can't start a checkout.");
  }

  if (product.mode === "subscription" && (await getCurrentSubscription(supabase, user.id))) {
    redirect("/account");
  }

  const { clientSecret, price } =
    product.mode === "subscription"
      ? await createSubscription(user.id, user.email, product.key)
      : await createPaymentIntent(user.id, user.email, product.key);

  const error = errorMessage(errorCode);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-lg font-semibold">{product.name}</h1>
          <p className="text-2xl font-semibold">{formatPrice(price)}</p>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <p className="text-xs text-muted-foreground">
            {product.mode === "subscription"
              ? "Renews automatically. Cancel any time from your account page."
              : "One-time payment."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Payment details</h2>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <CheckoutForm
            clientSecret={clientSecret}
            returnUrl={`${env.SITE_URL}/checkout/success?product=${encodeURIComponent(product.key)}`}
            publishableKey={env.STRIPE_PUBLISHABLE_KEY}
            submitLabel={product.mode === "subscription" ? "Subscribe" : "Pay now"}
          />
        </div>
      </div>
    </div>
  );
}
