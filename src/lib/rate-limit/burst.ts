import "server-only";

/**
 * Layer 1 of rate limiting: per-minute burst limits keyed per action + IP
 * (or per user once one exists). Stops a script hammering an endpoint.
 *
 * This default is an in-memory fixed window, so it counts **per server
 * instance**: on serverless hosts each warm instance has its own counters,
 * and a cold start resets them. That's acceptable for this layer because it
 * fails open by design — the exact limits that matter (per-email sends, code
 * guesses, login attempts) live in Postgres and fail closed
 * (src/lib/auth/email-limits.ts). For a shared counter, swap the body of
 * checkBurst() for your platform's limiter (Cloudflare's rate-limit binding,
 * Upstash, Vercel KV, ...) and keep the signature.
 */
const POLICIES = {
  /** Signup, login, reset-code sends and guesses, re-auth. 5 / 60s. */
  auth: { limit: 5, windowMs: 60_000 },
  /** Opening the billing portal, one-click purchases. 10 / 60s per user. */
  billing: { limit: 10, windowMs: 60_000 },
} as const;

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
 * True if the request may proceed. Fails open — any error allows the request
 * and logs, since this layer is abuse protection, not the security boundary.
 */
export async function checkBurst(policy: BurstPolicy, key: string): Promise<boolean> {
  try {
    const { limit, windowMs } = POLICIES[policy];
    const now = Date.now();
    const id = `${policy}:${key}`;

    if (windows.size > MAX_TRACKED_KEYS) prune(now);

    const entry = windows.get(id);
    if (!entry || entry.resetAt <= now) {
      windows.set(id, { count: 1, resetAt: now + windowMs });
      return true;
    }

    entry.count += 1;
    const success = entry.count <= limit;
    if (!success) console.warn(`rate-limit: burst limit hit`, { policy, key });
    return success;
  } catch (error) {
    console.error(`rate-limit: ${policy} check failed, allowing request`, error);
    return true;
  }
}
