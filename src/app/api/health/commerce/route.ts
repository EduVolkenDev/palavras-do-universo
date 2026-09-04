import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";
import {
  CIRCLE_INCLUDED_PRODUCTS,
  CIRCLE_PRODUCT_KEY,
  PAID_READING_PRODUCTS,
} from "@/lib/product/access";
import {
  PRODUCT_CURRENCIES,
  getProductPriceForCurrency,
  normalizeProductCurrency,
} from "@/lib/product/pricing";

type PaidProduct = {
  product_key: string;
  product_type: "one_time" | "subscription";
  price_cents: number;
  currency: string;
  provider_price_id: string | null;
  included_in: string[] | null;
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
    catalogMatrix: false,
    multiCurrencyCatalog: false,
    anthropicKey: hasAnthropicConfig(),
    productionUrl: !getSiteUrl().includes("localhost"),
    supportEmail: Boolean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  };
  let activePaidProducts = 0;
  let catalogError = "";
  let stripeError = "";
  let paidProducts: PaidProduct[] = [];
  const expectedPaidProductKeys = Array.from(PAID_READING_PRODUCTS);
  const expectedCircleIncludedProductKeys = Array.from(CIRCLE_INCLUDED_PRODUCTS);

  // Detailed checks can query both Supabase and Stripe. Keep unauthenticated
  // probes cheap and private diagnostics behind the bearer token.
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, ready: false, oneTimeReady: false },
      { status: process.env.HEALTH_CHECK_TOKEN ? 401 : 200 }
    );
  }

  if (checks.supabaseServer) {
    const { data, error } = await getSupabaseAdmin()
      .from("oracle_products")
      .select(
        "product_key,product_type,price_cents,currency,provider_price_id,included_in,metadata"
      )
      .eq("status", "active")
      .gt("price_cents", 0)
      .returns<PaidProduct[]>();
    paidProducts = (data ?? []).filter(
      (product) => product.metadata?.internal_test !== true
    );
    activePaidProducts = paidProducts.length;
    catalogError = error?.message ?? "";

    const activePaidProductKeys = new Set(
      paidProducts.map((product) => product.product_key)
    );
    const missingPaidProductKeys = expectedPaidProductKeys.filter(
      (productKey) => !activePaidProductKeys.has(productKey)
    );
    const missingCircleIncludedProductKeys = expectedCircleIncludedProductKeys.filter(
      (productKey) => {
        const product = paidProducts.find(
          (candidate) => candidate.product_key === productKey
        );
        return !(product?.included_in ?? []).includes(CIRCLE_PRODUCT_KEY);
      }
    );
    checks.catalogMatrix =
      !catalogError &&
      activePaidProductKeys.has(CIRCLE_PRODUCT_KEY) &&
      missingPaidProductKeys.length === 0 &&
      missingCircleIncludedProductKeys.length === 0;
    checks.multiCurrencyCatalog =
      checks.catalogMatrix &&
      expectedPaidProductKeys.every((productKey) =>
        PRODUCT_CURRENCIES.every((currency) => {
          const price = getProductPriceForCurrency(productKey, currency);
          return Boolean(price && price.amountCents >= 50);
        })
      );
  }

  if (checks.stripeSecret && !catalogError && paidProducts.length > 0) {
    try {
      const stripe = getStripe();
      const [prices, portalConfigurations] = await Promise.all([
        Promise.all(
          paidProducts.map(async (product) => {
            if (!product.provider_price_id) {
              return (
                product.product_type === "one_time" &&
                product.price_cents >= 50 &&
                product.currency.toUpperCase() === "BRL"
              );
            }
            const price = await stripe.prices.retrieve(product.provider_price_id);
            const expectsRecurring = product.product_type === "subscription";
            const baseCurrency = normalizeProductCurrency(product.currency);
            const matrixPrice = baseCurrency
              ? getProductPriceForCurrency(product.product_key, baseCurrency)
              : null;
            const usesInlinePricing =
              product.product_key === CIRCLE_PRODUCT_KEY ||
              product.metadata?.pricing_source === "inline" ||
              matrixPrice?.amountCents !== product.price_cents;
            if (usesInlinePricing) {
              return Boolean(
                matrixPrice &&
                  matrixPrice.amountCents === product.price_cents &&
                  product.price_cents >= 50
              );
            }
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
        prices.length >= expectedPaidProductKeys.length && prices.every(Boolean);
      checks.stripeCustomerPortalVerified =
        portalConfigurations.data.length > 0;
    } catch (error) {
      stripeError =
        error instanceof Error ? error.message : "Stripe verification failed";
    }
  }

  const ready =
    Object.values(checks).every(Boolean) &&
    activePaidProducts >= expectedPaidProductKeys.length &&
    !catalogError &&
    !stripeError;
  const oneTimeReady =
    checks.supabaseServer &&
    checks.supabasePublic &&
    checks.stripeSecret &&
    checks.stripeWebhook &&
    checks.stripeCheckoutVerified &&
    checks.multiCurrencyCatalog &&
    checks.anthropicKey &&
    checks.productionUrl &&
    checks.supportEmail &&
    activePaidProducts >= expectedPaidProductKeys.length &&
    !catalogError &&
    !stripeError;

  const summary = {
    ok: ready,
    ready,
    oneTimeReady,
  };

  return NextResponse.json({
    ...summary,
    checks,
    activePaidProducts,
    expectedPaidProducts: expectedPaidProductKeys,
    expectedCircleIncludedProducts: expectedCircleIncludedProductKeys,
    missingPaidProductKeys: expectedPaidProductKeys.filter(
      (productKey) => !paidProducts.some((product) => product.product_key === productKey)
    ),
    missingCircleIncludedProductKeys: expectedCircleIncludedProductKeys.filter(
      (productKey) =>
        !paidProducts.some(
          (product) =>
            product.product_key === productKey &&
            (product.included_in ?? []).includes(CIRCLE_PRODUCT_KEY)
        )
    ),
    supportedCurrencies: PRODUCT_CURRENCIES,
    catalogError: catalogError ? "Catalog query failed" : null,
    stripeError: stripeError ? "Stripe verification failed" : null,
  });
}
