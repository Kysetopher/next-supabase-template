import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Layer 1 of rate limiting: per-minute burst limits keyed per action + IP
 * (or per user once one exists). Stops a script hammering an endpoint.
 *
 * On Cloudflare Workers (and in `next dev` / `npm run preview`, which emulate
 * them) each policy is a Workers rate-limit binding declared in
 * wrangler.jsonc, where its limit and period live. Cloudflare counts per
 * location and calls it "permissive, eventually consistent", so it's a speed
 * bump, not an exact count.
 *
 * Anywhere without the binding (`next start`, which the e2e tests use) it
 * falls back to an in-memory fixed window with the same numbers, counted
 * **per server instance**. Either way this layer fails open by design — the
 * exact limits that matter (per-email sends, code guesses, login attempts)
 * live in Postgres and fail closed (src/lib/auth/email-limits.ts).
 */
const POLICIES = {
  /** Signup, login, reset-code sends and guesses, re-auth. 5 / 60s. */
  auth: { binding: "RATE_LIMIT_AUTH", limit: 5, windowMs: 60_000 },
  /** Opening the billing portal, one-click purchases. 10 / 60s per user. */
  billing: { binding: "RATE_LIMIT_BILLING", limit: 10, windowMs: 60_000 },
} as const satisfies Record<string, { binding: keyof CloudflareEnv; limit: number; windowMs: number }>;

export type BurstPolicy = keyof typeof POLICIES;

/** Every policy's period, in seconds. Used for Retry-After. */
export const BURST_PERIOD_SECONDS = 60;

const MAX_TRACKED_KEYS = 10_000;
const windows = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}

/**
 * The policy's Workers binding, or null where there's no Cloudflare context
 * (e.g. `next start`).
 *
 * Sync mode on purpose. The context is already there on Workers and in
 * `next dev`; when it isn't, the sync call throws, which is the signal to
 * fall back. The async mode would instead start a local Workers emulator
 * (wrangler's getPlatformProxy) inside a plain Node server, and count there.
 */
function getBinding(policy: BurstPolicy): RateLimitBinding | null {
  try {
    return getCloudflareContext().env[POLICIES[policy].binding] ?? null;
  } catch {
    return null;
  }
}

function checkInMemory(policy: BurstPolicy, id: string): boolean {
  const { limit, windowMs } = POLICIES[policy];
  const now = Date.now();

  if (windows.size > MAX_TRACKED_KEYS) prune(now);

  const entry = windows.get(id);
  if (!entry || entry.resetAt <= now) {
    windows.set(id, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

/**
 * True if the request may proceed. Fails open — any error allows the request
 * and logs, since this layer is abuse protection, not the security boundary.
 */
export async function checkBurst(policy: BurstPolicy, key: string): Promise<boolean> {
  try {
    const id = `${policy}:${key}`;
    const binding = getBinding(policy);
    const success = binding ? (await binding.limit({ key: id })).success : checkInMemory(policy, id);
    if (!success) console.warn(`rate-limit: burst limit hit`, { policy, key });
    return success;
  } catch (error) {
    console.error(`rate-limit: ${policy} check failed, allowing request`, error);
    return true;
  }
}
