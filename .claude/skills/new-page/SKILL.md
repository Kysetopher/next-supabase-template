---
name: new-page
description: Use when adding a page or route to this repo — a protected app page, a public page, or an API route handler — so it gets the right auth gating, sidebar link, metadata, loading/error states, robots rules and a smoke test.
---

# Add a page

Auth model: docs/AUTH.md. Conventions: docs/PRACTICES.md.

## Protected page (the default)

1. Create `src/app/(protected)/<route>/page.tsx`. It's gated automatically by
   `src/proxy.ts` (protected by default) and `(protected)/layout.tsx`.
2. **Still call `requireUser()` or `db()` in the page itself** — and in every
   Server Action it uses. Layouts don't re-run on client navigation.
3. `export const metadata = { title: "<Title>" }` (the root layout appends the site name).
4. Wrap content like the existing pages:
   `<div className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto ... px-4 py-12">`.
5. Add a sidebar link in `src/components/core/sidebar.tsx` (icon from Iconify `mdi:*`).
6. Add the route to `disallow` in `src/app/robots.ts`.
7. Loading and error states come from `(protected)/loading.tsx` and `(protected)/error.tsx`; add a route-level `loading.tsx` only if the page needs a different skeleton.
8. Add a smoke test in `e2e/` that the route redirects a signed-out visitor to `/login`.

## Public page

1. Create it outside `(protected)/` (e.g. `src/app/<route>/page.tsx`, or a new
   `(marketing)/` group with its own layout).
2. Add the exact path to `PUBLIC_ROUTES` in `src/proxy.ts` — otherwise it's
   redirect-gated. Public pages don't get a session refresh, so they must not
   read the user.
3. Add a smoke test that it renders for a signed-out visitor.

## API route

1. `src/app/api/<name>/route.ts`. `/api/*` is excluded from the proxy, so it
   gets no redirect and no session refresh from it.
2. For user calls, check the user yourself with `getUser()` from
   `src/lib/supabase/dal.ts` and return a JSON 401 — never redirect.
3. For third-party callers (webhooks), verify their signature from the raw body
   (`await request.text()`) before doing anything; see the Stripe webhook.
4. Responses are `Cache-Control: private, no-store` already (`next.config.ts`).

## Messages from redirects

Show outcomes with `?error=<code>` / `?message=<code>`: add the code to
`src/lib/url-messages.ts`, redirect with `errorParam(code)`, render with
`errorMessage()` / `noticeMessage()`. Never render URL text directly.

## Done when

`npm run typecheck`, `npm run lint`, `npm run test:e2e` pass, and the page renders at phone width without horizontal scroll.
