// Checks .env.local the same way the server does at startup (src/lib/env.ts),
// without starting anything and without printing any secret values.
// Run with `npm run check:env`.
const { assertEnv } = await import("../src/lib/env.ts");

try {
  assertEnv();
  console.log("Environment OK.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
