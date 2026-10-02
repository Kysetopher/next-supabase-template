import { payWithSavedCard } from "@/lib/actions/billing";
import type { ProductKey } from "@/lib/billing/products";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonVariant } from "@/components/ui/button";

/**
 * One-click purchase of a one-time product with the customer's saved card
 * (payWithSavedCard). With no saved card, or one that needs the customer
 * (3-D Secure, a decline), they land on /checkout for that product instead.
 * The form sends only the product key; the price comes from the catalog.
 *
 * A Server Component on purpose: each render mints a fresh random nonce,
 * used as the Stripe idempotency key so a double-submit charges once. Render
 * it from a Server Component (a page) — the nonce must be new per page view,
 * which a client-rendered value couldn't guarantee without a hydration
 * mismatch.
 */
export function PayWithSavedCardButton({
  productKey,
  children,
  className,
  variant = "primary",
}: {
  productKey: ProductKey;
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
}) {
  return (
    <form action={payWithSavedCard}>
      <input type="hidden" name="product" value={productKey} />
      <input type="hidden" name="nonce" value={crypto.randomUUID()} />
      <SubmitButton variant={variant} className={className}>
        {children}
      </SubmitButton>
    </form>
  );
}
