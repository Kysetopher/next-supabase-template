# Auth

Server-only Supabase Auth on Next.js 16 (`@supabase/ssr`). There is no browser Supabase client: every auth call runs in a Server Action, Route Handler, or the proxy, and every page reads the user on the server.

## Pieces

| Path | Role |
|---|---|
| `src/proxy.ts` | Refreshes the session cookie on every non-public request; optimistic redirects (`/login` when signed out, `/dashboard` when signed in on `/login`/`/signup`). Public routes are an **allowlist**, so new pages are protected by default. |
| `src/lib/supabase/server.ts` | Request-scoped client (publishable key + cookies). RLS sees the real user. |
| `src/lib/supabase/dal.ts` | `getUser()` (cached per request, `getClaims()` — local JWT verification) and `requireUser()` (redirects to `/login`). **The real security boundary.** |
| `src/lib/supabase/db.ts` | `db()` → `{ supabase, user }` for authenticated data access. |
| `src/lib/supabase/service.ts` | Secret-key client that bypasses RLS. See below. |
| `src/lib/actions/auth.ts` | `signup`, `login`, `requestPasswordReset`, `resetPassword`, `logout`. |
| `src/lib/actions/account.ts` | `changePassword`, `changeEmail`, `deleteAccount`. |
| `src/app/(auth)/*` | `/login`, `/signup`, `/signup/check-email`, `/forgot-password`, `/reset-password`. |
| `src/app/auth/callback` | PKCE exchange for the signup confirmation link. |
| `src/app/auth/email-change` | PKCE exchange for email-change links. |
| `src/app/(protected)/*` | `/dashboard`, `/account`, gated by `requireUser()` in the layout **and** in each page. |
| `src/lib/url-messages.ts` | `?error=` / `?message=` codes → fixed strings. Never render text from the URL. |

## Flows

| Flow | How | Checks first |
|---|---|---|
| **Sign up** | `signUp()` with `emailRedirectTo: SITE_URL/auth/callback`. With "Confirm email" on, lands on `/signup/check-email`; the emailed PKCE link signs them in **in the same browser**. On another device the email is still confirmed and they're told to log in. | 5/min per IP; 3 emails/hour, 10/day per email. |
| **Log in** | `signInWithPassword()`. | 5/min per IP; 10 attempts per email per 15 min (counted before Supabase is called, unknown emails too). |
| **Forgot password** (`/forgot-password` → `/reset-password`) | `resetPasswordForEmail()` emails a **6-digit code**; `verifyOtp({ type: "recovery" })` signs in, then the password is set. Works on any device. Both pages look identical whether or not the account exists. | 5/min per IP; 3 codes/hour, 10/day per email; 5 guesses per code. |
| **Change password** (`/account`) | `updateUser({ password })`. | Current password (real `signInWithPassword`, burst-limited per account), **or** an emailed-code sign-in in the last 10 min (`hasFreshEmailSignIn()`, from the JWT `amr` claim). |
| **Change email** (`/account`) | `updateUser({ email })` with a PKCE link to `/auth/email-change`. | Same identity check as change password; per-email send limit on the new address. |
| **Delete account** (`/account`) | Type the account email, then `auth.admin.deleteUser()` via the service client. App tables should `references auth.users(id) on delete cascade`. | Confirmation must match the **session's** email. |

## Supabase dashboard settings this depends on

1. **Authentication → Providers → Email**: "Confirm email" **on**; "Secure email change" **on**; "Secure password change" (require reauthentication) **on**.
2. **Authentication → Email Templates → Reset Password**: show the code, not the link — e.g. `<p>Your code is <strong>{{ .Token }}</strong></p>`. If it still shows `{{ .ConfirmationURL }}` the reset page has nothing to type.
3. **Authentication → URL Configuration**: Site URL = `SITE_URL`; Redirect URLs include `SITE_URL/auth/callback` and `SITE_URL/auth/email-change` (otherwise Supabase sends links to the Site URL and the flows never complete).
4. **Database → Extensions**: `pg_cron` (the migration enables it; it prunes old limit rows nightly).
5. Run `supabase/migrations/*_auth_limits.sql` (`npx supabase db push`, or paste it into the SQL editor).

## Rate limiting is layered

- **Burst** (`src/lib/rate-limit/burst.ts`): 5/min per action + IP. In-memory, **per instance**, fails open. Swap the body of `checkBurst()` for a shared store (Cloudflare rate-limit binding, Upstash, …) in production if you need it to hold across instances.
- **Exact per-email** (`src/lib/auth/email-limits.ts` + the migration): Postgres counters, **fail closed**. This is the layer that actually stops inbox flooding, code brute force and distributed password guessing.

`getClientIp()` trusts `cf-connecting-ip`, then `x-real-ip`, then `x-forwarded-for`. Make sure your host sets/overwrites the header you rely on.

## Route protection is layered, not singular

1. `src/proxy.ts` — optimistic, cookie-based, keeps signed-out users from rendering pages that would bounce.
2. `requireUser()` in `(protected)/layout.tsx` — gates the segment on first load.
3. `requireUser()` / `db()` in every page and action that reads or writes user data — layouts don't re-run on client navigation, so never rely on the layout alone.
4. Postgres RLS — the request-scoped client uses the publishable key, so every table you add needs RLS policies on `auth.uid()`.

API routes (`/api/*`) are excluded from the proxy: call `getUser()` yourself and return a JSON 401.

## Never use `getSession()` for authorization

`getSession()` reads the cookie without verifying it. Use `getUser()` from `dal.ts` (verified `getClaims()`), or `supabase.auth.getUser()` where a live value matters.

## The service client

`createServiceClient()` bypasses RLS. It's used for exactly two things: the pre-session auth limits and deleting the caller's own `auth.users` row (the Admin API requires the secret key). Don't import it into anything that reads or writes user data on behalf of a request — use `createClient()` so RLS applies.

## Deploying to Cloudflare Workers (OpenNext)

`@opennextjs/cloudflare` doesn't support Next 16's `proxy.ts` yet. Rename `src/proxy.ts` → `src/middleware.ts` and `export async function proxy` → `export async function middleware`; nothing else changes. Keep the file **inside `src/`** (next to `app/`) — Next only picks it up at the same level as the `app` directory.

## Env vars

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SITE_URL` — none are `NEXT_PUBLIC_`, since nothing reads them in the browser. See `.env.example`.

Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
