import Link from "next/link";
import { notFound } from "next/navigation";

import { isBillingEnabled } from "@/lib/env";
import { requireUser } from "@/lib/supabase/dal";
import { getProduct } from "@/lib/billing/products";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Payment status",
};

const MESSAGES: Record<string, { title: string; body: string }> = {
  succeeded: {
    title: "Payment received",
    body: "Thanks — your purchase will show on your account in a moment.",
  },
  processing: {
    title: "Payment processing",
    body: "Your payment is still processing. This can take a little while for some payment methods; your account updates once it clears.",
  },
};

const UNCONFIRMED = {
  title: "Payment not confirmed",
  body: "We couldn't confirm this payment. If you were charged, it will still show on your account once it clears.",
};

/**
 * Where Stripe sends the customer after the checkout form (its return_url;
 * Stripe appends `redirect_status`) and where a one-click purchase lands.
 *
 * UX only. Nothing here records or grants anything: the URL is just a
 * redirect anyone can type, and a client-side confirmation can be
 * interrupted. The webhook is the source of truth (docs/STRIPE.md), so a
 * reload right after paying can still say "processing" for a payment that
 * succeeds a moment later.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_status?: string; product?: string }>;
}) {
  if (!isBillingEnabled()) notFound();
  await requireUser();

  const { redirect_status: status, product: productParam } = await searchParams;
  const message = (status && Object.hasOwn(MESSAGES, status) ? MESSAGES[status] : null) ?? UNCONFIRMED;
  const product = getProduct(productParam);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">{message.title}</h1>
        {product ? <p className="text-sm font-medium">{product.name}</p> : null}
        <p className="text-sm text-muted-foreground">{message.body}</p>
        <div className="mt-4 flex gap-2">
          <Link href="/account" className={buttonVariants({ variant: "secondary" })}>
            View account
          </Link>
          <Link href="/dashboard" className={buttonVariants()}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
