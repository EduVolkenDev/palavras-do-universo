# Palavras do Universo Supabase Operations

## Active Project

- URL: `https://matykrddzfjcswqjanly.supabase.co`
- Project ref: `matykrddzfjcswqjanly`
- Dashboard: `https://supabase.com/dashboard/project/matykrddzfjcswqjanly`

## Current Migration Plan

The original May 2026 schema was intentionally small: profiles, usage, readings,
saved messages, subscriptions and purchases.

The next migration is:

```bash
supabase/migrations/20260528090000_expand_palavras_platform.sql
```

It keeps the original tables and adds:

- richer profile/auth metadata
- reading intent/prompt/safety fields
- favorite/tag support for saved messages
- product catalog rows in `oracle_products`
- access control rows in `user_entitlements`
- provider event audit rows in `payment_events`
- ritual/journal style rows in `ritual_entries`
- reading resonance feedback in `reading_feedback`
- `active_entitlements` view
- `updated_at` triggers and baseline RLS policies

## Required Environment Keys

Server-side:

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Client-side:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or
`STRIPE_WEBHOOK_SECRET` to browser code.

## Checkout And Delivery

Checkout creation is handled by:

```text
POST /api/checkout/create
```

Required JSON:

```json
{
  "productKey": "caminho_3_cartas",
  "userId": "local-or-auth-user-id"
}
```

Stripe webhook delivery is handled by:

```text
POST /api/stripe/webhook
```

Configure this endpoint in Stripe with these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Successful one-time checkouts update `purchases` and create active
`user_entitlements`. Successful subscription checkouts update `subscriptions`
and create active entitlements for `circulo_do_universo` plus its included
products.

## Apply Remote Migration

Confirm the linked project first:

```bash
npx supabase migration list --linked
```

Apply:

```bash
npx supabase db push
```

After applying, run:

```bash
npm run lint
npm run build
curl http://localhost:3000/api/health/supabase
```

## Dashboard Settings To Review

In Supabase dashboard for `matykrddzfjcswqjanly`:

- Auth URL configuration: set production site URL when the real domain is ready.
- Redirect URLs: add local dev and production URLs.
- Email templates: keep language aligned with Palavras do Universo, not VOLYNX.
- SMTP: configure before relying on production email login.
- API keys: rotate any old leaked or stale service keys before launch.
- Database backups: enable a backup cadence before paid usage.

## Product Boundary

Palavras do Universo remains its own product/backend. Do not wire this project
to VOLYNX catalog, routes, checkout or entitlements unless that boundary is
explicitly changed later.
