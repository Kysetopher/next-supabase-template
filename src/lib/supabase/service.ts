import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { env } from "@/lib/env";

/**
 * Bypasses Row Level Security entirely. This is the ONLY client in this
 * codebase allowed to do that, and it exists for the cases where there is no
 * user session to act as:
 *
 *  - the per-email auth limits (src/lib/auth/email-limits.ts), which run
 *    before anyone is signed in;
 *  - deleting the caller's own auth.users row (deleteAccount() in
 *    src/lib/actions/account.ts), which Supabase's Admin API only allows with
 *    the secret key.
 *
 * Do NOT use it to read or write user data on behalf of a request — Server
 * Components, Server Actions and Route Handlers use src/lib/supabase/server.ts
 * (createClient), so Postgres RLS sees the real user. See docs/AUTH.md.
 */
export function createServiceClient() {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY
  );
}
