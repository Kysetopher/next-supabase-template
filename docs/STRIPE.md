# Stripe billing (optional)

Subscriptions and one-time purchases through Stripe, with an embedded payment form, Stripe's Customer Portal for self-service, and a webhook that mirrors Stripe into Postgres. **Off by default**: with no `STRIPE_*` env vars set, the app runs normally, `/checkout` 404s, the account page has no Billing section and the webhook answers 503.

## Pieces

| Path | Role |
|---|---|
| `src/lib/env.ts` | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — all or nothing. `isBillingEnabled()`; the `env.STRIPE_*` getters throw when it's off. `readStripePriceId()` for price env vars. |
| `src/lib/billing/products.ts` | The catalog: what can be bought. Ships empty. |
| `src/lib/billing/stripe.ts` | The Stripe client (`createFetchHttpClient()`, so it works on edge runtimes). |
| `src/lib/billing/customers.ts` | One Stripe customer per user (`billing_customers`); email sync; customer deletion; the saved card. |
| `src/lib/billing/subscriptions.ts` | Status mapping, upsert from a re-fetched subscription, `getCurrentSubscription()` / `getActiveSubscription()`, `createSubscription()`. |
| `src/lib/billing/payments.ts` | One-time purchases: `createPaymentIntent()`, `chargeSavedCard()`, `refreshPayment()`, `hasPurchased()`. |
| `src/lib/billing/fulfillment.ts` | **Your code goes here**: `onSubscriptionActive()`, `onPaymentSucceeded()`. |
| `src/lib/actions/billing.ts` | `manageBilling()` (Customer Portal), `payWithSavedCard()` (one-click purchase). |
| `src/app/api/webhooks/stripe/route.ts` | The webhook — the only writer of subscription and payment rows. |
| `src/app/(protected)/checkout/` | `/checkout?product=<key>` (embedded Payment Element) and `/checkout/success`. |
| `src/components/billing/` | `CheckoutForm`, `PaymentMethodCard`, `ManageBillingButton`, `PayWithSavedCardButton`. |
| `supabase/migrations/*_billing.sql` | `billing_customers`, `subscriptions`, `payments`. Users read their own rows; only the service role writes. |

## Setup

1. **Products.** In the Stripe Dashboard (test mode first), create each product and its price under *Product catalog*. Use a recurring price for a subscription and a one-time price for a single purchase. Then list them in `src/lib/billing/products.ts`:

   ```ts
   const CATALOG = {
     pro: { name: "Pro", description: "Billed monthly.", mode: "subscription", priceEnvVar: "STRIPE_PRICE_PRO" },
     lifetime: { name: "Lifetime", description: "One payment.", mode: "payment", priceEnvVar: "STRIPE_PRICE_LIFETIME" },
   } satisfies Record<string, ProductConfig>;
   ```

   The key (`pro`) is what URLs and forms use (`/checkout?product=pro`), and it's stored on rows, so keep it stable. `priceEnvVar` must be `STRIPE_PRICE_<NAME>`. You can also hard-code `priceId: "price_..."`, but then test and live mode can't differ. The amount always comes from the Stripe Price. With billing on, the server won't start if a listed product's price variable is missing.

