import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
};

// Cached per request — safe to call from multiple Server Components/layouts
// without triggering repeat network calls to Supabase.
//
// Uses getClaims(), not getUser(). src/middleware.ts already makes one network
// round trip to Supabase's Auth server per request (to refresh the token,
// which only middleware/Route Handlers/Server Actions can do — see docs/AUTH.md).
// getClaims() verifies the JWT locally instead, against a cached public key,
// when the project signs tokens asymmetrically (check the project's
// /auth/v1/.well-known/jwks.json for an ES256/RS256 key). It falls back to
// getUser() automatically if a token arrives symmetrically signed.
//
// Caveat: claims are a snapshot from token issue/refresh time, not a live
// read. Fine for `id` (immutable); `email` can lag an email change by up to
// one token lifetime — /auth/email-change issues a fresh session to avoid
// exactly that. Use supabase.auth.getUser() where a live value matters.
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return { id: data.claims.sub, email: data.claims.email ?? null };
});

export async function requireUser() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
