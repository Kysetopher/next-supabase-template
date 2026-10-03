# Cloudflare

The app deploys to **Cloudflare Workers** through [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (OpenNext), built and deployed by Cloudflare's own **Workers Builds** git integration. Nothing is built or deployed from your computer or from GitHub Actions, and no Cloudflare token lives anywhere in the repo or in GitHub.

To deploy, open the project in an AI coding agent and paste:

> Deploy this project to Cloudflare: read docs/CLOUDFLARE.md and follow the Deploy runbook step by step. Stop and wait for me at every USER STEP.

The [Deploy runbook](#deploy-runbook) is at the end of this file; everything before it explains how the setup works.

## How it deploys

The repository is connected to Cloudflare (**Workers & Pages → Create → Import a repository**). On every push to the connected branch, Cloudflare's build servers run:

- **Build command:** `npx opennextjs-cloudflare build` — runs `npm run build` (`next build`), then turns the output into a Worker (`.open-next/worker.js`) and its static files (`.open-next/assets`).
- **Deploy command:** `npx wrangler deploy` for production, `npx wrangler deploy --env dev` for the dev Worker — uploads that bundle as configured in [`wrangler.jsonc`](../wrangler.jsonc).

Builds for **non-production branches are turned off** in each project (**Settings → Build → Branch control**). Those builds use a different pair of commands that don't produce a Worker and always fail; pull requests are checked by GitHub Actions instead, and preview URLs are off.

CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) runs the same `npx opennextjs-cloudflare build` after the other checks, so a change that won't bundle for Workers fails the pull request before it reaches a deploy. It needs no secrets or env vars.

## Environments

| | Production | Dev (optional) |
|---|---|---|
| Worker | `<name>` (the `name` in `wrangler.jsonc`) | `<name>-dev` |
| Config | top level of `wrangler.jsonc` | `env.dev` in `wrangler.jsonc` |
| Deploys from | the `production` branch | `main` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy --env dev` |
| Domain | e.g. `example.com` | e.g. `dev.example.com`, optionally behind Cloudflare Access |
| Supabase | the **production** project | the **development** project (the one in `.env.local`) |
| Stripe | live mode | test mode |
| Rate-limit counters | `namespace_id` 1001, 1002 | 2001, 2002 |

Wrangler doesn't inherit `vars` or bindings into an environment, so `env.dev` is complete on its own: its own variables and its own rate-limit counters. A binding missing there fails the deploy instead of quietly using production's.

The flow once both exist: feature branch → pull request (CI) → merge to `main` → the dev Worker deploys. Release: a pull request from `main` into `production` → production deploys. Migrations go to the development project first (`npm run db:push` while linked to it) and to the production project when the change is released; write them so both the code on `main` and the code on `production` work with them (add first, remove in a later release).

## Variables and secrets

| Kind | Where | Which |
|---|---|---|
| Non-secret | `vars` in `wrangler.jsonc` (committed) | `SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`; with billing, `STRIPE_PUBLISHABLE_KEY` and each `STRIPE_PRICE_*` |
| Secret | the Worker's **Settings → Variables and Secrets**, type **Secret** (or `npx wrangler secret put <NAME>`, run by the user) | `SUPABASE_SECRET_KEY`; with billing, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

- **Secrets are never plain Variables.** Every `wrangler deploy` makes `wrangler.jsonc` the Worker's complete list of plain variables: one set only in the dashboard, as type Text, is removed by the next deploy, with nothing but a warning in the build log ("local configuration differs from remote"). The build stays green and the site breaks. A Secret is a separate binding type that deploys leave alone. For the same reason, non-secret values go in `wrangler.jsonc`, not the dashboard.
- The publishable keys are safe to commit: Supabase's is meant to be public (Postgres RLS is the boundary) and Stripe's is sent to every browser that opens checkout.
- **No `NEXT_PUBLIC_` variables.** Next inlines those at build time, and `wrangler.jsonc` `vars` only exist at run time, so they'd need a second copy under **Settings → Build → Variables and secrets**, and dev and production couldn't differ. Values the browser needs are passed from the server at request time ([PRACTICES.md](PRACTICES.md)).
- `vars` ship commented out: the template doesn't know your values. Until they're filled in, the deployed Worker answers every request that reaches the server with a 500, and Workers Logs name what's missing.
- Each Worker has its own Secrets: the dev Worker needs the development project's secret key and Stripe's test keys, production the production project's and live keys.

### The env check on Workers

`src/instrumentation.ts` `register()` runs on Workers too: OpenNext rewrites Next's dynamic load of the instrumentation file into a static one (checked in the bundle it builds). The Worker copies its variables and Secrets into `process.env` before the Next server loads, so `register()` checks the real values. The difference from `next start` is timing: a Worker doesn't "start", so a missing or malformed variable shows up as a 500 on the first request, with the list in **Workers Logs**, instead of a server that refuses to boot. The middleware runs in its own bundle without `register()`; the `env` getters there throw per variable just the same. `npm run check:env` checks `.env.local` only, not the Worker.

## Domain and HTTPS

- Add the domain to the Worker under **Settings → Domains & Routes → Add → Custom domain**. The domain's DNS must be on Cloudflare (add the site to the account first). It's set in the dashboard, not `wrangler.jsonc`, so deploys leave it alone.
- `SITE_URL` in `vars` must be that origin exactly (`https://example.com`, no trailing slash).
- Turn on **SSL/TLS → Edge Certificates → Always Use HTTPS** for the zone.
- `workers_dev: true` serves the Worker at `<name>.<account subdomain>.workers.dev` so the first deploy is reachable. Once the custom domain works, set it to `false` and commit: the app should have one origin. `preview_urls` is `false` from the start — otherwise every old version stays callable at its own URL, running its old code.

## Cloudflare Access for the dev Worker (optional)

To keep the dev site to your team: **Zero Trust → Access → Applications → Add → Self-hosted**, domain `dev.example.com`, with a policy allowing your team's emails. If the Stripe test webhook points at dev, add a second self-hosted application for the path `dev.example.com/api/webhooks/stripe` with a **Bypass → Everyone** policy (the more specific path wins). Stripe can't sign in to Access; the webhook checks Stripe's signature itself ([STRIPE.md](STRIPE.md)).

## Supabase

Each Supabase project needs its own domain's URLs under **Authentication → URL Configuration**:

- **Site URL**: that environment's `SITE_URL`.
- **Redirect URLs**: `<SITE_URL>/auth/callback` and `<SITE_URL>/auth/email-change`, exact, no wildcards. Keep `http://localhost:3000/…` on the development project.

The production project also needs the rest of [SETUP.md](SETUP.md) step 7 (email settings, the reset-code template, `pg_cron`) and the migrations (`npm run db:push` while linked to it).

## Stripe

One webhook endpoint per environment, each with its own signing secret: live mode → `https://example.com/api/webhooks/stripe` with production's `STRIPE_WEBHOOK_SECRET`; test mode → `https://dev.example.com/api/webhooks/stripe` with dev's. The events are listed in [STRIPE.md](STRIPE.md). The Stripe client already uses the fetch HTTP client and `constructEventAsync`, so nothing else changes on Workers.

## Rate limiting

The burst limits (`src/lib/rate-limit/burst.ts`, [AUTH.md](AUTH.md)) use Workers rate-limit bindings declared in `wrangler.jsonc` under `ratelimits`: `RATE_LIMIT_AUTH` (5 / 60 s) and `RATE_LIMIT_BILLING` (10 / 60 s). The limit and period live there, one binding per policy; the period can only be 10 or 60. Production and dev use different `namespace_id`s so they never share counters, and an id must be unique within the Cloudflare account. Without a binding (`next start`, the e2e tests) `checkBurst()` falls back to an in-memory counter with the same numbers. To add a policy: a binding in both blocks of `wrangler.jsonc`, its name in `cloudflare-bindings.d.ts`, and an entry in `POLICIES` in `burst.ts`.

`cloudflare-bindings.d.ts` types the bindings by hand on purpose. `npx wrangler types` (or `@cloudflare/workers-types`) would replace global DOM types with the Workers runtime's — `Body.json()` returning `unknown` instead of `any`, among others — and break ordinary route handler code for the sake of one interface. `.gitignore` reserves `cloudflare-env.d.ts` for `wrangler types` output so a generated file never lands by accident.

## Middleware, not proxy

The session refresh lives in `src/middleware.ts`, not Next 16's `proxy.ts`. In Next 16, `proxy.ts` always runs on the Node.js runtime, and OpenNext 1.20 bundles Node.js middleware for Workers only with a build warning that it's "experimental … not officially maintained". `middleware.ts` runs on the edge runtime, which OpenNext supports fully. The name is deprecated but still works; `next build` prints a deprecation notice, which is expected. Keep the file in `src/`, next to `app/`. See [AUTH.md](AUTH.md).

## Local development

- `npm run dev` reads variables from `.env.local` only. `initOpenNextCloudflareForDev()` in `next.config.ts` adds the Cloudflare bindings from `wrangler.jsonc` (the rate limiters, emulated locally), so `getCloudflareContext()` works as on Workers. The `vars` in `wrangler.jsonc` don't reach `process.env` in `next dev`.
- Don't create a `.dev.vars`: wrangler would read it instead of `.env.local`, and the project would have two env files to keep in step. `.gitignore` covers it anyway.
- **No local Workers builds.** Don't run `opennextjs-cloudflare build`, `preview` or `deploy` on your machine. The build copies `.env.local` — including `SUPABASE_SECRET_KEY` — into the bundle as fallback values, so a deploy from a laptop would upload development secrets inside the Worker. OpenNext also warns that it isn't fully compatible with Windows. CI and Workers Builds (both Linux, with no `.env.local`) build the Worker.
- `npm run build`, `npm run start` and `npm run test:e2e` still work as before: plain Next.js on Node.

## Why `wrangler` and `@opennextjs/cloudflare` are dependencies

Workers Builds runs `npx opennextjs-cloudflare build` and `npx wrangler deploy`, and `npx` uses the versions pinned in `package-lock.json` instead of whatever the build image has. `next.config.ts` imports `@opennextjs/cloudflare` for `initOpenNextCloudflareForDev()`, and `burst.ts` for `getCloudflareContext()`. Don't remove either.

## Files

| File | Role |
|---|---|
| `wrangler.jsonc` | Worker name, compatibility date and flags, static assets, observability (logs and traces on), `vars`, rate-limit bindings, the `env.dev` block |
| `open-next.config.ts` | OpenNext's config; defaults (no incremental cache — add one if a route starts using ISR or `revalidate`) |
| `cloudflare-bindings.d.ts` | Types for the bindings in `wrangler.jsonc` |
| `public/_headers` | Static files are served before Next runs, so they never get `next.config.ts` headers; this repeats the security headers and makes `/_next/static/*` immutable. Keep it in step with `SECURITY_HEADERS`. |
| `src/middleware.ts` | Session refresh and redirects ([AUTH.md](AUTH.md)) |

## Agent tooling

Wrangler is in the repo so an AI agent can use it as a tool against the deployed Workers, alongside Cloudflare's official skills. Cloudflare's read-only MCP servers (docs, Workers logs, Workers Builds) are set up in [MCP.md](MCP.md).

**`npx wrangler login` is a USER STEP**: it opens a browser to authorize this computer. Give the user the command; never ask for a token.

After the user has logged in, an agent may run these without asking — they only read:

- `npx wrangler whoami` — which account is logged in
- `npx wrangler deployments list` / `npx wrangler versions list` (add `--env dev` for the dev Worker)
- `npx wrangler tail` / `npx wrangler tail --env dev` — live logs, e.g. while the user reproduces a bug. Persisted logs and traces are in the dashboard under the Worker's **Observability** tab.
- `npx wrangler secret list` — names only, never values

These need the user's go-ahead, or are the user's to run:

- `npx wrangler secret put <NAME>` (`--env dev` for dev) — **the user runs it** and types the value at the prompt; the agent never sees or handles it.
- `npx wrangler deploy`, `npx wrangler rollback`, `npx wrangler versions deploy` — deploys normally go through Workers Builds; only with the user's explicit go-ahead.
- Creating, changing or deleting resources (KV, R2, D1, queues) when a project needs them — say what and why first, then add the binding to both blocks of `wrangler.jsonc`.
- Never `wrangler delete`, and never local OpenNext builds (above).

### Skills

Cloudflare's official skills (`cloudflare/skills`) are committed in `.claude/skills/` and `.agents/skills/` and pinned in `skills-lock.json` ([SKILLS.md](SKILLS.md)):

| Skill | For |
|---|---|
| `wrangler` | Wrangler commands and config |
| `cloudflare` | the Cloudflare platform: Workers, storage, networking, Zero Trust |
| `workers-best-practices` | writing and reviewing Workers code |

```bash
npx skills add cloudflare/skills -s wrangler cloudflare workers-best-practices -a claude-code codex -y --copy
```

**Project rules come first.** Where these skills disagree with this project:

1. This project runs Next.js on Workers through OpenNext. Never migrate it to vinext or another adapter.
2. Keep `cloudflare-bindings.d.ts` hand-written. Don't replace it with `wrangler types` output or add `@cloudflare/workers-types`, whatever the `wrangler` skill suggests — it changes global DOM types and breaks route handlers ([Rate limiting](#rate-limiting)).
3. No local Workers builds, previews or deploys ([Local development](#local-development)), and no secrets in `wrangler.jsonc`.

## Deploy runbook

Instructions for an AI coding agent to take the project live on Cloudflare Workers for the person at the keyboard. Run it after [SETUP.md](SETUP.md) is done.

### Rules for the agent

- **Go in order.** Finish and verify each step before the next. If something fails, read the error, fix the cause, and try again.
- **Stop at every USER STEP.** Tell the user exactly what to do — the exact clicks or command — then wait for them to say they're done.
- **Never ask for secrets in chat.** The user enters Secrets themselves, in the Cloudflare dashboard or by running `npx wrangler secret put` in their own terminal. Never put a secret in `wrangler.jsonc` or any committed file. The Supabase URL and publishable keys aren't secrets; the user may paste those.
- **`npx wrangler login` is a USER STEP**, like every command that opens a browser or asks for a password (`supabase login`, `supabase link`, `db:push`).
- **Never deploy without the user's go-ahead.** Don't run `wrangler deploy` or any local OpenNext build; deploys happen in Workers Builds when the user pushes. Ask before every commit and push.
- **Hosted Supabase only.** No `supabase start`, `db reset` or Docker.
- **Explain as you go**, briefly, in words a non-developer follows. Use the shell the user has.

### 1. Check the project

Confirm `npm run check:env`, `npm run typecheck` and `npm run lint` pass and the work is committed and pushed to GitHub (`git status`; `git log origin/main..` is empty). If it isn't pushed, **USER STEP:** push it (GitHub Desktop → **Push origin**).

Ask the user two things:

1. **The production address** — a domain they own, e.g. `example.com` (its DNS will need to be on Cloudflare), or none yet (the site then lives at a `workers.dev` address until they add one).
2. **A dev site too?** A second Worker that deploys from `main` to e.g. `dev.example.com`, on the development Supabase project, so changes can be tried before release. Recommended; it can be added later (step 10).

### 2. Name the Worker

Ask for a short name (lowercase letters, digits, dashes; e.g. the app's name). Set `name` in `wrangler.jsonc`. The dev Worker will be that name plus `-dev`.

### 3. Production Supabase project

Production gets its own Supabase project, separate from the development one in `.env.local`.

**USER STEP — create it.** In the Supabase dashboard: **New project**, a name (e.g. the app name plus "production"), a strong database password saved in their password manager, the region closest to their users.

Ask for its **Project URL** and **Publishable key** (**Project Settings → API Keys**) — not secret, they go in `wrangler.jsonc`. Its ref is the URL's subdomain.

**USER STEP — push the schema to it.** Give the user, one at a time:

```bash
npx supabase link --project-ref <production-ref>
```

```bash
npm run db:push
```

```bash
npx supabase link --project-ref <development-ref>
```

The last one links the CLI back to the development project, so everyday `db:push` and `db:types` keep targeting it. (The development ref is the subdomain of `SUPABASE_URL` in `.env.local`; read only that line.)

**USER STEP — dashboard settings** on the production project: the four settings in [SETUP.md](SETUP.md) step 7, except URL Configuration, which waits for step 8.

### 4. Production variables

In `wrangler.jsonc`, uncomment the top-level `vars` and fill in:

- `SITE_URL` — `https://<domain>`, or, with no domain yet, `https://<name>.<account-subdomain>.workers.dev` (the account subdomain is on **Workers & Pages → Overview** once they have an account; fill this in after step 6 if needed).
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — the production project's.

Leave the Stripe lines commented unless billing is going live now (step 9). Never add a secret here.

Ask, then commit (`Configure production deploy`). Then create the `production` branch from `main` (`git branch production main`). **USER STEP:** push both branches (GitHub Desktop: **Push origin**, then publish the `production` branch; or `git push origin main production`).

From here on, **releasing** a change means: commit it on `main`, then **USER STEP:** push `main`, and bring `production` up to it — a pull request from `main` into `production` on GitHub, merged (or `git push origin main:production`).

### 5. Connect Cloudflare

**USER STEP — create the Worker from the repository.** Walk them through:

1. Sign up or log in at https://dash.cloudflare.com.
2. **Workers & Pages → Create → Import a repository**, connect GitHub (authorize Cloudflare for the repository), and pick this repository.
3. **Project name:** exactly the `name` from `wrangler.jsonc`.
4. **Build command:** `npx opennextjs-cloudflare build`. **Deploy command:** `npx wrangler deploy`.
5. Under the advanced settings (or afterwards in **Settings → Build**), set the **production branch** to `production`.
6. Create it. The first build starts; it takes a few minutes.
7. **Settings → Build → Branch control:** turn **off** builds for non-production branches.

If the build fails, have them copy the build log's error (no keys are printed in it) and fix the cause. A name mismatch with `wrangler.jsonc` is the usual one.

### 6. Production secrets

**USER STEP — add the secret key.** On the Worker: **Settings → Variables and Secrets → Add**, type **Secret**, name `SUPABASE_SECRET_KEY`, value = the production project's secret key (**Project Settings → API Keys → Secret keys**). Save — that deploys a new version. (Alternative: run `npx wrangler login`, then `npx wrangler secret put SUPABASE_SECRET_KEY` and paste the value at the prompt.)

Never as type Text: a plain variable is removed by the next deploy.

### 7. Domain

With a domain:

**USER STEP.** (1) If the domain isn't on Cloudflare yet: **Add a domain** in the dashboard and change the nameservers at the registrar as instructed; wait until it's active. (2) On the Worker: **Settings → Domains & Routes → Add → Custom domain** → the domain. (3) The domain's **SSL/TLS → Edge Certificates → Always Use HTTPS**: on.

Once `https://<domain>` loads, set `workers_dev` to `false` in `wrangler.jsonc`, ask, commit, and release it.

With no domain yet: skip this step; `workers_dev` stays `true`. Come back to it when they have one — `SITE_URL` and the Supabase URLs change with it.

### 8. Supabase URLs for the domain

**USER STEP.** Production Supabase project → **Authentication → URL Configuration**: **Site URL** = `SITE_URL`; **Redirect URLs**: `<SITE_URL>/auth/callback` and `<SITE_URL>/auth/email-change`. Save.

### 9. Payments (only if billing goes live now)

Follow [STRIPE.md](STRIPE.md) **Setup** in **live mode** for production: products and prices, the Customer Portal.

1. In `wrangler.jsonc` top-level `vars`: `STRIPE_PUBLISHABLE_KEY` (`pk_live_…`) and each `STRIPE_PRICE_*` (live price ids). Not secrets. Ask and commit, but don't release yet.
2. **USER STEP:** Stripe → **Developers → Webhooks → Add endpoint**: `<SITE_URL>/api/webhooks/stripe`, with exactly the events listed in STRIPE.md.
3. **USER STEP:** on the Worker, add Secrets `STRIPE_SECRET_KEY` (`sk_live_…` or a restricted `rk_live_…`) and `STRIPE_WEBHOOK_SECRET` (the endpoint's signing secret).
4. Release the commit straight away. The Stripe variables are all-or-nothing, so between step 3 and this deploy the site answers with errors.

### 10. Dev Worker (if they want one)

1. In `wrangler.jsonc` `env.dev.vars`: `SITE_URL` (e.g. `https://dev.<domain>`, or `https://<name>-dev.<account-subdomain>.workers.dev`), and the **development** project's `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (the same values as `.env.local`; read only those two lines). Test-mode Stripe values if billing is on. Ask, commit; **USER STEP:** push `main`.
2. **USER STEP:** a second **Import a repository** project for the same repository: name `<name>-dev`, build command `npx opennextjs-cloudflare build`, deploy command `npx wrangler deploy --env dev`, production branch `main`; then turn off non-production branch builds.
3. **USER STEP:** on `<name>-dev`, Secret `SUPABASE_SECRET_KEY` = the **development** project's secret key (and the Stripe test-mode secrets with billing on).
4. **USER STEP:** custom domain `dev.<domain>` on `<name>-dev`, as in step 7. Optionally Cloudflare Access ([above](#cloudflare-access-for-the-dev-worker-optional)) — with a Bypass for `/api/webhooks/stripe` if the Stripe test webhook points here.
5. **USER STEP:** development Supabase project → **URL Configuration**: add `<dev SITE_URL>/auth/callback` and `<dev SITE_URL>/auth/email-change` to Redirect URLs, keeping the localhost ones. Site URL can stay `http://localhost:3000`.
6. With billing: a **test-mode** webhook endpoint at `<dev SITE_URL>/api/webhooks/stripe`, its signing secret as the dev Worker's `STRIPE_WEBHOOK_SECRET`.

### 11. Check it

- Fetch the production URL's home page and confirm it returns 200 with the `Strict-Transport-Security` and `X-Frame-Options` headers (`curl -sI https://<domain>`), and that `/dashboard` redirects to `/login`.
- **USER STEP — sign up on the live site** with a real email, click the confirmation link in the same browser, and land on the dashboard. If something fails, ask what they saw. With the user logged in to Wrangler (`npx wrangler login`, a USER STEP), `npx wrangler tail` shows the Worker's logs live while they retry; otherwise have them open the Worker's **Observability** tab.
- Do the same on the dev site if there is one.

### Done

Summarize: the Worker name(s) and URLs, which Supabase project each uses, whether billing is live, and the release flow (merge to `main` → dev; pull request `main` → `production` → production). Remind them that secrets live only in the Cloudflare dashboard and `.env.local`, and that a new required variable needs adding to `wrangler.jsonc` (non-secret) or as a Worker Secret before the release that reads it.
