@AGENTS.md

# Docs

All project documentation lives in [docs/](docs/DOCS.md) — start there.

- [docs/DOCS.md](docs/DOCS.md) — how documentation in this repo is organized
- [docs/SETUP.md](docs/SETUP.md) — agent-run setup: paste one prompt into an AI coding agent to set the project up end to end
- [docs/PROJECT.md](docs/PROJECT.md) — what this project is: stack, routes, layout, scripts, starting a new project
- [docs/PRACTICES.md](docs/PRACTICES.md) — coding conventions: components, styling, data and security, testing
- [docs/AUTH.md](docs/AUTH.md) — server-only Supabase Auth: middleware, `requireUser()`, every flow, rate limits, dashboard settings
- [docs/EMAIL.md](docs/EMAIL.md) — agent-run email setup: auth emails sent from your own domain through Resend (Supabase custom SMTP, Cloudflare DNS), limits, troubleshooting
- [docs/STRIPE.md](docs/STRIPE.md) — optional Stripe billing: products, checkout, webhook, billing tables, fulfilment
- [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) — deploying to Cloudflare Workers (OpenNext, Workers Builds): environments, variables and secrets, domain, agent tooling, and the agent-run deploy runbook
- [docs/SKILLS.md](docs/SKILLS.md) — agent skills (`.claude/skills/`, mirrored to `.agents/skills/`): new table, new page, new component, plus Supabase's official set
- [docs/MCP.md](docs/MCP.md) — the agent's tool connections (`.mcp.json`, `.codex/config.toml`): Supabase dev project read-only, Cloudflare docs/logs/builds, GitHub, Chrome; safety rules and setup
