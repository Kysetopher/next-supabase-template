# Setup

Instructions for an AI coding agent (Claude Code, Codex, or similar) to set
this project up end to end for the person at the keyboard. The person starts
it by pasting:

> Set up this project for me: read docs/SETUP.md and follow it step by step. Stop and wait for me at every USER STEP.

## Rules for the agent

- **Go in order.** Finish and verify each step before the next. If a command fails, read the error, fix the cause, and run it again — don't skip ahead.
- **Stop at every USER STEP.** Tell the user exactly what to do, in plain language with the exact clicks or command, then wait for them to say they're done.
- **Never ask for secrets in chat.** Keys and passwords go straight into `.env.local` (typed by the user in the editor) or into a terminal prompt. Never print, read aloud, or commit `.env.local`. To check it, run `npm run check:env`, which reports problems without showing values.
- **Hosted Supabase only.** Never run a local database: no `supabase start`, `supabase db reset`, or Docker. Every database command targets the user's hosted project.
- **Interactive commands are the user's.** Commands that open a browser or ask for a password (`supabase login`, `supabase link`, `db:push`) are USER STEPs: give the exact command and have the user run it in a terminal — in VS Code, **Terminal → New Terminal**; in Claude Code they can also type `!` followed by the command.
- **Explain as you go**, briefly: what you're about to do and why, in words a non-developer follows.
- Use the shell the user has (PowerShell on Windows, bash/zsh on macOS and Linux).

## 1. Check the tools

Run `node -v` and `npm -v`.

- Node must be **24.x** or newer. If it's missing or older, **USER STEP:** install Node.js 24 from https://nodejs.org, then close and reopen VS Code (and this agent) so the terminal finds it. Check again.
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

Check the folder **your** agent reads:

- **Claude Code:** `.claude/skills/` must contain all five.
- **Codex** (and other agents that use `.agents/skills/`): `.agents/skills/` must contain all five. If the project's own three are missing there, run `npm run skills:sync`.
- **Any other agent with its own skills folder:** install the Supabase set for it with `npx skills add supabase/agent-skills -s '*' -a <agent-id> -y --copy` (`npx skills add --help` lists agent ids), and copy the project's three skills from `.claude/skills/` into that folder.

If one of the Supabase skills is missing anywhere, restore it with:

```bash
npx skills add supabase/agent-skills -s '*' -a claude-code codex -y --copy
```

**Project rules come first.** Where an installed skill disagrees with this project's docs — notably the `supabase` skill's local-database workflow (`supabase db pull --local`, iterating with `execute_sql`) — follow the project: hosted projects only, schema changes as hand-written migration files (the `new-table` skill). Tell the user which skills are loaded, in one line.

## 4. Environment variables

If `.env.local` doesn't exist, copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`; bash: `cp .env.example .env.local`). Don't overwrite an existing one.

**USER STEP — fill in `.env.local`.** Tell the user:

1. Open their project in the Supabase dashboard (https://supabase.com/dashboard). If they don't have one yet: **New project**, pick a name, a strong database password (have them save it in a password manager — they'll need it in step 5) and the region closest to their users.
2. Open `.env.local` in VS Code and paste in:
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

## 6. Supabase dashboard settings

**USER STEP — change four settings** in the Supabase dashboard. Walk through them one at a time:

1. **Authentication → Sign In / Providers → Email:** turn on **Confirm email**, **Secure email change**, and **Secure password change**. Save.
2. **Authentication → Email Templates → Reset Password:** replace the message body with the contents of `supabase/templates/recovery.html` (show the user the file's contents to copy). Subject: `Your password reset code`. Save. The reset page asks for a 6-digit code, so this email must show the code, not a link.
3. **Authentication → URL Configuration:** set **Site URL** to `http://localhost:3000`, and add these two **Redirect URLs**: `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/email-change`. Save.
4. **Database → Extensions:** confirm `pg_cron` is enabled (the migration enables it; this just checks).

Tell them: when the app goes live, the Site URL and the two redirect URLs need adding for the production address too (see **Deploy** in docs/PROJECT.md).

## 7. Make it yours

Ask the user, one question at a time:

1. **The app's name** and a **one-sentence description** → set `name` and `description` in `src/lib/site.ts`.
2. **The brand color** (a hex value like `#2f7cf6`, or a color name you turn into one) → in `src/app/globals.css` `:root`, set `--primary` to it, `--ring` to a much darker shade of it, `--accent` to a very dark tint of it (a dark surface, near `--background`), and `--chart-1` … `--chart-5` to a dark-to-light ramp of that hue (`--chart-3` = the color). Keep `--primary-foreground` readable on it (white on dark/saturated colors, near-black on light ones).
3. **An icon** (optional): if they have one, replace `src/app/favicon.ico`.

Then replace the opening paragraph of `docs/PROJECT.md` with one describing their project (keep the rest).

## 8. Payments (optional)

Ask whether they want Stripe payments **now**. The default is **no** — billing stays off and can be turned on later.

If yes, follow **Setup** in docs/STRIPE.md. The same rules apply: the user types the Stripe keys into `.env.local` themselves (USER STEP), you check them with `npm run check:env`, and the products go in `src/lib/billing/products.ts`.

## 9. Check everything

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

## 10. Try it

Start the app in the background (`npm run dev`) and wait until it's ready.

**USER STEP — sign up.** Tell the user to:

1. Open http://localhost:3000 and click **Create account**.
2. Sign up with a real email address they can open.
3. Click the confirmation link in the email — **in the same browser** — which lands them on the dashboard.
4. Open **Components** in the sidebar to see the UI library.

If any step fails, ask what they saw and fix it.

## 11. Save the work

Ask before committing. If they agree, commit with a message like `Set up project`. Tell them they can review and push it in **GitHub Desktop** (it will show the commit; **Push origin** sends it to GitHub). `.env.local` is ignored by git and must stay out of every commit.

## Done

Summarize for the user: what was set up, the app's name and color, whether payments are on, and the next things they might do (add pages, deploy — see docs/PROJECT.md). Remind them that their keys live only in `.env.local` on this computer, and that the hosting provider needs the same variables when they deploy.
