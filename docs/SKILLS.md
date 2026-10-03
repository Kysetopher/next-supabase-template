# Agent skills

Project-level skills live in `.claude/skills/` (committed), so any Claude
Code session opened in this repo — and every project created from the
template — gets them.

## This project's skills (written here)

The repeatable workflows for building on the template: what to touch, in
what order, and what's easy to forget. They're plain `SKILL.md` files, not
installed from anywhere — edit them in place when a convention changes, in
the same change that changes it.

| skill | covers |
|---|---|
| `new-table` | a schema change: `npm run db:new`, the profiles RLS pattern (one policy per operation on `(select auth.uid())`, narrow grants, cascade from `auth.users`), storage buckets, account-deletion cleanup for what doesn't cascade, `db:push` to the dev project + `db:types`, security advisors, production push after merge |
| `new-page` | a protected page (still `requireUser()` in the page, sidebar link, robots, smoke test), a public page (`PUBLIC_ROUTES` in `src/proxy.ts`), an API route (own auth check, JSON 401, webhook signature from the raw body), `?error=` / `?message=` codes |
| `new-component` | a component in `src/components/ui` or a feature module: extend before adding, tokens only, client/server boundary, accessibility, hydration-safe dates, the `/components` gallery entry, recapturing the docs-site gallery screenshots |

## Recommended installed sets

Not installed by default — add them when a project needs them, from their
official sources, and list them here when you do (pin them in
`skills-lock.json`).

| set | install | covers |
|---|---|---|
| Supabase agent skills (official) | `npx skills add supabase/agent-skills -a claude-code -y --copy` | Postgres/RLS best practices, Supabase CLI and local development, edge functions — recommended by Supabase for agent-driven work on a Supabase project |

Update installed sets with `npx skills update -p` from the repo root.

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
than repeating them. Add the skill to the table above.
