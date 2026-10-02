/** Runs once when a server instance starts, before it handles any request. */
export async function register() {
  const { assertEnv, isBillingEnabled } = await import("@/lib/env");
  assertEnv();

  // With billing on, every product in the catalog must have its price set,
  // so a missing STRIPE_PRICE_* stops the server here rather than at checkout.
  if (isBillingEnabled()) {
    const { assertProducts } = await import("@/lib/billing/products");
    assertProducts();
  }
}
