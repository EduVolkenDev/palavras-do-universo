import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { readJsonBody } from "@/lib/http/request";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import {
  applyDiscountVoucherToCheckout,
  readVoucherCodeFromRequest,
  recordPendingVoucherCheckout,
} from "@/lib/vouchers/service";

type CheckoutBody = {
  productKey?: unknown;
  email?: unknown;
  voucherCode?: unknown;
};

type OracleProduct = {
  product_key: string;
  title: string;
  product_type: "free" | "one_time" | "subscription";
  status: string;
  price_cents: number | null;
  currency: string;
  access_model: "free" | "one_time" | "subscription_included" | "subscription" | null;
  provider_price_id: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getCheckoutMode(product: OracleProduct): Stripe.Checkout.SessionCreateParams.Mode {
  return product.access_model === "subscription" ||
    product.product_type === "subscription"
    ? "subscription"
    : "payment";
}

function buildLineItem(
  product: OracleProduct,
  overrideAmountCents?: number | null
): Stripe.Checkout.SessionCreateParams.LineItem {
  if (product.provider_price_id && !overrideAmountCents) {
    return {
      price: product.provider_price_id,
      quantity: 1,
    };
  }

  const amountCents = overrideAmountCents ?? product.price_cents;

  if (!amountCents || amountCents <= 0) {
    throw new Error("Product is missing a payable price");
  }

  const currency = product.currency.toLowerCase();
  const recurring =
    getCheckoutMode(product) === "subscription"
      ? { recurring: { interval: "month" as const } }
      : {};

  return {
    quantity: 1,
    price_data: {
      currency,
      unit_amount: amountCents,
      product_data: {
        name: product.title,
        metadata: {
          product_key: product.product_key,
        },
      },
      ...recurring,
    },
  };
}

export async function POST(req: Request) {
  if (
    !(await checkRateLimit({
      request: req,
      scope: "checkout",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return jsonError("Too many checkout attempts", 429);
  }
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const parsed = await readJsonBody<CheckoutBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const productKey = String(body.productKey ?? "").trim();
  const userId = auth.user.id;
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim()
      : auth.user.email;

  if (!productKey) return jsonError("Missing productKey", 400);

  if (isOwnerAccessUser(auth.user)) {
    return NextResponse.json({
      ok: true,
      ownerAccess: true,
      checkoutUrl: "/meu-universo?owner_access=1",
      sessionId: null,
    });
  }

  if (!hasSupabaseConfig()) {
    return jsonError("Supabase is not configured", 503);
  }

  if (!hasStripeConfig()) {
    return jsonError("Stripe is not configured", 503);
  }

  const supabase = getSupabaseAdmin();
  await ensureSupabaseProfile(userId);

  const { data: product, error } = await supabase
    .from("oracle_products")
    .select(
      "product_key,title,product_type,status,price_cents,currency,access_model,provider_price_id"
    )
    .eq("product_key", productKey)
    .single<OracleProduct>();

  if (error || !product) return jsonError("Product not found", 404);
  if (product.status !== "active") return jsonError("Product is not active", 409);
  if (product.access_model === "free" || product.price_cents === 0) {
    return jsonError("Product does not require checkout", 409);
  }
  if (product.access_model === "subscription_included") {
    return jsonError("Product is included in the Círculo do Universo", 409);
  }

  const voucherCode = await readVoucherCodeFromRequest(
    typeof body.voucherCode === "string" ? body.voucherCode : null
  );
  const voucherResult = voucherCode
    ? await applyDiscountVoucherToCheckout({
        code: voucherCode,
        user: auth.user,
        productKey: product.product_key,
      })
    : null;

  if (voucherResult && !voucherResult.ok) {
    return jsonError(voucherResult.message, 409);
  }

  const originalAmountCents = product.price_cents ?? 0;
  const discountPercent = voucherResult?.ok ? voucherResult.voucher.discount_percent ?? 0 : 0;
  const discountedAmountCents =
    discountPercent > 0
      ? Math.round(originalAmountCents * (1 - discountPercent / 100))
      : originalAmountCents;

  if (voucherResult?.ok && discountedAmountCents < 50) {
    return jsonError("Use an access invitation instead of a near-zero checkout coupon", 409);
  }

  const mode = getCheckoutMode(product);
  const siteUrl = getSiteUrl();
  const stripe = getStripe();

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: userId,
      line_items: [
        buildLineItem(
          product,
          voucherResult?.ok && discountPercent > 0 ? discountedAmountCents : null
        ),
      ],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${siteUrl}/meu-universo?checkout=success&session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(
        product.product_key
      )}`,
      cancel_url: `${siteUrl}/?checkout=cancelled&product=${encodeURIComponent(
        product.product_key
      )}`,
      metadata: {
        user_id: userId,
        product_key: product.product_key,
        access_model: product.access_model ?? product.product_type,
        voucher_id: voucherResult?.ok ? voucherResult.voucher.id : "",
        voucher_code: voucherResult?.ok ? voucherResult.voucher.code : "",
        voucher_discount_percent:
          voucherResult?.ok ? String(voucherResult.voucher.discount_percent ?? "") : "",
      },
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                user_id: userId,
                product_key: product.product_key,
              },
            }
          : undefined,
      payment_intent_data:
        mode === "payment"
          ? {
              metadata: {
                user_id: userId,
                product_key: product.product_key,
              },
            }
          : undefined,
    });
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Could not create checkout";
    return jsonError(message, 502);
  }

  if (mode === "subscription") {
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan: product.product_key,
        product_key: product.product_key,
        status: "pending",
        provider: "stripe",
        provider_checkout_id: session.id,
        provider_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        price_cents: discountedAmountCents,
        currency: product.currency,
        metadata: {
          checkout_url: session.url,
          original_amount_cents: originalAmountCents,
          discount_percent: discountPercent,
        },
      });

    if (subscriptionError) {
      console.error("Could not persist pending subscription", subscriptionError.message);
      return jsonError("Could not prepare subscription checkout", 500);
    }
  } else {
    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: userId,
      product_key: product.product_key,
      amount_cents: discountedAmountCents,
      currency: product.currency,
      status: "pending",
      provider: "stripe",
      provider_checkout_id: session.id,
      metadata: {
        checkout_url: session.url,
        original_amount_cents: originalAmountCents,
        discount_percent: discountPercent,
      },
    });

    if (purchaseError) {
      console.error("Could not persist pending purchase", purchaseError.message);
      return jsonError("Could not prepare payment checkout", 500);
    }
  }

  if (voucherResult?.ok) {
    await recordPendingVoucherCheckout({
      voucher: voucherResult.voucher,
      user: auth.user,
      checkoutSessionId: session.id,
      productKey: product.product_key,
      originalAmountCents,
      discountedAmountCents,
    });
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
    appliedVoucher:
      voucherResult?.ok
        ? {
            code: voucherResult.voucher.code,
            discountPercent: voucherResult.voucher.discount_percent,
          }
        : null,
  });
}
