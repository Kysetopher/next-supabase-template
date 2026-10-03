# Setup

Instructions for an AI coding agent (Claude Code, Codex, or similar) to set
this project up end to end for the person at the keyboard. The person starts
it by pasting:

> Set up this project for me: read docs/SETUP.md and follow it step by step. Stop and wait for me at every USER STEP.

If setup stopped partway (the chat was closed, the app restarted, something failed), the user restarts it with:

> Continue setting up this project: read docs/SETUP.md, work out from the project's current state which step we're on, tell me, and continue from there. Stop and wait for me at every USER STEP.

## Rules for the agent

- **Go in order.** Finish and verify each step before the next. If a command fails, read the error, fix the cause, and run it again — don't skip ahead.
- **Stop at every USER STEP.** Tell the user exactly what to do, in plain language with the exact clicks or command, then wait for them to say they're done.
- **Never ask for secrets in chat.** Keys and passwords go straight into `.env.local` (typed by the user in a text editor) or into a terminal prompt. Never print, read aloud, or commit `.env.local`. To check it, run `npm run check:env`, which reports problems without showing values.
- **Hosted Supabase only.** Never run a local database: no `supabase start`, `supabase db reset`, or Docker. Every database command targets the user's hosted project.
- **Interactive commands are the user's.** Commands that open a browser or wait for a confirmation (`supabase login`, `supabase link`, `db:push`) are USER STEPs: give the exact command and have the user run it in a terminal opened in the project folder (the agent app's terminal if it has one; otherwise Terminal on macOS, or PowerShell on Windows via right-click in the folder → **Open in Terminal**).
- **Never run the middleware-to-proxy codemod.** `next dev` / `next build` print a notice that `middleware` is deprecated and suggest `npx @next/codemod@canary middleware-to-proxy`. That's expected here: the Cloudflare adapter (OpenNext) only fully supports `src/middleware.ts` (docs/CLOUDFLARE.md "Middleware, not proxy"). Ignore the notice.
- **Explain as you go**, briefly: what you're about to do and why, in words a non-developer follows.
- **MCP tools: development Supabase only, read-only, ask before writes.** Never connect a tool to the production Supabase project or write to production. Every sign-in (OAuth windows, approving servers, tokens, browser extensions) is a USER STEP; never ask for a token or write one into a file. Ask before any MCP tool call that writes or deletes. Details: docs/MCP.md.
- Use the shell the user has (PowerShell on Windows, bash/zsh on macOS and Linux).

## 1. Check the tools

Run `node -v` and `npm -v`.

- Node must be **24.x** or newer. If it's missing or older, **USER STEP:** install Node.js 24 from https://nodejs.org, then quit and reopen the agent app so it finds Node. Check again.
- Confirm you're in the project root (it has `package.json` and `docs/SETUP.md`).

## 2. Install dependencies

```bash
npm install
```

## 3. Agent skills

Skills are step-by-step instructions you load for specific kinds of work. They ship **committed in the repo**, so normally there's nothing to download — this step confirms they're in place for the agent you are.

| Skill | From | For |
|---|---|---|
| `new-table`, `new-page`, `new-component` | this project | schema changes, pages and routes, UI components |
| `supabase`, `supabase-postgres-best-practices` | Supabase (official, pinned in `skills-lock.json`) | Supabase and Postgres work |
| `wrangler`, `cloudflare`, `workers-best-practices` | Cloudflare (official, pinned in `skills-lock.json`) | deploying and running on Cloudflare Workers |

Check the folder **your** agent reads:

