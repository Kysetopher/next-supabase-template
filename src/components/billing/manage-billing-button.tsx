import { Icon } from "@iconify/react";

import { manageBilling } from "@/lib/actions/billing";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonVariant } from "@/components/ui/button";

/**
 * Opens Stripe's Customer Portal (card, invoices, cancellation) via the
 * manageBilling Server Action. A plain form post, so it works without
 * client JS and shows the pending state through SubmitButton.
 */
export function ManageBillingButton({
  className,
  variant = "secondary",
  children = "Manage billing",
}: {
  className?: string;
  variant?: ButtonVariant;
  children?: React.ReactNode;
}) {
  return (
    <form action={manageBilling}>
      <SubmitButton variant={variant} className={className}>
        <Icon icon="mdi:credit-card-outline" className="size-4" aria-hidden="true" />
        {children}
      </SubmitButton>
    </form>
  );
}
