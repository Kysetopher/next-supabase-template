/**
 * Server env vars, checked once at boot (src/instrumentation.ts) so a missing
 * or malformed value stops the server with a plain message instead of
 * failing deep inside the first request. On Cloudflare Workers that check
 * runs on the first request instead, and the getters below throw per
 * variable wherever it didn't run (the middleware). Read them through `env` rather than
 * `process.env.X!`. See .env.example for where each value comes from.
 */
const VARS = {
  SUPABASE_URL: "your Supabase project URL (Dashboard > Connect, or Integrations > Data API > API URL)",
  SUPABASE_PUBLISHABLE_KEY: "the publishable key (Dashboard > Settings > API Keys)",
  SUPABASE_SECRET_KEY: "the secret key (Dashboard > Settings > API Keys)",
  SITE_URL: "the origin this app is served from, e.g. http://localhost:3000",
} as const;

type EnvName = keyof typeof VARS;

function problem(name: EnvName, value: string | undefined): string | null {
  if (!value?.trim()) return `${name} is not set — ${VARS[name]}`;
  if (name === "SUPABASE_URL" || name === "SITE_URL") {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return `${name} must be a full URL (got "${value}")`;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return `${name} must start with http:// or https://`;
    if (name === "SITE_URL" && (value.endsWith("/") || url.pathname !== "/")) {
      return `SITE_URL must be an origin with no path or trailing slash (got "${value}")`;
    }
  }
  // Catch the two Supabase keys swapped: the publishable one is committed in
  // wrangler.jsonc, so a secret key pasted there would be published. Legacy
  // anon/service_role JWTs (eyJ…) are still accepted.
  if (name === "SUPABASE_PUBLISHABLE_KEY" && !/^(sb_publishable_|eyJ)/.test(value.trim())) {
    return "SUPABASE_PUBLISHABLE_KEY must start with sb_publishable_ — is the secret key in its place?";
  }
  if (name === "SUPABASE_SECRET_KEY" && !/^(sb_secret_|eyJ)/.test(value.trim())) {
    return "SUPABASE_SECRET_KEY must start with sb_secret_ — is the publishable key in its place?";
  }
  return null;
}

/**
 * Stripe is optional and all-or-nothing: set none of these and billing is
 * off (the app runs, billing pages 404, the webhook answers 503); set all
 * three and it's on; set some and the server refuses to start. See
 * docs/STRIPE.md.
 */
const BILLING_VARS = {
  STRIPE_SECRET_KEY: "the secret key, sk_test_... or sk_live_... (or a restricted rk_ key) (Stripe Dashboard > Developers > API keys)",
  STRIPE_PUBLISHABLE_KEY: "the publishable key, pk_test_... or pk_live_... (Stripe Dashboard > Developers > API keys)",
  STRIPE_WEBHOOK_SECRET: "the webhook signing secret, whsec_... (Stripe Dashboard > Developers > Webhooks > your endpoint, or printed by `stripe listen`)",
} as const;

type BillingEnvName = keyof typeof BILLING_VARS;

const BILLING_PREFIXES: Record<BillingEnvName, readonly string[]> = {
  STRIPE_SECRET_KEY: ["sk_test_", "sk_live_", "rk_test_", "rk_live_"],
  STRIPE_PUBLISHABLE_KEY: ["pk_test_", "pk_live_"],
  STRIPE_WEBHOOK_SECRET: ["whsec_"],
};

const BILLING_NAMES = Object.keys(BILLING_VARS) as BillingEnvName[];

function isSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function keyMode(value: string): "test" | "live" {
  return value.includes("_live_") ? "live" : "test";
}

