-- Optional Stripe billing (docs/STRIPE.md). Harmless to apply with billing
-- off: nothing reads these tables unless the STRIPE_* env vars are set.
--
-- Same shape as profiles (*_profiles_and_avatars.sql), with one difference:
-- users can only READ their own rows. Every write comes from trusted server
-- code using the service client — the Stripe webhook (which has no user
-- session) and getOrCreateStripeCustomer() — so authenticated gets select
-- and nothing else, and anon gets nothing. Stripe is the source of truth;
-- these rows are a mirror the webhook keeps current, re-reading each object
-- from Stripe before writing it.
--
-- user_id references auth.users on delete cascade, as everywhere. Postgres
-- rows go with the user; the Stripe customer itself is deleted by
-- deleteAccount() before the user is (src/lib/actions/account.ts).

-- ---------------------------------------------------------------- billing_customers

-- One Stripe customer per user. The webhook resolves which user a Stripe
-- object belongs to through this table (by customer id), never metadata.
create table public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique check (char_length(stripe_customer_id) <= 255),
  created_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;

create policy "Users can read their own billing customer"
  on public.billing_customers for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.billing_customers from anon, authenticated;
grant select on public.billing_customers to authenticated;
grant all on public.billing_customers to service_role;

-- ---------------------------------------------------------------- subscriptions

-- Mirrors Stripe subscriptions. `status` is a deliberately narrow mapping of
-- Stripe's statuses (mapStripeStatus() in src/lib/billing/subscriptions.ts):
-- only 'active' grants access, and any status we don't recognise maps to
-- past_due, never active. product_key is null when the subscription is on a
-- price that isn't in src/lib/billing/products.ts.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique check (char_length(stripe_subscription_id) <= 255),
  stripe_price_id text not null check (char_length(stripe_price_id) <= 255),
  product_key text check (char_length(product_key) <= 100),
  status text not null check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "Users can read their own subscriptions"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- payments

-- One row per one-time purchase (a PaymentIntent we created for a
-- `mode: "payment"` product). Subscription invoices aren't recorded here.
-- amount is what Stripe says was received, in the currency's minor unit.
-- status follows the money: refunds and disputes move it off 'succeeded',
-- and only 'succeeded' should grant anything. product_key is null when the
-- payment didn't match a catalog price at the time (logged, not fulfilled).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_payment_intent_id text not null unique check (char_length(stripe_payment_intent_id) <= 255),
  product_key text check (char_length(product_key) <= 100),
  amount bigint not null check (amount >= 0),
  currency text not null check (char_length(currency) = 3),
  status text not null check (status in ('succeeded', 'refunded', 'partially_refunded', 'disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments (user_id);

alter table public.payments enable row level security;

create policy "Users can read their own payments"
  on public.payments for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
grant all on public.payments to service_role;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