- **Claude Code:** `.claude/skills/` must contain all eight.
- **Codex** (and other agents that use `.agents/skills/`): `.agents/skills/` must contain all eight. If the project's own three are missing there, run `npm run skills:sync`.
- **Any other agent with its own skills folder:** install the Supabase and Cloudflare sets for it with the commands below, replacing `-a claude-code codex` with `-a <agent-id>` (agent ids: the **Supported Agents** table at https://github.com/vercel-labs/skills), and copy the project's three skills from `.claude/skills/` into that folder.

If one of the installed skills is missing anywhere, restore its set with:

```bash
npx skills add supabase/agent-skills -s '*' -a claude-code codex -y --copy
```

```bash
npx skills add cloudflare/skills -s wrangler cloudflare workers-best-practices -a claude-code codex -y --copy
```

**Project rules come first.** Where an installed skill disagrees with this project's docs — notably the `supabase` skill's local-database workflow (`supabase db pull --local`, iterating with `execute_sql`) — follow the project: hosted projects only, schema changes as hand-written migration files (the `new-table` skill). The Cloudflare overrides (keep OpenNext, keep `cloudflare-bindings.d.ts` hand-written, no local Workers builds) are in docs/SKILLS.md. Tell the user which skills are loaded, in one line.

## 4. Environment variables

If `.env.local` doesn't exist, copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`; bash: `cp .env.example .env.local`). Don't overwrite an existing one.

**USER STEP — fill in `.env.local`.** Tell the user:

1. Open their project in the Supabase dashboard (https://supabase.com/dashboard). If they don't have one yet: **New project**, pick a name, a strong database password (have them save it in a password manager — the app doesn't need it, but Supabase support and direct database tools do) and the region closest to their users.
2. Open `.env.local` (in the project folder) with a text editor — Notepad on Windows, TextEdit on macOS — and paste in:
   - `SUPABASE_URL` — click **Connect** at the top of the project (or **Integrations → Data API → API URL**); it looks like `https://<ref>.supabase.co`.
   - `SUPABASE_PUBLISHABLE_KEY` — **Project Settings → API Keys → Publishable key**.
   - `SUPABASE_SECRET_KEY` — same page, **Secret keys** (click reveal). This one bypasses all security rules: never share it.
   - Leave `SITE_URL=http://localhost:3000` as it is.
3. Save the file and tell you when it's done — **without** pasting the keys into the chat.

Then run:

```bash
npm run check:env
```

Repeat until it prints `Environment OK.`, relaying any problem it reports (it names the variable, never the value).

## 5. Connect Supabase and create the database tables

Get the project ref: it's the subdomain of `SUPABASE_URL`. Read only that line, e.g. PowerShell `Select-String -Path .env.local -Pattern '^SUPABASE_URL='`, bash `grep '^SUPABASE_URL=' .env.local` — never print the whole file.

**USER STEP — run three commands.** Give the user these, with the real ref filled in, to run one at a time:

```bash
npx supabase login
```

(Opens the browser to authorize the Supabase CLI.)

```bash
npx supabase link --project-ref <ref>
```

(Links the CLI to the project. It uses the login from the previous command; no password needed.)

```bash
npm run db:push
```

(Shows the migrations to apply — answer `Y`.) This creates the auth rate-limit tables, `profiles` with the avatars storage bucket, and the billing tables.

Then verify it worked:

```bash
npm run db:types
```

It must succeed, and `src/lib/supabase/types.ts` must contain `profiles`, `auth_email_limits` and `billing_customers`. If the user saw errors, have them paste the error text and fix from there.

## 6. Connect the agent's tools (MCP)

MCP servers give you tools beyond the shell: the development database (read-only), Cloudflare's docs, logs and builds, GitHub, and a browser. What each does and why it's scoped that way: docs/MCP.md. Tell the user in two lines what this step adds and that every sign-in is theirs.

**Which agent are you?** Use what you know about yourself; if unsure, ask the user which app they're using. The config files are `.mcp.json` (Claude Code: the CLI and the desktop app's Code tab) and `.codex/config.toml` (Codex: CLI, IDE extension, ChatGPT desktop app).

**Fill in the development project ref** (from step 5) in **both** files, so either agent works on this project later: replace `__SUPABASE_DEV_PROJECT_REF__` in the `supabase` URL. Change nothing else in the URL — it must keep `read_only=true`. Never use a production ref. Confirm `.mcp.json` still parses (`node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"`), the placeholder is gone from both files, and `git diff -- .mcp.json .codex/config.toml` shows exactly one changed line in each.

**USER STEP — approve and sign in.** MCP servers load when a session starts, so first have the user restart and come back to this same conversation, then continue from here: Claude Code CLI — quit and run `claude --continue` in the project folder; Codex CLI — quit and run `codex resume --last`; a desktop app — quit it fully, reopen it and open this conversation from the sidebar. Then walk them through the steps for their agent, one at a time:

- **Claude Code / Claude desktop Code tab:**
  1. When asked whether to use this project's MCP servers, approve `supabase`, `cloudflare-docs`, `cloudflare-observability` and `cloudflare-builds`. (`github` comes below.)
  2. Run `/mcp`, select `supabase` and finish the sign-in in the browser (or run `claude mcp login supabase` in a terminal). Then the same for `cloudflare-observability` and `cloudflare-builds` (a Cloudflare account is free; if they don't have one yet, they can do this after deploying).
  3. If `/mcp` also lists a Supabase connector from their claude.ai account, have them turn it off for this project — it isn't limited to the development project.
- **Codex (CLI, IDE extension or ChatGPT desktop app):**
  1. Trust the project when Codex asks (it only reads `.codex/config.toml` in trusted projects; if they declined earlier, see Troubleshooting in docs/MCP.md).
  2. In a terminal in the project folder, run one at a time and finish each sign-in in the browser: `codex mcp login supabase`, `codex mcp login cloudflare-observability`, `codex mcp login cloudflare-builds`.

Check it worked: `/mcp` (Claude) or `codex mcp list` (Codex) shows the servers connected. Then make one read-only call — list the tables on the Supabase server — and confirm `profiles` is there. If a server fails, see Troubleshooting in docs/MCP.md.

**GitHub (optional; default no).** Ask whether they want the agent to read issues, pull requests and CI runs on GitHub. It needs a personal access token: if yes, follow "Why GitHub uses a token" in docs/MCP.md — the token is created and saved by the user as the environment variable `GITHUB_PERSONAL_ACCESS_TOKEN`, never pasted in the chat. Then for Claude they approve `github` (`/mcp`; if they declined it at the first prompt, run `claude mcp reset-project-choices` and restart), and for Codex you set `enabled = true` under `[mcp_servers.github]` in `.codex/config.toml` and they restart Codex.

**Browser.** In the Claude desktop Code tab and the ChatGPT desktop app, use the built-in browser for this app; nothing to install. Otherwise ask whether they want browser tools (default no — they can add them later):

- **Claude Code CLI:** **USER STEP** — install the Claude in Chrome extension (https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn, needs a paid Claude plan), then run `/chrome` and choose **Enabled by default**.
- **Codex CLI:** ask before changing their personal Codex config, then add Chrome DevTools MCP with the command for their OS from the Chrome section of docs/MCP.md.

## 7. Supabase dashboard settings

Everything here works on Supabase's **free plan with its built-in email** — no email provider needed. The built-in email only reaches members of the user's Supabase team (their own account email) and sends a couple of emails an hour, so setup leaves email confirmation off until real email is connected ([EMAIL.md](EMAIL.md), optional, before launch).

**USER STEP — change three settings** in the Supabase dashboard. Walk through them one at a time:

1. **Authentication → Sign In / Providers:** under **User Signups**, turn **Confirm email off** (so anyone can sign up and use the app straight away — EMAIL.md turns it back on once real email works). Then open **Email** and turn **Secure email change** and **Secure password change** on. Save.
2. **Authentication → URL Configuration:** set **Site URL** to `http://localhost:3000`, and add these three **Redirect URLs**: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/email-change` and `http://localhost:3000/auth/recovery`. Save.
3. **Database → Extensions:** confirm `pg_cron` is enabled (the migration enables it; this just checks).

Leave the email templates alone. Supabase's default **Reset Password** email sends a link, which lands on `/auth/recovery` signed in and ready to set a new password. (If the project allows editing templates, pasting `supabase/templates/recovery.html` makes it send a 6-digit code instead, which also works across devices — optional.)

Tell them: when the app goes live, the deployed address needs its own Site URL and redirect URLs, and real email should be connected first — the deploy runbook (step 13) walks through it.

## 8. Make it yours

Ask the user, one question at a time:

1. **The app's name** and a **one-sentence description** → set `name` and `description` in `src/lib/site.ts`.
2. **The brand color** (a hex value like `#2f7cf6`, or a color name you turn into one) → in `src/app/globals.css` `:root`, set `--primary` to it, `--ring` to a much darker shade of it, `--accent` to a very dark tint of it (a dark surface, near `--background`), and `--chart-1` … `--chart-5` to a dark-to-light ramp of that hue (`--chart-3` = the color). Set `--primary-foreground` to whichever of `#ffffff` or `#0a0a0a` has the higher contrast on `--primary` (aim for at least 4.5:1). Then put the same `--primary` / `--primary-foreground` / `--ring` values in `FALLBACK` in `src/components/billing/checkout-form.tsx`, and the button `background` / `color` in `src/app/global-error.tsx` — they can't read CSS variables.
3. **An icon** (optional): if they have one, replace `src/app/favicon.ico`.

Then replace the opening paragraph of `docs/PROJECT.md` with one describing their project (keep the rest).

## 9. Payments (optional)

Ask whether they want Stripe payments **now**. The default is **no** — billing stays off and can be turned on later.

If yes, follow the **Turn on payments (agent runbook)** section of docs/STRIPE.md, steps 1–11, then come back to step 10.

## 10. Check everything

Run, fixing anything that fails:

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

If the only failures are "Tearing down … exceeded the test timeout", the pages themselves passed — run it once more.

## 11. Try it

Start the app in the background (`npm run dev`) and wait until it's ready.

**USER STEP — sign up and try a password reset.** Tell the user to:

1. Open http://localhost:3000 and click **Create account**. Sign up with **the same email address as their Supabase account** (the built-in email only reaches their own team), and any password of 8+ characters. With email confirmation off, they land straight on the dashboard.
2. Open **Components** in the sidebar to see the UI library.
3. Log out (Account → Log out), then use **Forgot password?** on the login page with the same email. Open the link in the email **in the same browser**; it lands on the account page, where they set a new password.

If any step fails, ask what they saw and fix it (see **Common problems** below).

## 12. Save the work

Ask before committing. If they agree, commit with a message like `Set up project`. Tell them they can review and push it in **GitHub Desktop** (it will show the commit; **Push origin** sends it to GitHub). `.env.local` is ignored by git and must stay out of every commit.

## 13. Deploy to Cloudflare (when ready)

Optional, and not part of this run. Tell the user that when they want the app live, they paste this into the agent:

> Deploy this project to Cloudflare: read docs/CLOUDFLARE.md and follow the Deploy runbook step by step. Stop and wait for me at every USER STEP.

## Resuming

When asked to continue, don't trust memory of an earlier chat — check the project, then start at the **first step whose check fails**. Read only what's listed; never print `.env.local`.

| Step | Done when |
|---|---|
| 1 | `node -v` is 24 or newer |
| 2 | `node_modules/` exists and `npm ls --depth=0` reports no missing packages |
| 3 | the agent's skills folder has all the skills listed in step 3 |
| 4 | `npm run check:env` prints `Environment OK.` |
| 5 | `supabase/.temp/project-ref` exists (the project is linked) and `npm run db:types` succeeds with `profiles` in `src/lib/supabase/types.ts` |
| 6 | `.mcp.json` / `.codex/config.toml` no longer contain `__SUPABASE_DEV_PROJECT_REF__`, and the user confirms the servers are approved and signed in |
| 7 | **ask the user** — dashboard settings can't be checked from here; walk through step 7's list and have them confirm each |
| 8 | `src/lib/site.ts` no longer has the default `name: "App"` |
| 9 | ask whether they want payments now (skip if not) |
| 10 | typecheck, lint and the smoke tests pass |
| 11 | **ask the user** whether they've signed up and tried a password reset |
| 12 | `git status` is clean, or the user has chosen not to commit yet |

Tell the user which steps are already done (one line) and which step you're starting. If something from a done step is broken (e.g. `check:env` fails after it passed), go back to that step.

### Common problems

- **No reset email arrived:** Supabase's built-in email only reaches members of the Supabase team (use the Supabase account's email) and sends a couple an hour; check spam and wait. To email anyone else, connect real email ([EMAIL.md](EMAIL.md)). The app's own limit is 3 emails an hour per address.
- **"Opened in a different browser":** emailed links (reset, email change, signup confirmation once it's on) only work in the browser that asked for them. Request a new one from that browser.
- **The Supabase project is paused** (free projects pause after a period of inactivity): have the user open the dashboard and click **Restore**, wait for it to come back, then retry.
- **`db:push` or `link` fails with a permissions or login error:** run `npx supabase login` again (the CLI uses that login, not a password), then retry.
- **The agent's tools stopped working after a restart:** they may need approving or signing in again — see [MCP.md](MCP.md).

## Done

Summarize for the user: what was set up, the app's name and color, which agent tools are connected, whether payments are on, and the next things they might do (add pages, deploy with the prompt in step 13). Remind them that their keys live only in `.env.local` on this computer; when they deploy, the secret ones go into Cloudflare as encrypted Secrets, entered by them, never in the chat or in a commit.
