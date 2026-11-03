import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe, hasStripeConfig } from "@/lib/stripe/server";
import {
  CIRCLE_PRODUCT_KEY,
  INTERNAL_TEST_CIRCLE_PRODUCT_KEY,
  isCircleSubscriptionProduct,
} from "@/lib/product/access";

type SubscriptionRow = {
  id: string;
  plan: string | null;
  product_key: string | null;
  status: string;
  provider_subscription_id: string | null;
  provider_checkout_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, unknown> | null;
};

type LifetimeEntitlementRow = {
  user_id: string;
  metadata: Record<string, unknown> | null;
};

export type CircleBillingStopResult = {
  ok: boolean;
  skipped:
    | "stripe_not_configured"
    | "no_circle_subscription"
    | "cancellation_failed"
    | null;
  scheduled: number;
  canceled: number;
  expiredCheckouts: number;
  alreadyStopped: number;
  error?: string;
};

export type CircleBillingReconciliation = {
  users: number;
  scheduled: number;
  canceled: number;
  expiredCheckouts: number;
  alreadyStopped: number;
  errors: string[];
};

const FINAL_SUBSCRIPTION_STATUSES = new Set(["canceled", "incomplete_expired"]);
const CANCEL_NOW_STATUSES = new Set([
  "incomplete",
  "past_due",
  "unpaid",
  "paused",
]);
const CIRCLE_PRODUCT_KEYS = [
  CIRCLE_PRODUCT_KEY,
  INTERNAL_TEST_CIRCLE_PRODUCT_KEY,
];

function emptyResult(): CircleBillingStopResult {
  return {
    ok: true,
    skipped: null,
    scheduled: 0,
    canceled: 0,
    expiredCheckouts: 0,
    alreadyStopped: 0,
  };
}

function isMissingStripeResource(caught: unknown) {
  return (
    typeof caught === "object" &&
    caught !== null &&
    "code" in caught &&
    (caught as { code?: unknown }).code === "resource_missing"
  );
}

function getObjectId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

function isCircleSubscriptionRow(row: SubscriptionRow) {
  const metadataProductKey =
    row.metadata && typeof row.metadata.product_key === "string"
      ? row.metadata.product_key
      : null;
  return isCircleSubscriptionProduct(
    row.product_key ?? row.plan ?? metadataProductKey ?? ""
  );
}

let circlePriceIdsPromise: Promise<Set<string>> | null = null;

async function getCirclePriceIds() {
  if (!circlePriceIdsPromise) {
    circlePriceIdsPromise = (async () => {
      const { data, error } = await getSupabaseAdmin()
        .from("oracle_products")
        .select("provider_price_id")
        .in("product_key", CIRCLE_PRODUCT_KEYS);

      if (error) {
        throw new Error(`Could not read Circle prices: ${error.message}`);
      }

      return new Set(
        (data ?? [])
          .map((row) => row.provider_price_id)
          .filter(
            (priceId: unknown): priceId is string =>
              typeof priceId === "string" && priceId.length > 0
          )
      );
    })();
  }

  try {
    return await circlePriceIdsPromise;
  } catch (caught) {
    circlePriceIdsPromise = null;
    throw caught;
  }
}

function isCircleStripeSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  circlePriceIds: Set<string>
) {
  const metadataUserId =
    typeof subscription.metadata?.user_id === "string"
      ? subscription.metadata.user_id
      : null;
  if (metadataUserId && metadataUserId !== userId) return false;

  const metadataProductKey =
    typeof subscription.metadata?.product_key === "string"
      ? subscription.metadata.product_key
      : "";
  if (metadataProductKey) {
    return isCircleSubscriptionProduct(metadataProductKey);
  }

  return subscription.items.data.some((item) =>
    circlePriceIds.has(item.price.id)
  );
}

async function listStripeCandidateSubscriptions(params: {
  stripe: Stripe;
  userId: string;
  email: string | null;
}) {
  const found = new Map<string, Stripe.Subscription>();

  // Search by subscription metadata even if the local row is missing. Stripe
  // Search can be unavailable on some accounts, so customer email is the
  // fallback.
  try {
    const result = await params.stripe.subscriptions.search({
      query: `metadata['user_id']:'${params.userId}'`,
      limit: 100,
    });
    for (const subscription of result.data) {
      found.set(subscription.id, subscription);
    }
  } catch {
    // Optional fallback; local subscription rows remain the primary source.
  }

  if (params.email) {
    try {
      const customers = await params.stripe.customers.list({
        email: params.email,
        limit: 10,
      });

      for (const customer of customers.data) {
        const subscriptions = await params.stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 100,
        });
        for (const subscription of subscriptions.data) {
          found.set(subscription.id, subscription);
        }
      }
    } catch (caught) {
      console.warn("[stripe] Could not inspect customer subscriptions by email", {
        userId: params.userId,
        error: caught instanceof Error ? caught.message : "Unknown error",
      });
    }
  }

  return Array.from(found.values());
}

