# Monetization Readiness

The codebase is ready for a launch verification pass when all items below are
confirmed in the target environment.

## Required configuration

- Apply every migration in `supabase/migrations/`.
- Confirm `consume_rate_limit` is active so production limits are shared across instances.
- Configure Supabase server and public keys.
- Configure `ANTHROPIC_API_KEY` and confirm the selected Claude model is available.
- Configure Stripe secret and webhook keys.
- Configure `NEXT_PUBLIC_SITE_URL` with the canonical production URL.
- Configure `NEXT_PUBLIC_SUPPORT_EMAIL` with a monitored support inbox.
- Configure `HEALTH_CHECK_TOKEN` for private commerce diagnostics.
- Configure the Stripe Customer Portal.
- Register `/api/stripe/webhook` in Stripe.
- Keep `STRIPE_CHECKOUT_VERIFIED=false` until a live Checkout Session can be created.
- Keep `STRIPE_CUSTOMER_PORTAL_VERIFIED=false` until a subscriber can open the live portal.

## Required paid-flow verification

1. Buy each one-time product in Stripe test mode.
2. Confirm exactly one new use is delivered for each new payment.
3. Re-open the same completed checkout and confirm no extra use is added.
4. Consume a reading, buy it again, and confirm the available-use count increases.
5. Subscribe to Círculo do Universo and confirm the promised included experiences.
6. Cancel the subscription and confirm unrelated purchases remain active.
7. Open the billing portal from Meu Universo.
8. Request a refund in test mode and verify the intended manual support process.
9. Complete one controlled live purchase and confirm payment, entitlement, delivery and recovery.
10. Set `STRIPE_CHECKOUT_VERIFIED=true` and `STRIPE_CUSTOMER_PORTAL_VERIFIED=true`
    only after their live checks pass.

## Health check

`GET /api/health/commerce` reports configuration readiness without exposing secrets.
It intentionally remains not ready until the live Checkout and Customer Portal
checks have been explicitly confirmed.
