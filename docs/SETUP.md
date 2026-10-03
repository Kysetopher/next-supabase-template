# Setup

Instructions for an AI coding agent (Claude Code, Codex, or similar) to set
this project up end to end for the person at the keyboard. The person starts
it by pasting:

> Set up this project for me: read docs/SETUP.md and follow it step by step. Stop and wait for me at every USER STEP.

## Rules for the agent

- **Go in order.** Finish and verify each step before the next. If a command fails, read the error, fix the cause, and run it again — don't skip ahead.
- **Stop at every USER STEP.** Tell the user exactly what to do, in plain language with the exact clicks or command, then wait for them to say they're done.
- **Never ask for secrets in chat.** Keys and passwords go straight into `.env.local` (typed by the user in a text editor) or into a terminal prompt. Never print, read aloud, or commit `.env.local`. To check it, run `npm run check:env`, which reports problems without showing values.
- **Hosted Supabase only.** Never run a local database: no `supabase start`, `supabase db reset`, or Docker. Every database command targets the user's hosted project.
- **Interactive commands are the user's.** Commands that open a browser or ask for a password (`supabase login`, `supabase link`, `db:push`) are USER STEPs: give the exact command and have the user run it in a terminal opened in the project folder (the agent app's terminal if it has one; otherwise Terminal on macOS, or PowerShell on Windows via right-click in the folder → **Open in Terminal**).
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
- **Any other agent with its own skills folder:** install the Supabase and Cloudflare sets for it with the commands below, replacing `-a claude-code codex` with `-a <agent-id>` (`npx skills add --help` lists agent ids), and copy the project's three skills from `.claude/skills/` into that folder.

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

1. Open their project in the Supabase dashboard (https://supabase.com/dashboard). If they don't have one yet: **New project**, pick a name, a strong database password (have them save it in a password manager — they'll need it in step 5) and the region closest to their users.
2. Open `.env.local` (in the project folder) with a text editor — Notepad on Windows, TextEdit on macOS — and paste in:
   - `SUPABASE_URL` — **Project Settings → Data API → Project URL** (looks like `https://<ref>.supabase.co`).
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

(Asks for the **database password** from step 4.)

```bash
npm run db:push
```

(Asks for the database password again, then shows the migrations to apply — answer `Y`.) This creates the auth rate-limit tables, `profiles` with the avatars storage bucket, and the billing tables.

Then verify it worked — this needs no password:

```bash
npm run db:types
```

It must succeed, and `src/lib/supabase/types.ts` must contain `profiles`, `auth_email_limits` and `billing_customers`. If the user saw errors, have them paste the error text (not passwords) and fix from there.

## 6. Connect the agent's tools (MCP)

MCP servers give you tools beyond the shell: the development database (read-only), Cloudflare's docs, logs and builds, GitHub, and a browser. What each does and why it's scoped that way: docs/MCP.md. Tell the user in two lines what this step adds and that every sign-in is theirs.

**Which agent are you?** Use what you know about yourself; if unsure, ask the user which app they're using. The config files are `.mcp.json` (Claude Code: the CLI and the desktop app's Code tab) and `.codex/config.toml` (Codex: CLI, IDE extension, ChatGPT desktop app).

**Fill in the development project ref** (from step 5) in **both** files, so either agent works on this project later: replace `__SUPABASE_DEV_PROJECT_REF__` in the `supabase` URL. Change nothing else in the URL — it must keep `read_only=true`. Never use a production ref. Confirm both files still parse (`node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"`) and that the placeholder is gone from both.

**USER STEP — approve and sign in.** MCP servers load when a session starts, so first have the user restart and come back to this same conversation, then continue from here: Claude Code CLI — quit and run `claude --continue` in the project folder; Codex CLI — quit and run `codex resume --last`; a desktop app — quit it fully, reopen it and open this conversation from the sidebar. Then walk them through the steps for their agent, one at a time:

