import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";

type PaidProduct = {
  product_key: string;
  product_type: "one_time" | "subscription";
  price_cents: number;
  currency: string;
  provider_price_id: string | null;
  metadata?: Record<string, unknown> | null;
};

function hasAnthropicConfig() {
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  return key.startsWith("sk-ant-") && key.length > 30;
}

function isAuthorized(request: Request) {
  const expected = process.env.HEALTH_CHECK_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && provided === expected);
}

export async function GET(request: Request) {
  const checks: Record<string, boolean> = {
    supabaseServer: hasSupabaseConfig(),
    supabasePublic: hasSupabasePublicConfig(),
    stripeSecret: hasStripeConfig(),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    stripeCheckoutVerified: false,
    stripeCustomerPortalVerified: false,
    anthropicKey: hasAnthropicConfig(),
    productionUrl: !getSiteUrl().includes("localhost"),
    supportEmail: Boolean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  };
  let activePaidProducts = 0;
  let catalogError = "";
  let stripeError = "";
  let paidProducts: PaidProduct[] = [];

  if (checks.supabaseServer) {
    const { data, error } = await getSupabaseAdmin()
      .from("oracle_products")
      .select(
        "product_key,product_type,price_cents,currency,provider_price_id,metadata"
      )
      .eq("status", "active")
      .gt("price_cents", 0)
      .returns<PaidProduct[]>();
    paidProducts = (data ?? []).filter(
      (product) => product.metadata?.internal_test !== true
    );
    activePaidProducts = paidProducts.length;
    catalogError = error?.message ?? "";
  }

  if (checks.stripeSecret && !catalogError && paidProducts.length > 0) {
    try {
      const stripe = getStripe();
      const [prices, portalConfigurations] = await Promise.all([
        Promise.all(
          paidProducts.map(async (product) => {
            if (!product.provider_price_id) return false;
            const price = await stripe.prices.retrieve(product.provider_price_id);
            const expectsRecurring = product.product_type === "subscription";
            return (
              price.active &&
              price.livemode &&
              price.unit_amount === product.price_cents &&
              price.currency.toUpperCase() === product.currency.toUpperCase() &&
              Boolean(price.recurring) === expectsRecurring
            );
          })
        ),
        getStripe().billingPortal.configurations.list({
          active: true,
          is_default: true,
          limit: 1,
        }),
      ]);

      checks.stripeCheckoutVerified =
        prices.length >= 4 && prices.every(Boolean);
      checks.stripeCustomerPortalVerified =
        portalConfigurations.data.length > 0;
    } catch (error) {
      stripeError =
        error instanceof Error ? error.message : "Stripe verification failed";
    }
  }

  const ready =
    Object.values(checks).every(Boolean) &&
    activePaidProducts >= 4 &&
    !catalogError &&
    !stripeError;
  const oneTimeReady =
    checks.supabaseServer &&
    checks.supabasePublic &&
    checks.stripeSecret &&
    checks.stripeWebhook &&
    checks.stripeCheckoutVerified &&
    checks.anthropicKey &&
    checks.productionUrl &&
    checks.supportEmail &&
    activePaidProducts >= 3 &&
    !catalogError &&
    !stripeError;

  const summary = {
    ok: ready,
    ready,
    oneTimeReady,
  };

  if (!isAuthorized(request)) return NextResponse.json(summary);

  return NextResponse.json({
    ...summary,
    checks,
    activePaidProducts,
    catalogError: catalogError ? "Catalog query failed" : null,
    stripeError: stripeError ? "Stripe verification failed" : null,
  });
}
