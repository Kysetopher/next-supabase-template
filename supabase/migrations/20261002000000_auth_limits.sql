-- Exact per-email auth limits (src/lib/auth/email-limits.ts).
--
-- The in-app burst limiter is per instance and fails open, and Supabase's own
-- per-IP limits see the server's IP (shared by every user), so neither can
-- stop guesses or sends aimed at one email from many IPs. These counters are
-- exact (one row per email, updated atomically) and live in Postgres. The app
-- treats any error from them as "no" (fail closed).
--
--   * Sends: at most 3 auth emails an hour and 10 a day per email (signup
--     confirmation, reset codes, email-change links).
--   * Guesses: at most 5 per reset code. Only auth_code_sent(), called after a
--     send actually succeeds, resets the count — allowing a send isn't the
--     same as a new code existing.
--   * Password logins: at most 10 attempts per email per 15 minutes, counted
--     before Supabase is called, for unknown emails too (so it doesn't reveal
--     which emails are registered). A successful login clears the row. The
--     trade-off: a stranger can lock an email out of password login for up to
--     15 minutes; the reset-code flow isn't affected.
--
-- Server-only: called with the secret key before any session exists. No user
-- grants; RLS on with no policies.

create extension if not exists pg_cron;

-- ---------------------------------------------------------------- sends + code guesses

create table public.auth_email_limits (
  email text primary key,               -- normalised by the caller: NFKC, trimmed, lowercased
  hour_start timestamptz not null default now(),
  sends_this_hour integer not null default 0,
  day_start timestamptz not null default now(),
  sends_today integer not null default 0,
  guesses_this_code integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.auth_email_limits enable row level security;

-- True, and counted, if another auth email may be sent to this address now.
create function public.auth_email_send_allowed(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.auth_email_limits;
begin
  if p_email is null or length(p_email) = 0 or length(p_email) > 254 then
    return false;
  end if;

  insert into public.auth_email_limits (email) values (p_email) on conflict (email) do nothing;
  select * into v from public.auth_email_limits where email = p_email for update;

  if v.hour_start < now() - interval '1 hour' then
    v.hour_start := now(); v.sends_this_hour := 0;
  end if;
  if v.day_start < now() - interval '1 day' then
    v.day_start := now(); v.sends_today := 0;
  end if;

  if v.sends_this_hour >= 3 or v.sends_today >= 10 then
    update public.auth_email_limits
      set hour_start = v.hour_start, sends_this_hour = v.sends_this_hour,
          day_start = v.day_start, sends_today = v.sends_today, updated_at = now()
      where email = p_email;
    return false;
  end if;

  update public.auth_email_limits
    set hour_start = v.hour_start, sends_this_hour = v.sends_this_hour + 1,
        day_start = v.day_start, sends_today = v.sends_today + 1,
        updated_at = now()
    where email = p_email;
  return true;
end;
$$;

-- Counts one guess against the current code first, then says whether it's
-- within the 5 allowed. Counting before checking keeps concurrent guesses
-- from slipping past the limit together.
create function public.auth_code_guess_allowed(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guesses integer;
begin
  if p_email is null or length(p_email) = 0 or length(p_email) > 254 then
    return false;
  end if;

  update public.auth_email_limits
    set guesses_this_code = guesses_this_code + 1, updated_at = now()
    where email = p_email
    returning guesses_this_code into v_guesses;

  -- No row means no code was ever sent through our flow: nothing to guess.
  return v_guesses is not null and v_guesses <= 5;
end;
$$;

-- A new code was actually issued: it gets a fresh 5 guesses.
create function public.auth_code_sent(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$ update public.auth_email_limits set guesses_this_code = 0, updated_at = now() where email = p_email $$;

-- A correct code: the counter starts fresh for the next one.
create function public.auth_code_succeeded(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$ update public.auth_email_limits set guesses_this_code = 0, updated_at = now() where email = p_email $$;

-- ---------------------------------------------------------------- password logins

create table public.auth_login_limits (
  email text primary key,               -- normalised by the caller (normalizeEmail)
  window_start timestamptz not null default now(),
  attempts integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.auth_login_limits enable row level security;

-- Counts one attempt, then says whether it's within the 10 allowed this window.
create function public.auth_login_attempt_allowed(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if p_email is null or length(p_email) = 0 or length(p_email) > 254 then
    return false;
  end if;

  insert into public.auth_login_limits as l (email, window_start, attempts)
  values (p_email, now(), 1)
  on conflict (email) do update
    set attempts = case when l.window_start < now() - interval '15 minutes' then 1 else l.attempts + 1 end,
        window_start = case when l.window_start < now() - interval '15 minutes' then now() else l.window_start end,
        updated_at = now()
  returning attempts into v_attempts;

  return v_attempts <= 10;
end;
$$;

-- A correct password: the next login starts from zero.
create function public.auth_login_succeeded(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$ delete from public.auth_login_limits where email = p_email $$;

-- ---------------------------------------------------------------- grants

revoke all on function public.auth_email_send_allowed(text) from public, anon, authenticated;
revoke all on function public.auth_code_guess_allowed(text) from public, anon, authenticated;
revoke all on function public.auth_code_sent(text) from public, anon, authenticated;
revoke all on function public.auth_code_succeeded(text) from public, anon, authenticated;
revoke all on function public.auth_login_attempt_allowed(text) from public, anon, authenticated;
revoke all on function public.auth_login_succeeded(text) from public, anon, authenticated;
grant execute on function public.auth_email_send_allowed(text) to service_role;
grant execute on function public.auth_code_guess_allowed(text) to service_role;
grant execute on function public.auth_code_sent(text) to service_role;
grant execute on function public.auth_code_succeeded(text) to service_role;
grant execute on function public.auth_login_attempt_allowed(text) to service_role;
grant execute on function public.auth_login_succeeded(text) to service_role;

-- ---------------------------------------------------------------- pruning

-- Rows past their windows carry no live state.
select cron.schedule(
  'prune-auth-email-limits',
  '30 4 * * *',
  $$delete from public.auth_email_limits where updated_at < now() - interval '2 days'$$
);
select cron.schedule(
  'prune-auth-login-limits',
  '50 4 * * *',
  $$delete from public.auth_login_limits where updated_at < now() - interval '1 day'$$
);
