# Practices

## Components
- Prefer Server Components; add `"use client"` only when the component needs state, effects, event handlers, or browser APIs. A file that attaches an `onClick` (or any handler) needs the directive even if it has no hooks.
- Keep props small and focused.
- Prefer context for shared state.
- Use `src/components/ui` primitives where possible. The library is our own (shadcn-inspired, not managed by the shadcn CLI) — extend a component additively rather than copying it, and keep existing exports and props stable.
- Keep helpers close to the component that owns them.
- Feature modules (a group of components for one feature, e.g. `src/components/calendar/`, `src/components/billing/`) get their own folder under `src/components/`; app chrome lives in `src/components/core/`.
- Files are kebab-case; components are named exports.

## Styling
- Use Tailwind only; no inline styles. The one exception is `src/app/global-error.tsx`, which replaces the root layout and so gets no stylesheet.
- Prefer less styling, reduced or no padding, no roundedness no borders or backgrounds.
- **One fixed theme, not two.** `src/app/globals.css` defines a single dark palette — no `.dark` class, no `prefers-color-scheme` branching. Never add a `dark:` variant anywhere; if a color needs to differ by context, that's what the semantic tokens below are for, not a second theme.
- **Always use the semantic tokens** (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`, `bg-secondary`, `text-destructive`, `focus-visible:ring-ring`, etc.) — never a raw color like `border-black/10` or a hex value. The full token set (background/foreground/card/popover/primary/secondary/muted/accent/destructive/success/warning/border/input/ring/chart-*) is defined in `globals.css`; extend that file rather than hardcoding a new color inline. `accent` is a dark hover surface, not a text color.
- **`primary` is the only accent** — it's for buttons, focus rings, progress/active states, and links, never a large panel or a gradient. Everything else stays monochrome (background/foreground/muted/border). Rebranding a project means changing `--primary` (and its ring/chart steps), nothing else.
- **`Button` variants have one job each.** `variant="primary"` (default) for the one primary action on a screen; `variant="secondary"` (a filled muted surface) for everything else; `ghost` for small inline controls; `destructive` for irreversible actions. `outline` and `link` exist for toolbars and inline text — don't reach for them, or an ad-hoc `border bg-transparent` override, where `secondary` fits. Style a `<Link>` as a button with `buttonVariants()`.
- **Any button that triggers an awaited request must show `Button`'s `loading` prop while that request is in flight** — a Server Action form submit, a fetch mutation, anything where the user is waiting on a response. `loading` disables the button and swaps its content for a spinning `@iconify/react` loader icon (`lucide:loader-2`) so a slow response never looks identical to a dead click. For a Server Action `<form action={...}>`, use `SubmitButton` (`src/components/ui/submit-button.tsx`) instead of `Button` directly — it reads pending state via `useFormStatus()`, which only works in a component that's itself a descendant of the `<form>`. For a client-side mutation, pass the hook's own loading boolean straight into `loading`.
- Use `@iconify/react` for icons.
- **Scrolling regions use `simplebar-react`** (`<SimpleBar>`, or `PageScrollArea` for a full-height page; its CSS is imported in `globals.css`) rather than a bare `overflow-y-auto`, so scrollbars look the same everywhere.
- Ship mobile-friendly layouts by default: tap targets, readable line lengths, visible focus styles, no horizontal scroll at phone width.
- Every interactive element is reachable by keyboard and labelled: `aria-label` on icon-only buttons, a label or `aria-label` on every input.

## Data and security
- **Server-first.** Read and write data in Server Components and Server Actions; reach for a Route Handler only for webhooks or a non-browser consumer, and for a client hook only when something genuinely needs client-side polling.
- Every page and action that touches user data calls `requireUser()` or `db()` itself — layouts don't re-run on client navigation, so never rely on the layout alone. See [AUTH.md](AUTH.md).
- Never use `getSession()` for authorization. Never import `createServiceClient()` into request-facing data code; it bypasses RLS and is reserved for the narrow cases listed in `src/lib/supabase/service.ts`.
- **Every table** follows the `profiles` pattern in `supabase/migrations/*_profiles_and_avatars.sql`: RLS on, one policy per allowed operation on `(select auth.uid())`, grants as narrow as the policies, `references auth.users(id) on delete cascade`. Anything outside Postgres (storage files, Stripe customers) is cleaned up in `deleteAccount()`.
- **Schema changes are migrations** (`npm run db:new <name>`), never hand-edits to a hosted database. Run `npm run db:types` after every migration.
- Read env vars through `env` from `@/lib/env`, never `process.env.X!`. A new required variable goes in `src/lib/env.ts` (so the server refuses to start without it) and in `.env.example` with where to find it.
- URL-driven messages (`?error=`, `?message=`) go through the fixed codes in `src/lib/url-messages.ts` — never render text taken from the URL.
- Validate every Server Action input on the server; a Server Action can be posted from anywhere, not just its form.
- Secrets are never `NEXT_PUBLIC_`. Values the browser needs (e.g. a publishable key) are passed from the server at request time.

## Testing and checks
- `npm run typecheck`, `npm run lint`, `npm run build` and `npm run test:e2e` must pass before a change is done; CI runs all four.
- Smoke tests in `e2e/` run with no Supabase or Stripe behind them. Add one for every new public page, protected route, or security behaviour (redirects, headers, error codes).
- A new UI component gets an example in the `/components` gallery (`src/components/gallery/component-gallery.tsx`).

## General
- App Router only — no `pages/` directory.
- TypeScript everywhere; avoid `any`.
- Import via the `@/*` alias (maps to `src/*`), not relative `../../` chains.
- `src/lib/` stays server-safe and framework-agnostic; client-side hooks go under `src/hooks/`.
- This is a reusable template: never hard-code a product, client or brand name. The app's name comes from `site` in `src/lib/site.ts`; colors from the tokens.
- Next.js 16 has breaking changes from older versions — read the relevant guide in `node_modules/next/dist/docs/` before writing framework code.