/** Problems with the Stripe group. Empty when none are set (billing off) or all are set and well-formed. */
function billingProblems(): string[] {
  const set = BILLING_NAMES.filter(isSet);
  if (!set.length) return [];

  const problems: string[] = [];
  for (const name of BILLING_NAMES) {
    if (!set.includes(name)) {
      problems.push(`${name} is not set — ${BILLING_VARS[name]}. The Stripe variables are all-or-nothing: set all three, or none to run without billing.`);
      continue;
    }
    const value = process.env[name]!.trim();
    if (!BILLING_PREFIXES[name].some((prefix) => value.startsWith(prefix))) {
      problems.push(`${name} must start with ${BILLING_PREFIXES[name].join(" or ")} — ${BILLING_VARS[name]}`);
    }
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const publishable = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  if (secret && publishable && keyMode(secret) !== keyMode(publishable)) {
    problems.push(
      `STRIPE_SECRET_KEY is a ${keyMode(secret)}-mode key but STRIPE_PUBLISHABLE_KEY is ${keyMode(publishable)}-mode — use both keys from the same mode`
    );
  }
  return problems;
}

/**
 * True when all three Stripe variables are set and valid. Every billing
 * page, action and route checks this first; with billing off they 404 (or
 * 503 for the webhook) and nothing touches Stripe or the billing tables.
 */
export function isBillingEnabled(): boolean {
  return BILLING_NAMES.every(isSet) && billingProblems().length === 0;
}

/** Throws one error listing every missing or malformed variable. */
export function assertEnv(): void {
  const problems = (Object.keys(VARS) as EnvName[])
    .map((name) => problem(name, process.env[name]))
    .filter((message): message is string => message !== null)
    .concat(billingProblems());

  if (problems.length) {
    throw new Error(
      `Missing or invalid environment variables:\n${problems.map((p) => `  - ${p}`).join("\n")}\n` +
        "Copy .env.example to .env.local and restart. Deployed: wrangler.jsonc vars and Cloudflare Secrets (docs/CLOUDFLARE.md)."
    );
  }
}

function read(name: EnvName): string {
  const value = process.env[name];
  const message = problem(name, value);
  if (message) throw new Error(message);
  return value!;
}

function readBilling(name: BillingEnvName): string {
  if (!isBillingEnabled()) {
    const problems = billingProblems();
    throw new Error(
      problems.length
        ? `Stripe is misconfigured:\n${problems.map((p) => `  - ${p}`).join("\n")}`
        : `${name} was read but billing is disabled (no STRIPE_* variables are set). Check isBillingEnabled() before calling billing code — see docs/STRIPE.md.`
    );
  }
  return process.env[name]!.trim();
}

/**
 * The Stripe Price id in env var `name` (see src/lib/billing/products.ts —
 * each product names its own STRIPE_PRICE_* variable). Price ids aren't
 * secrets; they live in env so test and live mode can differ per deploy.
 */
export function readStripePriceId(name: string): string {
  if (!/^STRIPE_PRICE_[A-Z0-9_]+$/.test(name)) {
    throw new Error(`Price env var names must look like STRIPE_PRICE_<NAME> (got "${name}")`);
  }
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set — the Stripe Price id for this product (Stripe Dashboard > Product catalog > the product > its price, price_...)`);
  if (!value.startsWith("price_")) throw new Error(`${name} must be a Stripe Price id starting with price_ (got "${value}")`);
  return value;
}

export const env = {
  get SUPABASE_URL() {
    return read("SUPABASE_URL");
  },
  get SUPABASE_PUBLISHABLE_KEY() {
    return read("SUPABASE_PUBLISHABLE_KEY");
  },
  get SUPABASE_SECRET_KEY() {
    return read("SUPABASE_SECRET_KEY");
  },
  get SITE_URL() {
    return read("SITE_URL");
  },
  /** Billing getters throw unless isBillingEnabled(). */
  get STRIPE_SECRET_KEY() {
    return readBilling("STRIPE_SECRET_KEY");
  },
  get STRIPE_PUBLISHABLE_KEY() {
    return readBilling("STRIPE_PUBLISHABLE_KEY");
  },
  get STRIPE_WEBHOOK_SECRET() {
    return readBilling("STRIPE_WEBHOOK_SECRET");
  },
};
