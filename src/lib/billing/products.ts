import { readStripePriceId } from "@/lib/env";

/**
 * What can be bought, defined in code. Checkout and the one-click purchase
 * action accept only a key from this catalog (`/checkout?product=<key>`),
 * never a raw Stripe price id from the client, so nobody can check out
 * against a price you didn't list (an old, cheaper or test price).
 *
 * Each product points at one Stripe Price, either directly (`priceId`) or —
 * usually better, so test and live mode can differ per deploy — through an
 * env var it names (`priceEnvVar`, always `STRIPE_PRICE_<NAME>`). Create the
 * product and its price in the Stripe Dashboard (Product catalog), then:
 *
 *   - `mode: "subscription"` needs a recurring price;
 *   - `mode: "payment"` (a one-time purchase) needs a one-time price.
 *
 * The amount always comes from Stripe's Price, never from here. With billing
 * enabled, the server refuses to start if a listed product's price env var
 * is missing (assertProducts(), called from src/instrumentation.ts).
 *
 * Ships empty. Example:
 *
 *   pro: {
 *     name: "Pro",
 *     description: "Everything, billed monthly. Cancel any time.",
 *     mode: "subscription",
 *     priceEnvVar: "STRIPE_PRICE_PRO",
 *   },
 *   lifetime: {
 *     name: "Lifetime access",
 *     description: "One payment, yours forever.",
 *     mode: "payment",
 *     priceEnvVar: "STRIPE_PRICE_LIFETIME",
 *   },
 *
 * Keys are stored on subscription/payment rows (`product_key`), so treat
 * them as stable: rename one and old rows keep the old key.
 */
const CATALOG = {
  // pro: { name: "Pro", description: "...", mode: "subscription", priceEnvVar: "STRIPE_PRICE_PRO" },
} satisfies Record<string, ProductConfig>;

export type ProductMode = "subscription" | "payment";

export type ProductConfig = {
  name: string;
  description: string;
  mode: ProductMode;
} & ({ priceEnvVar: `STRIPE_PRICE_${string}`; priceId?: never } | { priceId: `price_${string}`; priceEnvVar?: never });

export type ProductKey = Extract<keyof typeof CATALOG, string>;

export type Product = ProductConfig & { key: ProductKey };

const PRODUCTS: Readonly<Record<string, ProductConfig>> = CATALOG;

/** The product for a key from a URL or form, or null. Object.hasOwn so `__proto__` and friends never match. */
export function getProduct(key: unknown): Product | null {
  if (typeof key !== "string" || !Object.hasOwn(PRODUCTS, key)) return null;
  return { ...PRODUCTS[key], key: key as ProductKey };
}

export function listProducts(): Product[] {
  return Object.keys(PRODUCTS).map((key) => getProduct(key)!);
}

/** The Stripe Price id behind a product. Throws if its env var is missing or malformed. */
export function getPriceId(product: ProductConfig): string {
  return product.priceId ?? readStripePriceId(product.priceEnvVar!);
}

/**
 * The catalog key for a Stripe Price id, or null for a price that isn't
 * listed (one set from the Stripe Dashboard, say). Rows record what Stripe
 * says the subscription is on — the price — never what metadata claims.
 */
export function productKeyForPrice(priceId: string): ProductKey | null {
  for (const product of listProducts()) {
    if (getPriceId(product) === priceId) return product.key;
  }
  return null;
}

/** Throws one error listing every product whose price is unset or malformed. Run at startup when billing is on. */
export function assertProducts(): void {
  const problems: string[] = [];
  for (const product of listProducts()) {
    try {
      getPriceId(product);
    } catch (error) {
      problems.push(`product "${product.key}": ${(error as Error).message}`);
    }
  }
  if (problems.length) {
    throw new Error(`Billing product prices are not configured:\n${problems.map((p) => `  - ${p}`).join("\n")}\nSee src/lib/billing/products.ts and docs/STRIPE.md.`);
  }
}
