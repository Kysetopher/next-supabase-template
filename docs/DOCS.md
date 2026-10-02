# Docs

All documentation for this project lives in this folder, and every file here must be linked from both [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md), and from this index.

- [PROJECT.md](PROJECT.md) — what this project is: stack, routes, repository layout, scripts, and how to start a new project from the template.
- [PRACTICES.md](PRACTICES.md) — coding conventions: components, styling, data and security, testing, and general project structure.
- [AUTH.md](AUTH.md) — server-only Supabase Auth: the proxy, `requireUser()`, every flow (signup, login, reset, email/password change, delete), rate limits, and the Supabase dashboard settings they depend on.
- [STRIPE.md](STRIPE.md) — optional Stripe billing: products config, env vars, checkout, the webhook and its safety rules, the billing tables, fulfilment hooks, and local testing.
- [SKILLS.md](SKILLS.md) — agent skills in `.claude/skills/`: this project's own repeatable workflows (new table, new page, new component) and recommended installed sets.

## Rule

- `AGENTS.md` and `CLAUDE.md` must link to every file in this folder.
- Every new doc added here must be added to the list above.
- All other documentation lives in `docs/` — not in the repo root, not next to the code. `README.md` is the only exception: the human-facing quick start.
- When code changes what a doc says, update the doc in the same change.
