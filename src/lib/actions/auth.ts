"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { checkBurst } from "@/lib/rate-limit/burst";
import { getClientIp } from "@/lib/rate-limit/http";
import { authErrorCode, errorParam } from "@/lib/url-messages";
import { AFTER_SIGN_IN_PATH } from "@/lib/auth/after-sign-in";
import {
  allowCodeGuess,
  allowEmailSend,
  allowLoginAttempt,
  normalizeEmail,
  recordCodeSent,
  recordCodeSuccess,
  recordLoginSuccess,
} from "@/lib/auth/email-limits";

/**
 * Per-IP burst limit on every pre-auth action (docs/AUTH.md "Limits"). These
 * actions call Supabase Auth from our server, so Supabase's own per-IP limits
 * see the server's IP rather than the user's — this is the only per-user-IP
 * limit there is.
 */
async function allowAuthAttempt(action: "signup" | "login" | "reset-request" | "reset-code") {
  return checkBurst("auth", `${action}:${await getClientIp()}`);
}

function readCredentials(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return null;
  }

  return { email, password };
}

export async function signup(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials) {
    redirect(`/signup?${errorParam("missing_credentials")}`);
  }

  // Per IP, then an exact per-email cap on confirmation emails (3/hour,
  // 10/day; src/lib/auth/email-limits.ts), so nobody can flood an inbox or
  // use up the project's email allowance by signing up one address over and
  // over.
  if (!(await allowAuthAttempt("signup")) || !(await allowEmailSend(credentials.email))) {
    redirect(`/signup?${errorParam("too_many_attempts")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${env.SITE_URL}/auth/callback` },
  });

  if (error) {
    redirect(`/signup?${errorParam(authErrorCode(error, "signup_failed"))}`);
  }

  // With "Confirm email" on (Supabase Auth → Providers → Email — assumed on),
  // signUp() returns no session: the account only becomes usable once the
  // emailed link lands on /auth/callback. It also returns no session, and no
  // error, for an already-registered email (Supabase's anti-enumeration
  // behavior), so both cases get the same page. A session here only happens
  // if that setting is off.
  if (!data.session) {
    redirect(`/signup/check-email?email=${encodeURIComponent(credentials.email)}`);
  }

  redirect(AFTER_SIGN_IN_PATH);
}

export async function login(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials) {
    redirect(`/login?${errorParam("missing_credentials")}`);
  }

  if (!(await allowAuthAttempt("login"))) {
    redirect(`/login?${errorParam("too_many_attempts")}`);
  }
  // Per account, not just per IP: guesses spread across many IPs against one
  // email stop here, before Supabase is asked.
  if (!(await allowLoginAttempt(credentials.email))) {
    redirect(`/login?${errorParam("login_locked")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirect(`/login?${errorParam(authErrorCode(error, "login_failed"))}`);
  }

  await recordLoginSuccess(credentials.email);
  redirect(AFTER_SIGN_IN_PATH);
}

/**
 * Supabase's per-user cooldown ("For security purposes, you can only request
 * this after N seconds"): it only ever hits an existing account, so showing it
 * would tell a prober which emails are registered. It gets the same answer as
 * a send. Supabase's project-wide email limit uses the same code with a
 * different message and still shows as an error: hiding it would hide a real
 * outage.
 */
function isResendCooldown(error: { code?: string; message?: string }): boolean {
  return error.code === "over_email_send_rate_limit" && /for security purposes/i.test(error.message ?? "");
}

function resetPasswordPage(email: string, error?: Parameters<typeof errorParam>[0]) {
  return `/reset-password?email=${encodeURIComponent(email)}${error ? `&${errorParam(error)}` : ""}`;
}

/**
 * "Forgot password?" — emails a 6-digit recovery code (Supabase's **Reset
 * Password** template, edited to show `{{ .Token }}`; see docs/AUTH.md),
 * typed on /reset-password. A code rather than a link: it works whichever
 * device the email is read on, and is useless without our page. Limits: per
 * IP, then 3 an hour and 10 a day per email in Postgres.
 *
 * Always lands on /reset-password, whether or not the email has an account:
 * Supabase sends nothing to an unknown address and returns no error, so the
 * page can't be used to find out who's registered.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  if (!email) {
    redirect(`/forgot-password?${errorParam("invalid_email")}`);
  }

  if (!(await allowAuthAttempt("reset-request")) || !(await allowEmailSend(email))) {
    redirect(`/forgot-password?email=${encodeURIComponent(email)}&${errorParam("too_many_attempts")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  // An unknown email gets no error here, so the cooldown answers the same.
  if (error && !isResendCooldown(error)) {
    redirect(`/forgot-password?email=${encodeURIComponent(email)}&${errorParam(authErrorCode(error, "reset_send_failed"))}`);
  }
  // A new reset code exists: it gets a fresh 5 guesses. Sends don't reset the
  // count themselves, so without this, 5 wrong codes would lock the reset
  // flow for good, even after "Send a new code".
  if (!error) await recordCodeSent(email);

  redirect(resetPasswordPage(email));
}

/**
 * The recovery code from requestPasswordReset() plus the new password, on
 * /reset-password. The code signs the user in; the password is then set on
 * that session. If Supabase rejects the password after the code has been
 * used (too weak, found in a breach), the user is already signed in with a
 * fresh emailed-code session, so /account lets them pick another without a
 * current password or a second code (hasFreshEmailSignIn()).
 */
export async function resetPassword(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const code = formData.get("code");
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  if (!email) {
    redirect(`/forgot-password?${errorParam("invalid_email")}`);
  }
  const token = typeof code === "string" ? code.replace(/\s+/g, "") : "";
  if (!/^\d{6,10}$/.test(token)) {
    redirect(resetPasswordPage(email, "code_required"));
  }
  if (typeof password !== "string" || !password) {
    redirect(resetPasswordPage(email, "password_required"));
  }
  if (password !== confirm) {
    redirect(resetPasswordPage(email, "password_mismatch"));
  }

  // Per IP, then the exact per-code limit in Postgres: 5 guesses per code
  // sent, fail-closed. Counted before verifyOtp, so concurrent guesses can't
  // slip past it.
  if (!(await allowAuthAttempt("reset-code"))) {
    redirect(resetPasswordPage(email, "too_many_attempts"));
  }
  if (!(await allowCodeGuess(email))) {
    redirect(resetPasswordPage(email, "code_attempts_used"));
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
  if (verifyError) {
    redirect(resetPasswordPage(email, authErrorCode(verifyError, "invalid_code")));
  }
  await recordCodeSuccess(email);

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    redirect(`/account?${errorParam(authErrorCode(updateError, "password_update_failed"))}`);
  }

  redirect("/account?message=password_updated");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