async function stopSubscriptionById(stripe: Stripe, subscriptionId: string) {
  let subscription: Stripe.Subscription;

  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (caught) {
    if (isMissingStripeResource(caught)) {
      return { action: "missing" as const, subscription: null };
    }
    throw caught;
  }

  if (FINAL_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return { action: "already_stopped" as const, subscription };
  }

  if (CANCEL_NOW_STATUSES.has(subscription.status)) {
    const canceled = await stripe.subscriptions.cancel(subscriptionId);
    return { action: "canceled" as const, subscription: canceled };
  }

  if (subscription.cancel_at_period_end) {
    return { action: "already_stopped" as const, subscription };
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return { action: "scheduled" as const, subscription: updated };
}

type StopAction = "scheduled" | "canceled" | "already_stopped" | "missing";

async function markLocalSubscriptionStopped(params: {
  row: SubscriptionRow;
  reason: string;
  subscription: Stripe.Subscription | null;
  action: StopAction;
  expiredCheckout?: string | null;
}) {
  const { row, reason, subscription, action, expiredCheckout } = params;
  const now = new Date().toISOString();
  const metadata: Record<string, unknown> = {
    ...(row.metadata && typeof row.metadata === "object" ? row.metadata : {}),
    billing_stopped_at: now,
    billing_stopped_reason: reason,
  };

  if (subscription) {
    metadata.stripe_status_at_stop = subscription.status;
  }
  if (expiredCheckout) {
    metadata.expired_checkout_session = expiredCheckout;
  }

  const { error } = await getSupabaseAdmin()
    .from("subscriptions")
    .update({
      status:
        action === "missing" || expiredCheckout
          ? "canceled"
          : subscription?.status ?? row.status,
      cancel_at_period_end:
        action === "canceled" || action === "missing" || expiredCheckout
          ? true
          : subscription?.cancel_at_period_end ?? true,
      current_period_end: subscription
        ? getPeriodEnd(subscription)
        : row.current_period_end,
      metadata,
      updated_at: now,
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(`Could not record subscription cancellation: ${error.message}`);
  }
}

async function stopPendingCheckout(params: {
  stripe: Stripe;
  row: SubscriptionRow;
  reason: string;
  processedSubscriptionIds?: Set<string>;
}): Promise<StopAction | "expired_checkout" | null> {
  const { stripe, row, reason } = params;
  if (!row.provider_checkout_id) return null;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(row.provider_checkout_id);
  } catch (caught) {
    if (isMissingStripeResource(caught)) return null;
    throw caught;
  }

  const subscriptionId = getObjectId(session.subscription);
  if (subscriptionId) {
    params.processedSubscriptionIds?.add(subscriptionId);
    const result = await stopSubscriptionById(stripe, subscriptionId);
    await markLocalSubscriptionStopped({
      row,
      reason,
      subscription: result.subscription,
      action: result.action,
    });
    return result.action;
  }

  if (session.status !== "open") return null;

  try {
    await stripe.checkout.sessions.expire(row.provider_checkout_id);
  } catch (caught) {
    if (isMissingStripeResource(caught)) return null;
    throw caught;
  }

  await markLocalSubscriptionStopped({
    row,
    reason,
    subscription: null,
    action: "missing",
    expiredCheckout: row.provider_checkout_id,
  });

  return "expired_checkout";
}

async function stopUnrecordedCircleSubscriptions(params: {
  stripe: Stripe;
  userId: string;
  reason: string;
  rows: SubscriptionRow[];
  processedSubscriptionIds: Set<string>;
  result: CircleBillingStopResult;
}) {
  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("email")
    .eq("id", params.userId)
    .maybeSingle();
  const email =
    profile && typeof profile.email === "string" ? profile.email : null;

  let circlePriceIds = new Set<string>();
  try {
    circlePriceIds = await getCirclePriceIds();
  } catch {
    // Metadata-based matching still protects the common case.
  }

  const candidates = await listStripeCandidateSubscriptions({
    stripe: params.stripe,
    userId: params.userId,
    email,
  });

  for (const candidate of candidates) {
    if (params.processedSubscriptionIds.has(candidate.id)) continue;
    if (!isCircleStripeSubscription(candidate, params.userId, circlePriceIds)) {
      continue;
    }

    params.processedSubscriptionIds.add(candidate.id);
    const stopped = await stopSubscriptionById(params.stripe, candidate.id);
    const row = params.rows.find(
      (item) => item.provider_subscription_id === candidate.id
    );

    if (row) {
      await markLocalSubscriptionStopped({
        row,
        reason: params.reason,
        subscription: stopped.subscription,
        action: stopped.action,
      });
    }

    if (stopped.action === "scheduled") params.result.scheduled += 1;
    else if (stopped.action === "canceled") params.result.canceled += 1;
    else params.result.alreadyStopped += 1;
  }
}

/**
 * Stops recurring Stripe billing for a user's Circle subscription.
 *
 * Active/trialing subscriptions are canceled at the end of the already-paid
 * period, so the customer keeps what they paid for and is not charged again.
 * Unpaid or incomplete subscriptions are canceled immediately. Pending
 * checkouts are expired before they can create a new subscription.
 */
export async function stopCircleSubscriptionBillingForUser(params: {
  userId: string;
  reason: string;
}): Promise<CircleBillingStopResult> {
  if (!hasStripeConfig()) {
    return { ...emptyResult(), ok: false, skipped: "stripe_not_configured" };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("subscriptions")
    .select(
      "id,plan,product_key,status,provider_subscription_id,provider_checkout_id,current_period_end,cancel_at_period_end,metadata"
    )
    .eq("user_id", params.userId)
    .eq("provider", "stripe")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not read subscriptions: ${error.message}`);
  }

  const rows = ((data ?? []) as SubscriptionRow[]).filter(isCircleSubscriptionRow);

  const stripe = getStripe();
  const result = emptyResult();
  const processedSubscriptionIds = new Set<string>();

  for (const row of rows) {
    if (row.provider_subscription_id) {
      if (processedSubscriptionIds.has(row.provider_subscription_id)) continue;
      processedSubscriptionIds.add(row.provider_subscription_id);

      const stopped = await stopSubscriptionById(stripe, row.provider_subscription_id);
      await markLocalSubscriptionStopped({
        row,
        reason: params.reason,
        subscription: stopped.subscription,
        action: stopped.action,
      });

      if (stopped.action === "scheduled") result.scheduled += 1;
      else if (stopped.action === "canceled") result.canceled += 1;
      else result.alreadyStopped += 1;
      continue;
    }

    if (row.status === "pending" && row.provider_checkout_id) {
      const outcome = await stopPendingCheckout({
        stripe,
        row,
        reason: params.reason,
        processedSubscriptionIds,
      });
      if (outcome === "expired_checkout") result.expiredCheckouts += 1;
      else if (outcome === "scheduled") result.scheduled += 1;
      else if (outcome === "canceled") result.canceled += 1;
      else result.alreadyStopped += 1;
      continue;
    }

    result.alreadyStopped += 1;
  }

  // Old accounts can have a real Stripe subscription without a local row
  // (webhook delivery or checkout persistence failed). Search Stripe by the
  // subscription metadata and by the customer email so those accounts are not
  // left with recurring billing after lifetime access was granted.
  await stopUnrecordedCircleSubscriptions({
    stripe,
    userId: params.userId,
    reason: params.reason,
    rows,
    processedSubscriptionIds,
    result,
  });

  if (
    result.scheduled === 0 &&
    result.canceled === 0 &&
    result.expiredCheckouts === 0 &&
    result.alreadyStopped === 0
  ) {
    result.skipped = "no_circle_subscription";
  }

  return result;
}

/**
 * Repairs accounts that redeemed a lifetime Circle voucher before billing
 * cancellation existed. Safe to run repeatedly: canceled subscriptions and
 * expired checkouts are simply reported as already stopped.
 */
export async function reconcileLifetimeCircleVoucherBilling(): Promise<CircleBillingReconciliation> {
  if (!hasStripeConfig()) {
    throw new Error("Stripe is not configured. No billing was changed.");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("user_entitlements")
    .select("user_id,metadata")
    .eq("source", "admin")
    .eq("status", "active")
    .is("expires_at", null)
    .in("product_key", CIRCLE_PRODUCT_KEYS);

  if (error) {
    throw new Error(`Could not read lifetime Circle entitlements: ${error.message}`);
  }

  const userIds = Array.from(
    new Set(
      ((data ?? []) as LifetimeEntitlementRow[])
        .filter((row) => {
          const metadata = row.metadata;
          return (
            typeof row.user_id === "string" &&
            row.user_id.length > 0 &&
            metadata !== null &&
            typeof metadata === "object" &&
            typeof metadata.voucher_id === "string" &&
            metadata.voucher_id.length > 0
          );
        })
        .map((row) => row.user_id)
    )
  );

  const summary: CircleBillingReconciliation = {
    users: userIds.length,
    scheduled: 0,
    canceled: 0,
    expiredCheckouts: 0,
    alreadyStopped: 0,
    errors: [],
  };

  for (const userId of userIds) {
    try {
      const result = await stopCircleSubscriptionBillingForUser({
        userId,
        reason: "lifetime_circle_voucher_reconciliation",
      });
      summary.scheduled += result.scheduled;
      summary.canceled += result.canceled;
      summary.expiredCheckouts += result.expiredCheckouts;
      summary.alreadyStopped += result.alreadyStopped;
    } catch (caught) {
      summary.errors.push(
        `${userId}: ${caught instanceof Error ? caught.message : "Unknown billing error"}`
      );
    }
  }

  return summary;
}
