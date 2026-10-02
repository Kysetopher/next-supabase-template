import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";

/**
 * Single entry point for authenticated data access. Every call site gets:
 *  - the request-scoped Supabase client (cookies-bound, so Postgres RLS
 *    policies see the same user via `auth.uid()`)
 *  - the current user, already verified — redirects to /login otherwise
 *
 * Use this instead of calling createClient() directly whenever a query
 * should be scoped to "the current user's data".
 */
export async function db() {
  const [supabase, user] = await Promise.all([createClient(), requireUser()]);

  return { supabase, user };
}
