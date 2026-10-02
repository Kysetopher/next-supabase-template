import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { AFTER_SIGN_IN_PATH } from "@/lib/auth/after-sign-in";
import { errorParam } from "@/lib/url-messages";

/**
 * PKCE code-exchange landing point for the signup confirmation link
 * (`emailRedirectTo` in signup(), src/lib/actions/auth.ts).
 *
 * PKCE ties the link to the browser that started the signup: a one-time
 * secret sits in that browser's cookies, so the link alone can't create a
 * session anywhere else (a forwarded email, a mail scanner, someone reading
 * the inbox). Kept deliberately rather than a bearer token-hash link. The
 * cost is that opening the link on another device doesn't sign the user in
 * there. By then Supabase has already confirmed the email, so
 * `link_other_browser` sends them to log in with their password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?${errorParam("invalid_link")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    if (error) console.error("auth/callback: code exchange failed", error.code ?? error.message);
    return NextResponse.redirect(`${origin}/login?${errorParam(error ? "link_other_browser" : "login_failed")}`);
  }

  return NextResponse.redirect(`${origin}${AFTER_SIGN_IN_PATH}`);
}
