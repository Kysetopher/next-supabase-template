import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/** How long after an emailed-code sign-in a password can be set without the current one. */
const FRESH_EMAIL_SIGN_IN_SECONDS = 10 * 60;

/** AMR methods that mean "proved control of the inbox": a recovery code, a sign-in code or magic link, a signup confirmation link. */
const EMAIL_METHODS = new Set(["recovery", "otp", "magiclink", "email/signup"]);

/**
 * True if this session signed in by an emailed code or link in the last 10
 * minutes. Such a session may set a new password without the current one:
 * it just proved control of the inbox, which is what a reset proves anyway.
 * An older session has to give the current password (or get a new code), so
 * a stolen or forgotten-open session can't quietly take over the account by
 * setting one. Read from the verified JWT's `amr` claim.
 */
export async function hasFreshEmailSignIn(
  supabase: SupabaseClient<Database>,
  maxAgeSeconds: number = FRESH_EMAIL_SIGN_IN_SECONDS
): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  const amr = data?.claims.amr;
  if (!Array.isArray(amr)) return false;
  const now = Math.floor(Date.now() / 1000);
  // Entries are { method, timestamp } objects; the RFC 8176 form is plain
  // strings, which carry no time and so never count as fresh.
  return amr.some(
    (entry) =>
      typeof entry !== "string" && EMAIL_METHODS.has(entry.method) && now - entry.timestamp <= maxAgeSeconds
  );
}
