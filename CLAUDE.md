@AGENTS.md

## Project notes

- Unbranded template: never hard-code a product name — use `site` from `src/lib/site.ts`; colors only via the tokens in `src/app/globals.css`.
- Auth is server-only. Read [docs/AUTH.md](docs/AUTH.md) before touching `src/proxy.ts`, `src/lib/supabase/*`, `src/lib/actions/*` or `src/lib/auth/*`.
- `requireUser()` / `db()` in every page and action that touches user data; never `getSession()` for authorization; never import `createServiceClient()` into request-facing data code.
- URL-driven messages go through `src/lib/url-messages.ts` codes — never render `?error=` text directly.
- UI components live in `src/components/ui` (kebab-case, `cn` from `@/lib/utils`). Extend existing ones additively; check `/components` renders after changes.
