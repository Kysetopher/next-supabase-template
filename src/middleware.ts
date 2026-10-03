import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

// middleware.ts, not Next 16's proxy.ts, on purpose: this app deploys to
// Cloudflare Workers via @opennextjs/cloudflare, which runs middleware on the
// edge runtime it supports. proxy.ts is Node.js-runtime only, and OpenNext
// marks Node.js middleware on Workers as experimental and unmaintained. The
// deprecated name still works in Next 16. Keep this file in src/, next to
// app/ — Next only finds it there. See docs/AUTH.md.
//
// Inverted on purpose: an allowlist of what's PUBLIC, not a list of what's
// protected. A protected list drifts out of sync the moment a new page is
// added and silently stops covering it. With a public list, forgetting to add
// a new public page just means it's redirect-gated unnecessarily (annoying,
// safe). Every non-public, non-auth-only path is protected by default, so a
// new page under `(protected)/` needs zero changes to this file.
//
// This is the optimistic check only; requireUser() in src/lib/supabase/dal.ts
// is the actual security boundary (docs/AUTH.md).
//
// /auth/callback is public: it runs before any session cookie exists (it's
// what *creates* one, via exchangeCodeForSession) and manages its own cookie
// writes directly. /signup/check-email is where signup() lands when "Confirm
// email" leaves the new account without a session yet. /forgot-password and
// /reset-password are for users who can't log in, but signed-in users use
// them too, so they're public rather than auth-only. /auth/email-change is
// opened from an email, maybe logged out, like /auth/callback.
const PUBLIC_ROUTES = [
  "/",
  "/signup/check-email",
  "/auth/callback",
  "/auth/email-change",
  "/auth/recovery",
  "/forgot-password",
  "/reset-password",
];
const AUTH_ONLY_ROUTES = ["/login", "/signup"];

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  // Public pages need no auth information at all, so skip creating a
  // Supabase client and calling getUser() for them — that call is a real
  // network round trip to Supabase's Auth server, and paying it on every
  // anonymous visit (plus every crawler hit) for a value that's never
  // consulted is pure waste.
  //
  // Safe to skip the token-refresh side effect here too: a logged-in user
  // idly on a public page doesn't need their token refreshed on this
  // request — the moment they navigate to a non-public page, this function
  // runs getUser() there and refreshes it before that page renders.
  if (PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Revalidates the token against Supabase and refreshes it if needed.
  // Do not remove — Server Components can't write cookies, and Supabase's
  // refresh token rotates on use, so without this the next request replays
  // an already-rotated token and the user is silently logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `pathname` is already known not to be in PUBLIC_ROUTES (handled above),
  // so every remaining path is either auth-only or protected-by-default.
  const isAuthOnly = AUTH_ONLY_ROUTES.includes(request.nextUrl.pathname);

  if (!isAuthOnly && !user) {
    return redirectWithCookies(new URL("/login", request.url), response);
  }

  if (isAuthOnly && user) {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    // `api/` excluded because API routes should do their own getUser() check
    // and return a JSON 401 — a redirect to the /login *page* would be wrong
    // for a fetch caller expecting JSON. Their own Supabase client
    // (src/lib/supabase/server.ts) can refresh-and-write the cookie itself
    // from a Route Handler, so skipping the middleware there doesn't lose the
    // refresh either.
    //
    // icon/apple-icon/opengraph-image/twitter-image/robots.txt/sitemap.xml
    // excluded because they're metadata-file routes, not page navigations —
    // redirecting a favicon or sitemap fetch to /login would just break it.
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|icon|apple-icon|opengraph-image|twitter-image|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
