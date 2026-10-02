/**
 * Messages shown from a URL (`?error=<code>`, `?message=<code>`), looked up
 * from fixed lists — never free text from the URL itself. Rendering whatever
 * `?error=` said would let a link like `/login?error=Your account is locked,
 * call …` show an attacker's text on the real domain, and raw Supabase error
 * text can reveal whether an email is registered. An unknown code gets a
 * generic message.
 */
const ERRORS = {
  missing_credentials: "Email and password are required.",
  too_many_attempts: "Too many attempts — try again in a minute.",
  invalid_credentials: "Email or password is incorrect.",
  email_not_confirmed: "Confirm your email first — check your inbox for the link.",
  weak_password: "Choose a stronger password.",
  invalid_email: "Enter a valid email address.",
  signup_failed: "Could not create your account. Please try again.",
  signup_disabled: "Sign-ups are currently closed.",
  login_failed: "Could not sign you in. Please try again.",
  invalid_link: "That link is invalid or has expired.",
  link_other_browser: "That link was opened in a different browser than the one you signed up in, so we couldn't sign you in here. Your email may already be confirmed — log in with your password.",
  code_required: "Enter the 6-digit code from the email.",
  invalid_code: "That code is wrong or has expired. Check the email, or send a new code.",
  code_attempts_used: "Too many wrong codes. Send a new code to try again.",
  login_locked: "Too many sign-in attempts for this email. Try again in 15 minutes, or reset your password.",
  delete_confirm_mismatch: "Type your account email exactly to confirm deletion.",
  account_load_failed: "Could not load your account.",
  delete_failed: "Could not delete your account. Please try again or contact support.",
  password_required: "Enter your new password.",
  password_mismatch: "The two new passwords don't match.",
  same_password: "Your new password must be different from your current one.",
  current_password_wrong: "Your current password is incorrect.",
  current_password_required: "Enter your current password, or email yourself a code instead.",
  password_update_failed: "Could not update your password. Please try again.",
  reset_send_failed: "Could not send the reset email. Please try again.",
  email_unchanged: "That's already your email.",
  email_change_failed: "Could not change to that email. It may already belong to another account.",
  email_link_other_browser: "We couldn't finish the email change in this browser. Open the link in the browser you're signed in on, or log in to see whether it went through.",
} as const;

const NOTICES = {
  account_deleted: "Your account has been deleted.",
  password_updated: "Your password is updated.",
  email_change_sent: "We sent a confirmation link to your new address. The change happens once you click it. If one also arrives at your current address, click that too.",
  email_change_confirm_other: "Link accepted. Now click the link sent to your other address to finish the change.",
  email_changed: "Your email is updated.",
} as const;

export type ErrorCode = keyof typeof ERRORS;
export type NoticeCode = keyof typeof NOTICES;

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** `?error=<code>` for a redirect. Typed, so a new message has to be added above first. */
export function errorParam(code: ErrorCode): string {
  return `error=${code}`;
}

export function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  // Object.hasOwn, not `in`: `in` also matches inherited properties, so
  // `?error=__proto__` would return Object.prototype and crash the page.
  return Object.hasOwn(ERRORS, code) ? ERRORS[code as ErrorCode] : GENERIC_ERROR;
}

/** `?message=<code>` notices. Unknown codes show nothing. */
export function noticeMessage(code: string | undefined): string | null {
  if (!code) return null;
  return Object.hasOwn(NOTICES, code) ? NOTICES[code as NoticeCode] : null;
}

/**
 * A Supabase Auth error as one of our codes — the raw message never reaches
 * the URL. Unlisted codes fall back to `fallback`. Supabase's own codes are
 * listed in @supabase/auth-js's error-codes.
 */
export function authErrorCode(error: { code?: string } | null | undefined, fallback: ErrorCode): ErrorCode {
  switch (error?.code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "weak_password":
      return "weak_password";
    case "same_password":
      return "same_password";
    case "email_address_invalid":
      return "invalid_email";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "too_many_attempts";
    case "signup_disabled":
    case "email_provider_disabled":
      return "signup_disabled";
    default:
      return fallback;
  }
}

/**
 * `?email=` echoed back on the check-email pages — only when it actually
 * looks like one email address, so the URL can't put arbitrary text on the
 * page ("We sent a link to <anything>").
 */
export function displayEmail(value: string | undefined): string | null {
  if (!value || value.length > 254) return null;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) ? value : null;
}
