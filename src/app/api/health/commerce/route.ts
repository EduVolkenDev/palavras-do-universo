import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";
import { getSiteUrl, hasStripeConfig } from "@/lib/stripe/server";

function isAuthorized(request: Request) {
  const expected = process.env.HEALTH_CHECK_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && provided === expected);
}

export async function GET(request: Request) {
  const checks = {
    supabaseServer: hasSupabaseConfig(),
    supabasePublic: hasSupabasePublicConfig(),
    stripeSecret: hasStripeConfig(),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    stripeCheckoutVerified: process.env.STRIPE_CHECKOUT_VERIFIED === "true",
    stripeCustomerPortalVerified:
      process.env.STRIPE_CUSTOMER_PORTAL_VERIFIED === "true",
    productionUrl: !getSiteUrl().includes("localhost"),
    supportEmail: Boolean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  };
  let activePaidProducts = 0;
  let catalogError = "";

  if (checks.supabaseServer) {
    const { data, error } = await getSupabaseAdmin()
      .from("oracle_products")
      .select("product_key")
      .eq("status", "active")
      .gt("price_cents", 0);
    activePaidProducts = data?.length ?? 0;
    catalogError = error?.message ?? "";
  }

  const ready =
    Object.values(checks).every(Boolean) &&
    activePaidProducts >= 4 &&
    !catalogError;

  const summary = {
    ok: ready,
    ready,
  };

  if (!isAuthorized(request)) return NextResponse.json(summary);

  return NextResponse.json({
    ...summary,
    checks,
    activePaidProducts,
    catalogError: catalogError ? "Catalog query failed" : null,
  });
}
