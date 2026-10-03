import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { errorParam } from "@/lib/url-messages";

/**
 * Landing point for the password-reset **link** (requestPasswordReset() in
 * src/lib/actions/auth.ts sets it as `redirectTo`). This is what makes reset
 * work with Supabase's default Reset Password email, which sends a link —
 * no template edits or custom SMTP needed. With the template edited to show
 * `{{ .Token }}`, users type the 6-digit code on /reset-password instead.
 *
 * PKCE, like /auth/callback: the link only exchanges in the browser that
 * asked for the reset. The new session counts as a fresh emailed sign-in
 * (hasFreshEmailSignIn() in src/lib/auth/password.ts), so /account lets the
 * user set a new password without the current one for the next 10 minutes.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Supabase reports an expired or already-used link with ?error= / ?error_code=.
    return NextResponse.redirect(`${origin}/forgot-password?${errorParam("invalid_link")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth/recovery: code exchange failed", error.code ?? error.message);
    return NextResponse.redirect(`${origin}/forgot-password?${errorParam("reset_link_other_browser")}`);
  }

  return NextResponse.redirect(`${origin}/account?message=set_new_password`);
}
