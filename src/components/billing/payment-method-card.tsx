import { Icon } from "@iconify/react";

import type { PaymentMethodSummary } from "@/lib/billing/customers";
import { cn } from "@/lib/utils";

const BRAND_ICONS: Record<string, string> = {
  visa: "simple-icons:visa",
  mastercard: "simple-icons:mastercard",
  amex: "simple-icons:americanexpress",
  discover: "simple-icons:discover",
  jcb: "simple-icons:jcb",
  diners: "simple-icons:dinersclub",
  unionpay: "simple-icons:unionpay",
};

const BRAND_NAMES: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  jcb: "JCB",
  diners: "Diners Club",
  unionpay: "UnionPay",
};

function formatExpiry(month: number | null, year: number | null) {
  if (!month || !year) return "—";
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

/** Stripe has no per-card status; a card past the end of its expiry month is expired. */
function isExpired(month: number | null, year: number | null) {
  if (!month || !year) return false;
  return new Date(year, month, 1) <= new Date();
}

/**
 * A saved card, display only (brand, last four, expiry). The summary is
 * read live from Stripe on the server; full card numbers never reach this
 * app. Pass null to show the empty state.
 */
export function PaymentMethodCard({ value, className }: { value: PaymentMethodSummary | null; className?: string }) {
  if (!value) {
    return (
      <div className={cn("flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground", className)}>
        <Icon icon="mdi:credit-card-off-outline" className="size-5" aria-hidden="true" />
        No saved card
      </div>
    );
  }

  const brand = value.brand ?? "";
  const expired = isExpired(value.expMonth, value.expYear);

  return (
    <div className={cn("flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground", className)}>
      <Icon icon={BRAND_ICONS[brand] ?? "mdi:credit-card-outline"} className="size-8 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">
          {BRAND_NAMES[brand] ?? "Card"} <span className="font-mono tracking-wider">•••• {value.last4 ?? "????"}</span>
        </span>
        <span className={cn("text-xs", expired ? "text-destructive" : "text-muted-foreground")}>
          {expired ? "Expired" : "Expires"} {formatExpiry(value.expMonth, value.expYear)}
        </span>
      </div>
    </div>
  );
}