2. **Env vars** (`.env.local`, or your host's dashboard). Set all three or none:
   - `STRIPE_SECRET_KEY`: *Developers → API keys → Secret key* (`sk_test_…`). A restricted key (`rk_…`) works if it can write Customers, Subscriptions, PaymentIntents, Billing Portal sessions, and read Prices, Charges and Disputes.
   - `STRIPE_PUBLISHABLE_KEY`: same page (`pk_test_…`). It must be the same mode as the secret key. It's passed to the checkout form at request time, not through `NEXT_PUBLIC_`, so one build can't ship the wrong mode's key.
   - `STRIPE_WEBHOOK_SECRET`: from the webhook endpoint (step 3) or `stripe listen` (`whsec_…`).
   - `STRIPE_PRICE_<NAME>`: one per product (`price_…`).

   Setting only some, a wrong prefix (`sk_`/`rk_`, `pk_`, `whsec_`, `price_`), or mixing test and live keys stops the server at startup with a list of what's wrong.

3. **Webhook endpoint.** *Developers → Webhooks → Add endpoint*: `https://<your domain>/api/webhooks/stripe`, subscribed to exactly:

   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   payment_intent.succeeded
   charge.refunded
   charge.dispute.created
   charge.dispute.closed
   ```

   No `invoice.*` events are needed: a paid or failed renewal changes the subscription's status, and that arrives as `customer.subscription.updated`.

4. **Customer Portal.** *Settings → Billing → Customer portal*: turn on updating payment methods, invoice history and cancellation (and plan switching, if you want it). "Manage billing" on `/account` opens it.

5. **Migration.** `npm run db:push` applies `*_billing.sql`. It's harmless with billing off.

### Local webhooks

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe \
  --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,payment_intent.succeeded,charge.refunded,charge.dispute.created,charge.dispute.closed
```

It prints a `whsec_…` secret. Put that in `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`. `/api/*` is outside the middleware's matcher (`src/middleware.ts`), so the webhook is never redirected to `/login`.

## How it flows

- **Subscription**: `/checkout?product=pro` creates the Stripe customer (once per user) and an `incomplete` subscription (`payment_behavior: "default_incomplete"`), or reuses one left unpaid by an earlier visit. The Payment Element pays its first invoice. Stripe sends `customer.subscription.updated`, the webhook re-reads the subscription, and the row becomes `active`. Users who already have an `active` or `past_due` subscription are sent to `/account` instead (one subscription per user; plan changes go through the portal).
- **One-time**: `/checkout?product=lifetime` creates a PaymentIntent for the price's amount with `setup_future_usage: "off_session"`, so the card is saved. `payment_intent.succeeded` makes the webhook record a `payments` row, and the first saved card becomes the customer's default.
- **One-click repeat purchase**: `<PayWithSavedCardButton productKey="lifetime">` posts to `payWithSavedCard`, which charges the default card off-session. With no saved card it goes to `/checkout?product=…`. If the card needs the customer (3-D Secure, a decline), it goes to the same checkout with a message. Each rendered form carries a fresh nonce used as the Stripe idempotency key, so a double-submit charges once. Render it from a Server Component.
- **Manage**: `<ManageBillingButton>` posts to `manageBilling`, which opens the Customer Portal and returns to `/account`.
- **Success page**: `/checkout/success` is UX only. It reads `redirect_status` from the URL and grants nothing.

## Safety rules

1. **The webhook is the source of truth.** Rows are written only there (plus the customer-id row in `getOrCreateStripeCustomer()`). Neither the browser's payment confirmation nor the success page records anything.
2. **Re-fetch, don't trust the event.** Every handler re-reads the subscription or PaymentIntent (with its charge and disputes) from Stripe and writes the current state. Events arrive out of order and are retried for days; a stale "active" copy must not undo a cancellation.
3. **Idempotent, and 500 on failure.** Because handlers write current state, running one twice is harmless. Any error returns 500 so Stripe retries. Fulfilment hooks must be idempotent too (see below).
4. **Ownership from `billing_customers`, never metadata.** The user behind an object is found by its Stripe customer id. Metadata is only a Dashboard note and a link from a PaymentIntent to its catalog entry.
5. **Amounts from Stripe.** Checkout accepts only a catalog key. A one-time payment is attributed to a product only if Stripe received at least that price in its currency; otherwise the row is recorded with `product_key = null` and nothing is fulfilled.
6. **Unknown never means active.** `mapStripeStatus()` maps `active`/`trialing` → `active`; `past_due`/`unpaid`/`paused` → `past_due`; `canceled`/`incomplete_expired` → `canceled`; `incomplete` → `incomplete`; **anything else → `past_due`**. Only `active` grants access. An expired unpaid checkout gets a zero-length period, so it never reads as "canceled but paid up".
7. **Raw-body signature check.** The webhook verifies `stripe-signature` over `request.text()` with `constructEventAsync` (it works with Web Crypto, so it also runs on edge runtimes).
8. **Secrets stay on the server.** The secret key is read only by `src/lib/billing/stripe.ts`. The publishable key reaches the browser as a prop from the server at request time.
9. **Account deletion deletes the Stripe customer first**, which cancels their subscriptions. "Already gone" counts as done; any other failure blocks the deletion, so nobody is billed after their account is gone. (This runs only while billing is enabled. If you switch billing off after customers exist, delete them in Stripe yourself.) An email change updates the customer's email, best effort.

## Granting access (fulfilment)

Read the mirror at request time. That's usually all you need, and revocation is automatic:

```ts
const { supabase, user } = await db();
const subscription = await getActiveSubscription(supabase, user.id); // null unless status = 'active'
const owns = await hasPurchased(supabase, user.id, "lifetime");    // a 'succeeded' payment for that key
```

Cancellations, failed renewals (`past_due`), refunds (`refunded` / `partially_refunded`) and disputes (`disputed`, while open or after a loss) all move the row off the granting status.

For side effects that can't be derived like that (a welcome email, provisioning something, granting a balance), fill in `src/lib/billing/fulfillment.ts`:

- `onSubscriptionActive(row)` runs on every webhook refresh that finds the subscription `active`.
- `onPaymentSucceeded(row)` runs on every refresh that finds a catalog payment `succeeded`.

Both run more than once for the same object. Key whatever they write on `stripe_subscription_id` / `stripe_payment_intent_id` with a unique constraint. Throw to make Stripe retry.

Refunding a subscription payment doesn't end the subscription. Cancel it in Stripe and `customer.subscription.updated`/`deleted` does the rest.

## Testing

With test-mode keys, the webhook forwarded by `stripe listen`, and a product in the catalog:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0025 0000 3155` | Requires 3-D Secure (on-session); on a one-click purchase it falls back to checkout |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0259` | Succeeds, then is disputed (exercises `charge.dispute.created`) |

Use any future expiry, any CVC and any postcode. More: <https://docs.stripe.com/testing>.

Useful CLI triggers: `stripe trigger customer.subscription.updated`, `stripe trigger charge.refunded`. Events for objects that aren't yours (no matching `billing_customers` row) are acknowledged and skipped. Refund a test payment in the Dashboard to watch the row move to `refunded`.

The Playwright smoke suite runs with billing **disabled** (no `STRIPE_*` in `playwright.config.ts`). It checks that `/checkout` is gated and that the webhook never returns 200 to an unsigned request.

## Notes and limits

- One subscription per user, with one item. Plan changes go through the Customer Portal (configure the products it may switch between there). The webhook records the new price and maps it back to a catalog key.
- Opening `/checkout` creates Stripe objects: it reuses an unpaid subscription, but a one-time product gets a new PaymentIntent each time. Unconfirmed ones charge nothing and can be left.
- Two webhook deliveries for the same subscription that run at exactly the same time could each write what they fetched, in either order. The next event corrects it.
- Billing calls go through the burst limiter (`billing` policy, 10/min per user, per instance — see docs/AUTH.md).
- Deploying to Cloudflare Workers: nothing extra is needed. The fetch HTTP client and `constructEventAsync` are already used.
