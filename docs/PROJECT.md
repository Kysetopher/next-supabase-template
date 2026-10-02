# Project

An unbranded starting point for web apps: Next.js 16 (App Router) + TypeScript + Tailwind v4 on Supabase, with a complete server-side auth shell, optional Stripe billing, and a shared UI component library. Every project starts as a copy of this repository; nothing in it names a product or client.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind v4 (`@tailwindcss/postcss`), semantic tokens in `src/app/globals.css`, `tw-animate-css` |
| UI | Our own component library on Radix primitives, `@iconify/react` icons, `simplebar-react` scrolling |
| Data + auth | Supabase (Postgres, Auth, Storage) through `@supabase/ssr`, server-side only |
| Billing | Stripe (optional) — [STRIPE.md](STRIPE.md) |
| Tests | Playwright smoke tests; GitHub Actions CI |

## Routes

| Route | Access | What |
|---|---|---|
| `/` | public | Landing page |
| `/login`, `/signup` | signed-out only | Credentials forms |
| `/signup/check-email`, `/forgot-password`, `/reset-password` | public | Email confirmation and password reset by code |
| `/auth/callback`, `/auth/email-change` | public | PKCE landing routes for emailed links |
| `/dashboard` | signed in | App home after sign-in |
| `/account` | signed in | Email, password, billing, log out, delete account |
| `/components` | signed in | Live gallery of every UI component |
| `/checkout`, `/checkout/success` | signed in, billing enabled | Embedded Stripe checkout |
| `/api/webhooks/stripe` | Stripe only | Signature-verified webhook |

Everything not listed as public in `src/proxy.ts` is protected by default — see [AUTH.md](AUTH.md).

## Layout

```
src/
  proxy.ts                 session refresh + optimistic redirects
  instrumentation.ts       env check at startup
  app/(auth)/              login, signup, check-email, forgot/reset password
  app/(protected)/         dashboard, account, components gallery, checkout
  app/auth/                PKCE callback routes
  app/api/webhooks/        Stripe webhook
  components/ui/           the component library
  components/calendar/     month / week / day event calendar
  components/billing/      checkout form, payment method card, billing buttons
  components/gallery/      the /components gallery
  components/core/         app chrome (sidebar, header, footer, error state)
  hooks/                   client hooks
  lib/actions/             server actions (auth, account, billing)
  lib/auth/                email limits, fresh-sign-in check
  lib/billing/             Stripe client, customers, subscriptions, payments, products
  lib/calendar/            calendar event type and helpers
  lib/supabase/            server/service clients, dal, db, generated types
  lib/rate-limit/          burst limiter, client IP
  lib/env.ts               typed env access, checked at startup
  lib/site.ts              the app's name and description
  lib/url-messages.ts      fixed ?error= / ?message= codes
supabase/
  migrations/              versioned schema (auth limits, profiles + avatars, billing)
  templates/               auth email templates
  config.toml              local Supabase stack, preconfigured for the auth flows
e2e/                       Playwright smoke tests
docs/                      all documentation — start at DOCS.md
.claude/skills/            agent skills — SKILLS.md
.github/workflows/ci.yml   typecheck, lint, build, smoke tests
```

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run typecheck`, `npm run lint` | TypeScript, ESLint |
| `npm run test:e2e` | Builds, then runs the Playwright smoke tests (no Supabase needed) |
| `npm run db:start` / `db:stop` | Local Supabase stack (Docker) |
| `npm run db:new <name>` | New empty migration |
| `npm run db:reset` | Rebuild the local database from migrations + `supabase/seed.sql` |
| `npm run db:types` | Regenerate `src/lib/supabase/types.ts` |
| `npm run db:push` | Apply pending migrations to the linked hosted project |

## Environment

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SITE_URL` are required; the server refuses to start without them (`src/lib/env.ts`). The Stripe variables are an optional all-or-nothing group ([STRIPE.md](STRIPE.md)). See `.env.example` for where each comes from.

## Starting a new project

1. Create a repository from the template on GitHub (**Use this template**) and clone it.
2. `npm install`, copy `.env.example` to `.env.local`, fill in the Supabase values.
3. `npx supabase link --project-ref <ref>`, then `npm run db:push`.
4. Do the Supabase dashboard settings in [AUTH.md](AUTH.md#supabase-dashboard-settings-this-depends-on).
5. Rebrand: `src/lib/site.ts` (name), `src/app/globals.css` (`--primary` and its steps), `src/app/favicon.ico`.
6. Replace this doc's opening with what the new project is, and add project-specific docs to `docs/` (listed in [DOCS.md](DOCS.md)).
