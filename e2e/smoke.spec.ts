import { expect, test } from "@playwright/test";

test("home page loads with sign-up and log-in links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("main").getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
});

test("login page renders the credentials form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("signup page renders the credentials form", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
});

for (const path of ["/dashboard", "/account", "/components"]) {
  test(`${path} redirects a signed-out visitor to /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("URL error codes map to fixed messages, never echoed text", async ({ page }) => {
  // Scoped to the form: Next's route announcer is also role="alert".
  const alert = () => page.locator("form").getByRole("alert");

  await page.goto("/login?error=invalid_credentials");
  await expect(alert()).toHaveText("Email or password is incorrect.");

  await page.goto(`/login?error=${encodeURIComponent("Your account is locked, call 555-0100")}`);
  await expect(alert()).toHaveText("Something went wrong. Please try again.");

  // Inherited property names must not resolve (Object.hasOwn, not `in`).
  await page.goto("/login?error=__proto__");
  await expect(alert()).toHaveText("Something went wrong. Please try again.");
});

test("unknown routes redirect a signed-out visitor to /login", async ({ page }) => {
  // Protected by default: the middleware can't tell an unknown path from a
  // new protected page, so signed-out visitors never see the 404 — which also
  // means it doesn't reveal which routes exist. Signed-in users get not-found.tsx.
  await page.goto("/this-page-does-not-exist");
  await expect(page).toHaveURL(/\/login$/);
});

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});
