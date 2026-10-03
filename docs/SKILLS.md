# Agent skills

Skills are committed in the repo, so every clone — and every project made
from the template — has them with nothing to install:

- `.claude/skills/` — read by **Claude Code**. The project's own skills are edited here.
- `.agents/skills/` — read by **Codex** and other agents that use the shared folder. A mirror: run `npm run skills:sync` after adding or editing a project skill (`scripts/sync-skills.mjs`).

[SETUP.md](SETUP.md) step 3 has the agent confirm they're in place for whichever agent is running.

**Project rules come first.** Where an installed skill disagrees with this
project's docs, follow the project. Notably, the `supabase` skill describes a
local-database workflow (`supabase db pull --local`, iterating on the schema
with `execute_sql`); this project has no local database and changes the schema
only through hand-written migration files ([PRACTICES.md](PRACTICES.md), the
`new-table` skill). For the Cloudflare skills:

- This project runs Next.js on Workers through OpenNext (`@opennextjs/cloudflare`).
  Never migrate it to vinext or another adapter.
- `cloudflare-bindings.d.ts` is hand-written on purpose. Don't replace it with
  `wrangler types` output or add `@cloudflare/workers-types`, whatever the
  `wrangler` skill says: both swap global DOM types for the Workers runtime's
  (`Body.json()` returns `unknown`, not `any`) and break ordinary route
  handlers. See [CLOUDFLARE.md](CLOUDFLARE.md).
- No local Workers builds, previews or deploys, and no secrets in
  `wrangler.jsonc` ([CLOUDFLARE.md](CLOUDFLARE.md) "Agent tooling").

## This project's skills (written here)

The repeatable workflows for building on the template: what to touch, in
what order, and what's easy to forget. They're plain `SKILL.md` files, not
installed from anywhere — edit them in place when a convention changes, in
the same change that changes it.

| skill | covers |
|---|---|
| `new-table` | a schema change: `npm run db:new`, the profiles RLS pattern (one policy per operation on `(select auth.uid())`, narrow grants, cascade from `auth.users`), storage buckets, account-deletion cleanup for what doesn't cascade, `db:push` to the dev project + `db:types`, security advisors, production push after merge |
| `new-page` | a protected page (still `requireUser()` in the page, sidebar link, robots, smoke test), a public page (`PUBLIC_ROUTES` in `src/middleware.ts`), an API route (own auth check, JSON 401, webhook signature from the raw body), `?error=` / `?message=` codes |
| `new-component` | a component in `src/components/ui` or a feature module: extend before adding, tokens only, client/server boundary, accessibility, hydration-safe dates, the `/components` gallery entry, recapturing the docs-site gallery screenshots |

## Installed sets

Installed from their official sources with the `skills` CLI, copied into both
folders, and pinned in `skills-lock.json`:

| set | skills | covers |
|---|---|---|
| Supabase (`supabase/agent-skills`) | `supabase`, `supabase-postgres-best-practices` | Supabase products, SSR auth, RLS and security checks, the CLI and MCP, debugging; Postgres schema, indexes, RLS performance, locking |
| Cloudflare (`cloudflare/skills`) | `wrangler`, `cloudflare`, `workers-best-practices` | Wrangler commands and config; the Cloudflare platform (Workers, storage, networking, Zero Trust); writing and reviewing Workers code |

Install commands (also restore a missing one):

```bash
npx skills add supabase/agent-skills -s '*' -a claude-code codex -y --copy
```

```bash
npx skills add cloudflare/skills -s wrangler cloudflare workers-best-practices -a claude-code codex -y --copy
```

Update to the latest versions with `npx skills update -p -y`, review the
diff, and commit it with the new `skills-lock.json`. These files are managed
by the CLI — don't edit them by hand; put project-specific overrides in the
docs instead.

## Writing a new skill

Add one when a multi-step process has been worked out and will be repeated —
not for one-offs. A skill is `.claude/skills/<kebab-name>/SKILL.md` with
frontmatter:

```markdown
---
name: <kebab-name>
description: Use when … — what it covers, and what it is not for. The description is what decides when it triggers, so name the situations.
---
```

Keep the body a checklist that points at the docs for the reasoning, rather
than repeating them. Add the skill to the table above, then run `npm run skills:sync`.
