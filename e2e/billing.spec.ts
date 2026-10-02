import { expect, test } from "@playwright/test";

// The smoke server runs with no STRIPE_* variables (playwright.config.ts),
// i.e. billing disabled — the default for a fresh project.

for (const path of ["/checkout", "/checkout?product=anything", "/checkout/success"]) {
  test(`${path} redirects a signed-out visitor to /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("the Stripe webhook never accepts an unsigned request", async ({ request }) => {
  const response = await request.post("/api/webhooks/stripe", {
    data: { id: "evt_test", type: "payment_intent.succeeded", data: { object: { id: "pi_test" } } },
    maxRedirects: 0,
  });
  // 503 with billing disabled, 400 for a missing signature with it enabled —
  // never a redirect to /login (the proxy skips /api/*) and never 200.
  expect(response.status()).not.toBe(200);
  expect([400, 401, 403, 404, 503]).toContain(response.status());
});
