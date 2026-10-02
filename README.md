# Next.js + Supabase template

An unbranded starting point: Next.js 16 (App Router) + TypeScript + Tailwind v4, with a complete server-side Supabase Auth shell and a shared UI component library.

## What's in it

- **Auth** (see [docs/AUTH.md](docs/AUTH.md)): sign up with email confirmation (PKCE), log in, forgot/reset password by 6-digit code, change email, change password, delete account, log out. Session refresh in `src/proxy.ts`, `requireUser()` as the real gate, per-email Postgres rate limits that fail closed.
- **Protected app shell**: `(protected)/` layout with a slim sidebar, `/dashboard`, `/account`, and `/components` (a gallery of every UI component).
- **UI library** (`src/components/ui`): Radix-based primitives and composites — buttons, inputs, selects, dialogs, menus, tables, data table, date/time pickers, phone input, tabs, accordion, cards, motion/reveal effects and more. All colors come from semantic tokens.

## Setup

```bash
npm install
```

```bash
cp .env.example .env.local
```

1. Create a Supabase project and fill in `.env.local` (keys from Dashboard → Settings → API Keys).
2. Apply the migrations: `npx supabase link --project-ref <ref>` then `npm run db:push`.
3. Do the dashboard settings in [docs/AUTH.md](docs/AUTH.md#supabase-dashboard-settings-this-depends-on) — notably the **Reset Password** email template showing `{{ .Token }}` and the two redirect URLs.

Or run everything locally (needs Docker): `npm run db:start` boots Postgres, Auth and an email inbox with `supabase/config.toml` already set up for these flows (confirmations on, code-based reset template, redirect URLs), and applies every migration.

### Database changes

Schema changes are versioned SQL files in `supabase/migrations/` — never hand-edit a hosted database.

| Script | Does |
|---|---|
| `npm run db:new <name>` | Creates a new empty migration file |
| `npm run db:reset` | Rebuilds the local database from all migrations + `supabase/seed.sql` |
| `npm run db:types` | Regenerates `src/lib/supabase/types.ts` from the local schema |
| `npm run db:push` | Applies pending migrations to the linked hosted project |

```bash
npm run dev
```

### Checks

`npm run typecheck`, `npm run lint`, and `npm run test:e2e` (Playwright smoke tests: builds, then checks pages render, protected routes redirect, URL error codes are safe and security headers are sent — no Supabase needed). `.github/workflows/ci.yml` runs all of them plus the build on every push to `main` and every pull request.

The server checks its env vars at startup (`src/instrumentation.ts` → `src/lib/env.ts`) and refuses to start with a list of anything missing or malformed. Read env vars through `env` from `@/lib/env`, not `process.env`.

## Starting a new project from this

1. `src/lib/site.ts` — app name and description.
2. `src/app/globals.css` — color tokens in `:root` (`--primary` is the one brand color).
3. `src/app/icon.*` / `favicon.ico` — replace the icon.
4. Add pages under `src/app/(protected)/` — they're protected automatically; add public ones to `PUBLIC_ROUTES` in `src/proxy.ts`.
5. Every new table: copy the shape of `profiles` in `supabase/migrations/*_profiles_and_avatars.sql` — RLS on, one policy per allowed operation on `(select auth.uid())`, narrow grants, `references auth.users(id) on delete cascade`. New user-owned storage buckets also need a `deleteUserFiles()` call in `deleteAccount()`. Run `npm run db:types` after migrations.

## Layout

```
src/
  proxy.ts                 session refresh + optimistic redirects
  app/(auth)/              login, signup, check-email, forgot/reset password
  app/(protected)/         dashboard, account, components gallery
  app/auth/                PKCE callback routes
  components/ui/           the component library
  components/core/         app chrome (sidebar, header, footer)
  lib/actions/             server actions (auth, account)
  lib/auth/                email limits, fresh-sign-in check
  lib/supabase/            server/service clients, dal, db, types
  lib/rate-limit/          burst limiter, client IP
supabase/migrations/       auth limits; profiles + avatars (the RLS pattern to copy)
supabase/config.toml       local Supabase stack, preconfigured for the auth flows
e2e/                       Playwright smoke tests
docs/AUTH.md               how auth works and why
```
