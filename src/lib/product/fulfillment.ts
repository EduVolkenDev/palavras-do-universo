import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { finalizeVoucherCheckoutSession } from "@/lib/vouchers/service";

type EntitlementProduct = {
  product_key: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

async function getEntitlementProducts(productKey: string) {
  const supabase = getSupabaseAdmin();
  const products = new Set<string>([productKey]);

  if (productKey === "circulo_do_universo") {
    const { data, error } = await supabase
      .from("oracle_products")
      .select("product_key")
      .contains("included_in", ["circulo_do_universo"])
      .returns<EntitlementProduct[]>();
    if (error) throw new Error(`Could not resolve included products: ${error.message}`);

    for (const item of data ?? []) {
      products.add(item.product_key);
    }
  }

  return [...products];
}

async function grantEntitlements(params: {
  userId: string;
  productKey: string;
  source: "purchase" | "subscription";
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const productKeys = await getEntitlementProducts(params.productKey);

  for (const productKey of productKeys) {
    const { data: existing, error: existingError } = await supabase
      .from("user_entitlements")
      .select("id,usage_limit,usage_count,metadata")
      .eq("user_id", params.userId)
      .eq("product_key", productKey)
      .eq("source", params.source)
      .maybeSingle();
    if (existingError) {
      throw new Error(`Could not read entitlement: ${existingError.message}`);
    }

    const existingMetadata =
      existing?.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {};
    const checkoutSessionId = params.metadata?.checkout_session_id;
    const samePurchase =
      params.source === "purchase" &&
      typeof checkoutSessionId === "string" &&
      existingMetadata.checkout_session_id === checkoutSessionId;
    const purchaseUsageLimit =
      params.source === "purchase"
        ? samePurchase
          ? existing?.usage_limit ?? 1
          : (existing?.usage_limit ?? 0) + 1
        : null;
    const usageCount = existing?.usage_count ?? 0;

    const payload = {
      user_id: params.userId,
      product_key: productKey,
      source: params.source,
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: params.expiresAt ?? null,
      usage_limit: purchaseUsageLimit,
      usage_count: usageCount,
      consumed_at:
        purchaseUsageLimit !== null && usageCount < purchaseUsageLimit ? null : undefined,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("user_entitlements")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(`Could not update entitlement: ${error.message}`);
    } else {
      const { error } = await supabase.from("user_entitlements").insert(payload);
      if (error) throw new Error(`Could not create entitlement: ${error.message}`);
    }
  }
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin();
  const userId = session.metadata?.user_id;
  const productKey = session.metadata?.product_key;

  if (!userId || !productKey) {
    return { ok: false as const, reason: "missing_metadata" };
  }
  if (
    session.mode !== "subscription" &&
    !["paid", "no_payment_required"].includes(session.payment_status)
  ) {
    return { ok: false as const, reason: "payment_not_confirmed" };
  }

  if (session.mode === "subscription") {
    const subscriptionId = getString(session.subscription);
    const customerId = getString(session.customer);

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        provider_customer_id: customerId,
        provider_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", "stripe")
      .eq("provider_checkout_id", session.id);
    if (subscriptionError) {
      throw new Error(`Could not activate subscription: ${subscriptionError.message}`);
    }

    await grantEntitlements({
      userId,
      productKey,
      source: "subscription",
      metadata: {
        checkout_session_id: session.id,
        stripe_subscription_id: subscriptionId,
        currency: getString(session.metadata?.currency),
        market: getString(session.metadata?.market),
      },
    });

    const voucherId = getString(session.metadata?.voucher_id);
    if (voucherId) {
      await finalizeVoucherCheckoutSession({
        voucherId,
        checkoutSessionId: session.id,
        userId,
        email:
          getString(session.customer_details?.email) ??
          getString(session.customer_email),
      });
    }

    return {
      ok: true as const,
      userId,
      productKey,
      source: "subscription" as const,
    };
  }

  const { error: purchaseError } = await supabase
    .from("purchases")
    .update({
      status: "paid",
      provider_payment_id: getString(session.payment_intent),
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("provider", "stripe")
    .eq("provider_checkout_id", session.id);
  if (purchaseError) {
    throw new Error(`Could not mark purchase as paid: ${purchaseError.message}`);
  }

  await grantEntitlements({
    userId,
    productKey,
    source: "purchase",
    metadata: {
      checkout_session_id: session.id,
      payment_intent_id: getString(session.payment_intent),
      currency: getString(session.metadata?.currency),
      market: getString(session.metadata?.market),
    },
  });

  const voucherId = getString(session.metadata?.voucher_id);
  if (voucherId) {
    await finalizeVoucherCheckoutSession({
      voucherId,
      checkoutSessionId: session.id,
      userId,
      email:
        getString(session.customer_details?.email) ??
        getString(session.customer_email),
    });
  }

  return { ok: true as const, userId, productKey, source: "purchase" as const };
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const supabase = getSupabaseAdmin();
  const userId = subscription.metadata?.user_id;
  const productKey = subscription.metadata?.product_key;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
    : null;

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("provider", "stripe")
    .eq("provider_subscription_id", subscription.id);
  if (subscriptionError) {
    throw new Error(`Could not synchronize subscription: ${subscriptionError.message}`);
  }

  if (!userId || !productKey) return;

  if (["active", "trialing"].includes(subscription.status)) {
    await grantEntitlements({
      userId,
      productKey,
      source: "subscription",
      expiresAt: currentPeriodEnd,
      metadata: {
        stripe_subscription_id: subscription.id,
        stripe_status: subscription.status,
        currency: getString(subscription.metadata?.currency),
        market: getString(subscription.metadata?.market),
      },
    });
  } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
    const productKeys = await getEntitlementProducts(productKey);
    const { error: revokeError } = await supabase
      .from("user_entitlements")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("source", "subscription")
      .in("product_key", productKeys);
    if (revokeError) {
      throw new Error(`Could not revoke subscription access: ${revokeError.message}`);
    }
  }
}

export async function syncStripeRefund(charge: Stripe.Charge) {
  const paymentIntentId = getString(charge.payment_intent);
  if (!paymentIntentId) return { ok: false as const, reason: "missing_payment_intent" };

  const supabase = getSupabaseAdmin();
  const { data: purchase, error } = await supabase
    .from("purchases")
    .select("id,user_id,product_key,status")
    .eq("provider", "stripe")
    .eq("provider_payment_id", paymentIntentId)
    .maybeSingle();
  if (error || !purchase) {
    return { ok: false as const, reason: "purchase_not_found" };
  }

  const { error: purchaseError } = await supabase
    .from("purchases")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("id", purchase.id);
  if (purchaseError) {
    throw new Error(`Could not mark purchase as refunded: ${purchaseError.message}`);
  }

  const { data: entitlement, error: entitlementError } = await supabase
    .from("user_entitlements")
    .select("id,usage_limit,usage_count")
    .eq("user_id", purchase.user_id)
    .eq("product_key", purchase.product_key)
    .eq("source", "purchase")
    .maybeSingle();
  if (entitlementError) {
    throw new Error(`Could not read refunded entitlement: ${entitlementError.message}`);
  }
  if (entitlement?.id && typeof entitlement.usage_limit === "number") {
    const usageCount =
      typeof entitlement.usage_count === "number" ? entitlement.usage_count : 0;
    const usageLimit = Math.max(entitlement.usage_limit - 1, usageCount);
    const { error: updateError } = await supabase
      .from("user_entitlements")
      .update({
        usage_limit: usageLimit,
        status: usageLimit > usageCount ? "active" : "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", entitlement.id);
    if (updateError) {
      throw new Error(`Could not update refunded entitlement: ${updateError.message}`);
    }
  }

  return { ok: true as const, userId: purchase.user_id, productKey: purchase.product_key };
}
