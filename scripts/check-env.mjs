// Checks .env.local the same way the server does at startup
// (src/instrumentation.ts: src/lib/env.ts, then the billing product catalog
// when billing is on), without starting anything and without printing any
// secret values. Run with `npm run check:env`.
import { registerHooks } from "node:module";

// Resolve the app's `@/…` import alias (tsconfig paths) to src/…ts, so the
// catalog's `import … from "@/lib/env"` loads under plain Node.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier.startsWith("@/")
      ? nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context)
      : nextResolve(specifier, context);
  },
});

try {
  const { assertEnv, isBillingEnabled } = await import("../src/lib/env.ts");
  assertEnv();
  if (isBillingEnabled()) {
    const { assertProducts } = await import("../src/lib/billing/products.ts");
    assertProducts();
  }
  console.log("Environment OK.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