- **Claude Code / Claude desktop Code tab:**
  1. When asked whether to use this project's MCP servers, approve `supabase`, `cloudflare-docs`, `cloudflare-observability` and `cloudflare-builds`. (`github` comes below.)
  2. Run `/mcp`, select `supabase` → **Authenticate**, and finish the Supabase sign-in in the browser. Then the same for `cloudflare-observability` and `cloudflare-builds` (a Cloudflare account is free; if they don't have one yet, they can do this after deploying).
  3. If `/mcp` also lists a Supabase connector from their claude.ai account, have them turn it off for this project — it isn't limited to the development project.
- **Codex (CLI, IDE extension or ChatGPT desktop app):**
  1. Trust the project when Codex asks (it only reads `.codex/config.toml` in trusted projects; if they declined earlier, see Troubleshooting in docs/MCP.md).
  2. In a terminal in the project folder, run one at a time and finish each sign-in in the browser: `codex mcp login supabase`, `codex mcp login cloudflare-observability`, `codex mcp login cloudflare-builds`.

Check it worked: `/mcp` (Claude) or `codex mcp list` (Codex) shows the servers connected. Then make one read-only call — list the tables on the Supabase server — and confirm `profiles` is there. If a server fails, see Troubleshooting in docs/MCP.md.

**GitHub (optional; default no).** Ask whether they want the agent to read issues, pull requests and CI runs on GitHub. It needs a personal access token: if yes, follow "Why GitHub uses a token" in docs/MCP.md — the token is created and saved by the user as the environment variable `GITHUB_PERSONAL_ACCESS_TOKEN`, never pasted in the chat. Then for Claude they approve `github` (`/mcp`), and for Codex you set `enabled = true` under `[mcp_servers.github]` in `.codex/config.toml` and they restart Codex.

**Browser.** In the Claude desktop Code tab and the ChatGPT desktop app, use the built-in browser for this app; nothing to install. Otherwise ask whether they want browser tools (default no — they can add them later):

- **Claude Code CLI:** **USER STEP** — install the Claude in Chrome extension (https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn, needs a paid Claude plan), then run `/chrome` and choose **Enabled by default**.
- **Codex CLI:** ask before changing their personal Codex config, then add Chrome DevTools MCP with the command for their OS from the Chrome section of docs/MCP.md.

## 7. Supabase dashboard settings

**USER STEP — change four settings** in the Supabase dashboard. Walk through them one at a time:

1. **Authentication → Sign In / Providers → Email:** turn on **Confirm email**, **Secure email change**, and **Secure password change**. Save.
2. **Authentication → Email Templates → Reset Password:** replace the message body with the contents of `supabase/templates/recovery.html` (show the user the file's contents to copy). Subject: `Your password reset code`. Save. The reset page asks for a 6-digit code, so this email must show the code, not a link.
3. **Authentication → URL Configuration:** set **Site URL** to `http://localhost:3000`, and add these two **Redirect URLs**: `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/email-change`. Save.
4. **Database → Extensions:** confirm `pg_cron` is enabled (the migration enables it; this just checks).

Tell them: when the app goes live, the deployed address needs its own Site URL and redirect URLs — the deploy runbook (step 13) walks through it.

## 8. Make it yours

Ask the user, one question at a time:

1. **The app's name** and a **one-sentence description** → set `name` and `description` in `src/lib/site.ts`.
2. **The brand color** (a hex value like `#2f7cf6`, or a color name you turn into one) → in `src/app/globals.css` `:root`, set `--primary` to it, `--ring` to a much darker shade of it, `--accent` to a very dark tint of it (a dark surface, near `--background`), and `--chart-1` … `--chart-5` to a dark-to-light ramp of that hue (`--chart-3` = the color). Keep `--primary-foreground` readable on it (white on dark/saturated colors, near-black on light ones).
3. **An icon** (optional): if they have one, replace `src/app/favicon.ico`.

Then replace the opening paragraph of `docs/PROJECT.md` with one describing their project (keep the rest).

## 9. Payments (optional)

Ask whether they want Stripe payments **now**. The default is **no** — billing stays off and can be turned on later.

If yes, follow **Setup** in docs/STRIPE.md. The same rules apply: the user types the Stripe keys into `.env.local` themselves (USER STEP), you check them with `npm run check:env`, and the products go in `src/lib/billing/products.ts`.

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

## 11. Try it

Start the app in the background (`npm run dev`) and wait until it's ready.

**USER STEP — sign up.** Tell the user to:

1. Open http://localhost:3000 and click **Create account**.
2. Sign up with a real email address they can open.
3. Click the confirmation link in the email — **in the same browser** — which lands them on the dashboard.
4. Open **Components** in the sidebar to see the UI library.

If any step fails, ask what they saw and fix it.

## 12. Save the work

Ask before committing. If they agree, commit with a message like `Set up project`. Tell them they can review and push it in **GitHub Desktop** (it will show the commit; **Push origin** sends it to GitHub). `.env.local` is ignored by git and must stay out of every commit.

## 13. Deploy to Cloudflare (when ready)

Optional, and not part of this run. Tell the user that when they want the app live, they paste this into the agent:

> Deploy this project to Cloudflare: read docs/CLOUDFLARE.md and follow the Deploy runbook step by step. Stop and wait for me at every USER STEP.

## Done

Summarize for the user: what was set up, the app's name and color, which agent tools are connected, whether payments are on, and the next things they might do (add pages, deploy with the prompt in step 13). Remind them that their keys live only in `.env.local` on this computer; when they deploy, the secret ones go into Cloudflare as encrypted Secrets, entered by them, never in the chat or in a commit.
