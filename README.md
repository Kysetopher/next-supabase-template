# Next.js + Supabase template

An unbranded starting point: Next.js 16 (App Router) + TypeScript + Tailwind v4, with a complete server-side Supabase Auth shell and a shared UI component library.

All documentation lives in [docs/](docs/DOCS.md): [SETUP](docs/SETUP.md) · [PROJECT](docs/PROJECT.md) · [PRACTICES](docs/PRACTICES.md) · [AUTH](docs/AUTH.md) · [STRIPE](docs/STRIPE.md) · [CLOUDFLARE](docs/CLOUDFLARE.md) · [SKILLS](docs/SKILLS.md).

## What's in it

- **Auth** (see [docs/AUTH.md](docs/AUTH.md)): sign up with email confirmation (PKCE), log in, forgot/reset password by 6-digit code, change email, change password, delete account, log out. Session refresh in `src/middleware.ts`, `requireUser()` as the real gate, per-email Postgres rate limits that fail closed.
- **Protected app shell**: `(protected)/` layout with a slim sidebar, `/dashboard`, `/account`, and `/components` (a gallery of every UI component).
- **UI library** (`src/components/ui`): Radix-based primitives and composites — buttons, inputs, selects, dialogs, menus, tables, data table, date/time pickers, phone input, tabs, accordion, cards, motion/reveal effects and more. All colors come from semantic tokens.

## Setup

Open the project in an AI coding agent (Claude Code, Codex, …) and paste:

> Set up this project for me: read docs/SETUP.md and follow it step by step. Stop and wait for me at every USER STEP.

The agent installs everything, checks your `.env.local`, connects your hosted Supabase project, rebrands the app and verifies it, stopping for the steps only you can do (typing in your keys, signing in to Supabase, dashboard settings). Keys never go in the chat. Details: [docs/SETUP.md](docs/SETUP.md).

### Database changes

Schema changes are versioned SQL files in `supabase/migrations/` — never hand-edit a hosted database.

| Script | Does |
|---|---|
| `npm run db:new <name>` | Creates a new empty migration file |
| `npm run db:types` | Regenerates `src/lib/supabase/types.ts` from the linked project's schema |
| `npm run db:push` | Applies pending migrations to the linked hosted project |

```bash
npm run dev
```

### Checks

`npm run typecheck`, `npm run lint`, and `npm run test:e2e` (Playwright smoke tests: builds, then checks pages render, protected routes redirect, URL error codes are safe and security headers are sent — no Supabase needed). `.github/workflows/ci.yml` runs all of them plus the build and the Cloudflare Workers build on every push to `main` and every pull request.

The server checks its env vars at startup (`src/instrumentation.ts` → `src/lib/env.ts`) and refuses to start with a list of anything missing or malformed (on Cloudflare Workers, the first request fails with that list in the logs instead). Read env vars through `env` from `@/lib/env`, not `process.env`.

## Deploy

Deploys to Cloudflare Workers through OpenNext, built by Cloudflare's Workers Builds from your GitHub repository. Open the project in an AI coding agent and paste:

> Deploy this project to Cloudflare: read docs/CLOUDFLARE.md and follow the Deploy runbook step by step. Stop and wait for me at every USER STEP.

Details: [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md).

## Starting a new project from this

1. `src/lib/site.ts` — app name and description.
2. `src/app/globals.css` — color tokens in `:root` (`--primary` is the one brand color).
3. `src/app/icon.*` / `favicon.ico` — replace the icon.
4. Add pages under `src/app/(protected)/` — they're protected automatically; add public ones to `PUBLIC_ROUTES` in `src/middleware.ts`.
5. Every new table: copy the shape of `profiles` in `supabase/migrations/*_profiles_and_avatars.sql` — RLS on, one policy per allowed operation on `(select auth.uid())`, narrow grants, `references auth.users(id) on delete cascade`. New user-owned storage buckets also need a `deleteUserFiles()` call in `deleteAccount()`. Run `npm run db:types` after migrations.

## Layout

```
src/
  middleware.ts            session refresh + optimistic redirects
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
supabase/config.toml       Supabase CLI project config
e2e/                       Playwright smoke tests
wrangler.jsonc             Cloudflare Workers config (docs/CLOUDFLARE.md)
docs/AUTH.md               how auth works and why
```
