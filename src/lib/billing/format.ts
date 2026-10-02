/** Display helpers for billing amounts and dates. No secrets; safe anywhere. */

/** An amount in the currency's minor unit (as Stripe stores it), e.g. 1999 USD -> "$19.99", 500 JPY -> "¥500". */
export function formatAmount(amount: number, currency: string): string {
  const format = new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(amount / 10 ** digits);
}

/** "$19.99 / month", "$99.00 / 3 months", or just the amount for a one-time price. */
export function formatPrice(price: { amount: number; currency: string; interval: { unit: string; count: number } | null }): string {
  const amount = formatAmount(price.amount, price.currency);
  if (!price.interval) return amount;
  const { unit, count } = price.interval;
  return count === 1 ? `${amount} / ${unit}` : `${amount} / ${count} ${unit}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
