import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Exact per-email limits on auth emails, reset-code guesses and password
 * logins — Postgres functions from supabase/migrations/*_auth_limits.sql.
 * Unlike the burst limiter (src/lib/rate-limit/burst.ts: per instance, fails
 * open), these are one counter per email and **fail closed**: any error
 * means "no".
 *
 * Service client: there's no session yet at this point (sign-in hasn't
 * happened), so there's no identity to scope an RLS policy by. The tables
 * have no user grants; users can't reach them.
 */

/**
 * One canonical form of an email for everything that keys on it: this
 * limiter and Supabase. NFKC folds look-alike Unicode
 * forms, then trim and lowercase. Returns null for anything that isn't a
 * plain printable-ASCII address, so Unicode variants can't become separate
 * rate-limit keys for the same account.
 */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.normalize("NFKC").trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  return /^[\x21-\x7e]+@[\x21-\x7e]+\.[\x21-\x7e]+$/.test(email) ? email : null;
}

async function rpcBoolean(
  fn: "auth_email_send_allowed" | "auth_code_guess_allowed" | "auth_login_attempt_allowed",
  email: string
): Promise<boolean> {
  try {
    const { data, error } = await createServiceClient().rpc(fn, { p_email: email });
    if (error) {
      console.error(`email-limits: ${fn} failed, refusing`, error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error(`email-limits: ${fn} threw, refusing`, error);
    return false;
  }
}

/** True, and counted, if another sign-in or confirmation email may go to this address now (3/hour, 10/day). Doesn't touch the guess count: allowing a send isn't a new code existing (recordCodeSent does that). */
export function allowEmailSend(email: string): Promise<boolean> {
  return rpcBoolean("auth_email_send_allowed", email);
}

/** Counts one guess at the current code and says whether it's within the 5 allowed per code. */
export function allowCodeGuess(email: string): Promise<boolean> {
  return rpcBoolean("auth_code_guess_allowed", email);
}

/**
 * A new code really was issued (the send succeeded): it gets a fresh 5
 * guesses. Called only after a successful send, never from signup(), so a
 * send that's allowed but doesn't happen can't reset the count. Best effort:
 * a failure here only leaves the old count in place.
 */
export async function recordCodeSent(email: string): Promise<void> {
  const { error } = await createServiceClient().rpc("auth_code_sent", { p_email: email });
  if (error) console.error("email-limits: auth_code_sent failed", error);
}

/** A correct code: the next sign-in starts with a fresh guess count. Best effort; a failure here only costs the user a guess. */
export async function recordCodeSuccess(email: string): Promise<void> {
  const { error } = await createServiceClient().rpc("auth_code_succeeded", { p_email: email });
  if (error) console.error("email-limits: auth_code_succeeded failed", error);
}

/**
 * Password logins: counts one attempt and says whether it's within the 10
 * allowed per email in 15 minutes.
 * Counted before Supabase is called, and for unknown emails too, so it neither
 * leaks which emails exist nor lets parallel guesses slip past together.
 */
export function allowLoginAttempt(email: string): Promise<boolean> {
  return rpcBoolean("auth_login_attempt_allowed", email);
}

/** A correct password: the next login starts from zero. Best effort; a failure here only leaves the count until the window ends. */
export async function recordLoginSuccess(email: string): Promise<void> {
  const { error } = await createServiceClient().rpc("auth_login_succeeded", { p_email: email });
  if (error) console.error("email-limits: auth_login_succeeded failed", error);
}
