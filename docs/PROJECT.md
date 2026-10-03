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
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare`, deployed by Workers Builds; `wrangler` — [CLOUDFLARE.md](CLOUDFLARE.md) |
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

Everything not listed as public in `src/middleware.ts` is protected by default — see [AUTH.md](AUTH.md).

## Layout

```
src/
  middleware.ts            session refresh + optimistic redirects
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
  lib/rate-limit/          burst limiter (Workers rate-limit bindings), client IP
  lib/env.ts               typed env access, checked at startup
  lib/site.ts              the app's name and description
  lib/url-messages.ts      fixed ?error= / ?message= codes
public/_headers            security + cache headers for static files on Workers
supabase/
  migrations/              versioned schema (auth limits, profiles + avatars, billing)
  templates/               auth email templates
  config.toml              Supabase CLI config (no local database); records the auth settings
scripts/check-env.mjs      npm run check:env — validates .env.local without printing it
e2e/                       Playwright smoke tests
wrangler.jsonc             Cloudflare Workers config: name, vars, rate limits, env.dev — CLOUDFLARE.md
open-next.config.ts        OpenNext build config (defaults)
cloudflare-bindings.d.ts   types for the bindings in wrangler.jsonc
docs/                      all documentation — start at DOCS.md
.claude/skills/            agent skills for Claude Code — SKILLS.md
.mcp.json                  Claude Code MCP servers: Supabase (dev, read-only), Cloudflare, GitHub — MCP.md
.codex/config.toml         the same MCP servers for Codex (trusted projects) — MCP.md
.agents/skills/            the same skills for Codex and other agents (npm run skills:sync)
skills-lock.json           pinned versions of installed skill sets (Supabase, Cloudflare)
.github/workflows/ci.yml   typecheck, lint, build, smoke tests, Cloudflare Workers build
```

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm run start` | Production build / serve with Node (the smoke tests use it; deploys are built by Cloudflare — [CLOUDFLARE.md](CLOUDFLARE.md)) |
| `npm run typecheck`, `npm run lint` | TypeScript, ESLint |
| `npm run skills:sync` | Mirrors the project's own skills from `.claude/skills` to `.agents/skills` |
| `npm run check:env` | Validates `.env.local` the way the server does at startup, without printing values |
| `npm run test:e2e` | Builds, then runs the Playwright smoke tests (no Supabase needed) |
| `npm run db:new <name>` | New empty migration |
| `npm run db:types` | Regenerate `src/lib/supabase/types.ts` from the linked project |
| `npm run db:push` | Apply pending migrations to the linked hosted project |
| `npx wrangler <command>` | Cloudflare's CLI, for logs, deployments and secrets of the deployed Workers — no deploys from here ([CLOUDFLARE.md](CLOUDFLARE.md) "Agent tooling") |

## Environment

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SITE_URL` are required; the server refuses to start without them (`src/lib/env.ts`; on Workers, requests fail with the list in the logs). Locally they live in `.env.local`; deployed, in `wrangler.jsonc` `vars` and Cloudflare Secrets ([CLOUDFLARE.md](CLOUDFLARE.md)). The Stripe variables are an optional all-or-nothing group ([STRIPE.md](STRIPE.md)). See `.env.example` for where each comes from.

## Starting a new project

Create a repository from the template on GitHub (**Use this template**), clone it, open it in an AI coding agent and paste:

> Set up this project for me: read docs/SETUP.md and follow it step by step. Stop and wait for me at every USER STEP.

[SETUP.md](SETUP.md) walks the agent through everything: dependencies, env vars, linking the hosted Supabase project and pushing migrations, connecting the agent's MCP tools, the dashboard settings, rebranding, optional payments, checks, a first sign-up, and points to the deploy runbook.

## Deploy

Cloudflare Workers, through `@opennextjs/cloudflare`, built and deployed by Cloudflare's Workers Builds on every push: `production` → the production Worker, `main` → an optional dev Worker. Secrets live in Cloudflare as encrypted Secrets, everything else in `wrangler.jsonc`. To deploy, paste into an AI coding agent:

> Deploy this project to Cloudflare: read docs/CLOUDFLARE.md and follow the Deploy runbook step by step. Stop and wait for me at every USER STEP.

How it all works — environments, variables, domain, Supabase and Stripe per environment: [CLOUDFLARE.md](CLOUDFLARE.md). The routes above behave the same on Workers.

Before launch, set up real email: Supabase's built-in mailer only reaches your own team, 2 emails an hour, so signups fail once real users arrive. Paste into the agent:

> Set up real email sending for this project: read docs/EMAIL.md and follow the runbook step by step. Stop and wait for me at every USER STEP.

It sends auth emails from your domain through Resend ([EMAIL.md](EMAIL.md)), on each Supabase project.
