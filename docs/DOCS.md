# Docs

All documentation for this project lives in this folder, and every file here must be linked from both [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md), and from this index.

- [SETUP.md](SETUP.md) — the agent-run setup: paste one prompt into an AI coding agent and it sets the project up end to end, stopping for the steps only the user can do.
- [PROJECT.md](PROJECT.md) — what this project is: stack, routes, repository layout, scripts, and how to start a new project from the template.
- [PRACTICES.md](PRACTICES.md) — coding conventions: components, styling, data and security, testing, and general project structure.
- [AUTH.md](AUTH.md) — server-only Supabase Auth: the middleware, `requireUser()`, every flow (signup, login, reset, email/password change, delete), rate limits, and the Supabase dashboard settings they depend on.
- [STRIPE.md](STRIPE.md) — optional Stripe billing: products config, env vars, checkout, the webhook and its safety rules, the billing tables, fulfilment hooks, and local testing.
- [CLOUDFLARE.md](CLOUDFLARE.md) — deploying to Cloudflare Workers through OpenNext and Workers Builds: environments, variables and secrets, domain and Access, Supabase and Stripe per environment, rate-limit bindings, middleware-not-proxy, agent tooling (Wrangler, Cloudflare's skills), and the agent-run deploy runbook.
- [SKILLS.md](SKILLS.md) — agent skills in `.claude/skills/` (Claude Code) and `.agents/skills/` (Codex and others): this project's own workflows (new table, new page, new component), the pinned Supabase set, and why project rules override installed skills.
- [MCP.md](MCP.md) — the agent's tool connections (MCP) for Claude and Codex: Supabase (development project, read-only), Cloudflare (docs, logs, builds), GitHub, Chrome; safety rules, per-client setup, troubleshooting.

## Rule

- `AGENTS.md` and `CLAUDE.md` must link to every file in this folder.
- Every new doc added here must be added to the list above.
- All other documentation lives in `docs/` — not in the repo root, not next to the code. `README.md` is the only exception: the human-facing quick start.
- When code changes what a doc says, update the doc in the same change.
