import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Smoke tests against a production build, with no Supabase behind it: the
 * placeholder URL below refuses connections, so every visitor is treated as
 * signed out. That's enough to check pages render, protected routes redirect
 * and the security headers are sent. Tests that need a real session belong
 * in a separate suite pointed at the development Supabase project.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI builds in its own step; locally, build first so a stale .next isn't tested.
    command: process.env.CI ? `npm run start -- -p ${PORT}` : `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // Deliberately unreachable (.invalid never resolves): no database at all.
      SUPABASE_URL: "http://supabase.invalid",
      SUPABASE_PUBLISHABLE_KEY: "placeholder",
      SUPABASE_SECRET_KEY: "placeholder",
      SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
