import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { errorParam } from "@/lib/url-messages";

/**
 * Landing point for the email-change confirmation link(s) from changeEmail()
 * (src/lib/actions/account.ts). Its own route rather than /auth/callback so
 * the outcome goes back to /account, not the post-signup destination.
 *
 * With "Secure email change" on, Supabase sends a link to both the current
 * and the new address. The first one clicked only records that half, and
 * Supabase redirects here without a `code`. The second completes the change
 * and arrives with a PKCE `code`, which only exchanges in the browser that
 * asked for the change (same reasoning as /auth/callback). The exchange also
 * issues a fresh session, so the JWT-based getUser() in dal.ts shows the new
 * email straight away.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Supabase reports a bad or expired link with ?error= / ?error_code=.
    const failed = searchParams.has("error") || searchParams.has("error_code");
    return NextResponse.redirect(
      `${origin}/account?${failed ? errorParam("invalid_link") : "message=email_change_confirm_other"}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    if (error) console.error("auth/email-change: code exchange failed", error.code ?? error.message);
    return NextResponse.redirect(`${origin}/login?${errorParam("email_link_other_browser")}`);
  }

  // Sync the new address anywhere else it's stored (e.g. a billing
  // customer) here, before redirecting.

  return NextResponse.redirect(`${origin}/account?message=email_changed`);
}
