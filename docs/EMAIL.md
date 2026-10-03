# Email (auth emails through your own domain)

Supabase Auth sends every account email this app relies on: the signup confirmation link, the password-reset code and the email-change links. Out of the box it uses Supabase's built-in mailer, which is for trying things out only: it sends **2 emails an hour**, **only to members of your Supabase team**, so signups and password resets start failing as soon as real users arrive. The fix is **custom SMTP**: Supabase hands its emails to a transactional email provider that sends them from your own domain. This project uses **Resend**. Nothing in the app's code changes — it's all dashboard and DNS settings.

To set it up, open the project in an AI coding agent and paste:

> Set up real email sending for this project: read docs/EMAIL.md and follow the runbook step by step. Stop and wait for me at every USER STEP.

## Set up email (agent runbook)

Instructions for an AI coding agent to send this project's auth emails through Resend for the person at the keyboard. It can run any time after [SETUP.md](SETUP.md); it must be done on the production Supabase project before launch.

**Rules for the agent:** the same as [SETUP.md](SETUP.md) — go in order, stop at every USER STEP, explain as you go, hosted Supabase only (no local database, no `supabase start`). And for this runbook:

- **The Resend API key is typed by the user into the Supabase dashboard, and nowhere else.** Never ask for it in chat, and never put it in `.env.local`, `wrangler.jsonc`, a Cloudflare Secret, `supabase/config.toml` or any other file: the app never sends email itself, Supabase does, so the app doesn't need the key.
- **Every settings change is a USER STEP** — in Resend, in Cloudflare DNS and in the Supabase dashboard. Tools are for checking only: the Supabase MCP server (development project, read-only — [MCP.md](MCP.md)) to read the Auth logs, the Cloudflare MCP servers to read docs, and public DNS lookups (`Resolve-DnsName` in PowerShell, `dig` or `nslookup` elsewhere) to see whether records are live. Never change a setting through any tool.
- **One provider, one path.** Follow the steps as written. Don't switch to Resend's one-click Supabase integration (it needs Resend to get access to the user's Supabase organization) or to another provider unless the user asks.

1. **Ask about the domain.** Email must come from a domain the user owns, on Cloudflare DNS (as in [CLOUDFLARE.md](CLOUDFLARE.md)). Confirm they own one and that it's active in their Cloudflare account; a `workers.dev` or `supabase.co` address can't be used. If they have no domain yet, stop here: explain that the built-in mailer keeps working for their own team's addresses until then, and that this runbook is needed before real users sign up. We'll send from the subdomain `auth.<domain>` (it keeps the auth emails' reputation separate from anything else the domain sends), as `no-reply@auth.<domain>`. Also ask for the **sender name** people will see (suggest the app's `name` from `src/lib/site.ts`).
2. **Find the Supabase projects.** The development project's ref is the subdomain of `SUPABASE_URL` in `.env.local` (read only that line). If production is deployed, its ref is in the `SUPABASE_URL` under `vars` in `wrangler.jsonc`. Custom SMTP is set **per Supabase project**, so each one gets steps 8–11; tell the user which projects that is.
3. **USER STEP — Resend account.** If they don't have one: sign up at https://resend.com/signup. The free plan is enough to start (limits under [Reference](#reference)).
4. **USER STEP — add the domain in Resend.** **Domains → Add domain**: enter `auth.<domain>`, choose the region closest to most of their users, and add it. Resend then lists the DNS records to create. Leave that page open.
5. **USER STEP — DNS records in Cloudflare.** In another tab: Cloudflare dashboard → the domain → **DNS → Records**. For each record Resend lists under sending (DKIM and SPF; skip the optional receiving `MX`), **Add record** with Resend's **Type**, **Name**, **Content**/**Value** and, for `MX`, **Priority** `10`:
   - **Name:** paste it the way Resend shows it, without the domain itself — e.g. `send.auth`, not `send.auth.<domain>`; Cloudflare appends the domain.
   - **Proxy status:** `TXT` and `MX` records have no proxy toggle. If any record is a `CNAME`, set it to **DNS only** (grey cloud) — a proxied record never verifies.
   - Don't edit or delete the domain's existing `MX` or root `TXT` (SPF) records: these records live on the `auth` subdomain and don't touch them.

   (Resend may also offer **Sign in to Cloudflare** to add the records automatically. That's fine if the user prefers it; it creates the same records.)
6. **Check, then verify.** Look the records up yourself (replace the names with the ones Resend showed), e.g. PowerShell `Resolve-DnsName -Type TXT resend._domainkey.auth.<domain>` and `Resolve-DnsName -Type MX send.auth.<domain>`; bash `dig +short TXT resend._domainkey.auth.<domain>`. When they answer with Resend's values: **USER STEP** — in Resend, click the domain's verify button (or wait; Resend keeps checking) until the domain shows **Verified**. Often within 15 minutes; DNS can take up to 72 hours. Don't continue until it's verified.
7. **USER STEP — DMARC (once).** Check for an existing policy: `Resolve-DnsName -Type TXT _dmarc.<domain>` / `dig +short TXT _dmarc.<domain>`. If there's one, leave it (it covers the subdomain too). If there's none: Cloudflare → **DNS → Records → Add record**: Type `TXT`, Name `_dmarc`, Content `v=DMARC1; p=none;`. (`p=none` only monitors; tighten it later, once mail is passing.) Then, in Resend, confirm the domain's **click and open tracking are off** (the default) — tracking rewrites the links in auth emails and can break them.
8. **USER STEP — API key.** Resend → **API Keys → Create API key**: name it after the Supabase project (e.g. `supabase-auth-dev`), permission **Sending access**, domain `auth.<domain>`. Resend shows the key **once**: keep it on the clipboard for the next step only — don't paste it into the chat or save it in a file. One key per Supabase project, so either can be revoked alone.
9. **USER STEP — custom SMTP in Supabase.** Supabase dashboard → the project → **Authentication → Emails → SMTP Settings** (`https://supabase.com/dashboard/project/<ref>/auth/smtp`). Turn on **Enable custom SMTP** and fill in:

   | Field | Value |
   |---|---|
   | Sender email | `no-reply@auth.<domain>` |
   | Sender name | the name from step 1 |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the API key from step 8 (paste it here, nowhere else) |

   Leave any other field at its default. Save.
10. **USER STEP — email rate limit.** **Authentication → Rate Limits**: the limit for emails sent per hour, now editable, starts at **30**. Set it to what a busy hour could need, but not above what the Resend plan sends (the free plan's 100 a day means 30 an hour is plenty; raise it on a paid plan). The app's own per-address limits ([AUTH.md](AUTH.md)) still apply on top.
11. **USER STEP — turn on confirmation and set the templates.** **Authentication → Sign In / Providers:** under **User Signups**, turn **Confirm email on** (setup left it off because the built-in email only reached the team) and save. Then **Authentication → Emails → Templates** (new free-plan projects can only edit them once custom SMTP is on). Show the user each file's contents to copy:
    - **Reset Password:** subject `Your password reset code`, body `supabase/templates/recovery.html`. It shows `{{ .Token }}`, a 6-digit code entered on `/reset-password`, which works on any device (the default link email also works, via `/auth/recovery`, but only in the browser that asked).
    - **Confirm signup:** subject `Confirm your email`, body `supabase/templates/confirmation.html`.

    Save each.
12. **USER STEP — send a real email.** With `npm run dev` running (start it in the background if it isn't), have the user open http://localhost:3000/forgot-password, enter their own address, and confirm: the email arrives from the sender name and `no-reply@auth.<domain>`, shows a 6-digit code, and the code sets a new password. Optionally also sign up with a second address and click the link **in the same browser**. In Gmail, **⋮ → Show original** should say `PASS` for SPF, DKIM and DMARC. If nothing arrives, read the development project's Auth logs through the Supabase MCP server and have the user check Resend → **Emails** for the message's status, then use **Troubleshooting** below.
13. **Production.** Repeat steps 8–11 on the **production** Supabase project, with its own API key (e.g. `supabase-auth-prod`) and the same domain and sender; then **USER STEP** — the same test on the live site (`<SITE_URL>/forgot-password`). The Supabase MCP server doesn't reach production: if something fails there, the user reads **Logs → Auth** in that project's dashboard. If production isn't deployed yet, tell the user to come back to this step after the deploy runbook, before inviting anyone.

Summarize: the sending domain and sender, which Supabase projects now use Resend (and which still need it), the email rate limit set on each, that both templates are in, and the test result. Remind them the API keys live only in Supabase's SMTP settings (to rotate one: create a new key in Resend, paste it into that project's SMTP password, then delete the old key), and that the free plan's daily limit is the next thing to watch as signups grow.

## Reference

### Why

The built-in mailer exists so a new project can try auth. It sends 2 emails an hour, only to addresses on the project's team, with no delivery guarantee, and since June 2026 new free-plan projects can't edit their email templates on it — which this app needs for the reset code. Custom SMTP lifts all of that: emails go to anyone, from your domain, with a rate limit you set.

### Settings at a glance

| | |
|---|---|
| Provider | Resend (alternative, not covered step by step: Postmark — host `smtp.postmarkapp.com`, port `587`, username and password both the Server API token) |
| Sending domain | `auth.<domain>`, DNS on Cloudflare, records **DNS only** |
| Sender | `no-reply@auth.<domain>`, the app's name |
| SMTP | `smtp.resend.com`, port `465` (implicit TLS; `587` with STARTTLS also works), username `resend`, password = a **Sending access** API key |
| Where the key lives | Supabase → Authentication → Emails → SMTP Settings, one key per project. Never in the repo, `.env.local` or Cloudflare. |
| Rate limit | Supabase → Authentication → Rate Limits; 30 an hour by default once custom SMTP is on |
| Templates | `supabase/templates/*.html`, pasted into each project's dashboard (`supabase/config.toml` only records them) |

`supabase/config.toml` has a commented `[auth.email.smtp]` block with the same values, for reference only: this project never runs a local Supabase stack, so the dashboard is where it's actually set.

### Limits

- **Resend free plan:** 3,000 emails a month, at most 100 a day. Every signup, reset code and email change counts. Upgrade before you expect more than that.
- **Supabase:** the hourly email limit above, across all users. When it's hit, signups and reset requests fail with an email rate-limit error until the hour rolls over.
- **This app:** 3 emails an hour and 10 a day per address, 5 requests a minute per IP ([AUTH.md](AUTH.md)), so one person can't use up the shared limits.

### Troubleshooting

- **Emails land in spam.** Check **Show original**: SPF, DKIM and DMARC must all say `PASS`. If DKIM fails, the `resend._domainkey…` record is wrong or missing; if DMARC fails, the sender address isn't on the verified domain (it must be `…@auth.<domain>`). Keep tracking off, keep the templates plain (no images, few links), and give a new domain a few days of low volume to build reputation. Ask recipients to mark the email "not spam" once.
- **Domain won't verify.** Look the records up (step 6). Common causes: the full domain pasted into Cloudflare's Name field (giving `send.auth.<domain>.<domain>`), a `CNAME` left proxied (orange cloud), or a typo in the long DKIM value. Fix it and press **Verify** again; after 72 hours use **Restart verification** in Resend.
- **"Email rate limit exceeded" / "over_email_send_rate_limit".** The Supabase hourly limit (step 10) was hit — raise it, or wait an hour. If it's still 2, custom SMTP isn't saved on that project. If Resend shows the emails as failed, the daily or monthly quota is used up.
- **Nothing arrives, no error.** The SMTP settings are wrong (most often the password: create a new key and paste it again) or the domain isn't verified yet. The project's Auth logs show the SMTP error; Resend → **Emails** shows whether Resend received it.
- **Confirmation link "expired" or "invalid".** The signup link must be opened in the **same browser** the user signed up in; opened elsewhere, the email is still confirmed and the app tells them to log in ([AUTH.md](AUTH.md)). Link-scanning mail filters (common at companies) can open a link before the user does — the password reset uses a typed code for exactly this reason. Make sure Resend click tracking is off.
- **Links point to `localhost` or the wrong site.** The project's **Authentication → URL Configuration** Site URL and Redirect URLs are wrong for that environment ([CLOUDFLARE.md](CLOUDFLARE.md)).
- **Reset email has a link, not a code.** The Reset Password template wasn't pasted into that project (step 11).

### Sources

[Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) · [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits) · [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) · [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates) · [Template editing on the free plan](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier) · [Resend with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp) · [Resend SMTP](https://resend.com/docs/send-with-smtp) · [Resend domains](https://resend.com/docs/add-a-domain) · [Resend on Cloudflare DNS](https://resend.com/docs/knowledge-base/cloudflare) · [Resend DMARC](https://resend.com/docs/dashboard/domains/dmarc) · [Resend tracking](https://resend.com/docs/dashboard/domains/tracking) · [Resend pricing](https://resend.com/pricing) · [Postmark SMTP](https://postmarkapp.com/developer/user-guide/send-email-with-smtp)
