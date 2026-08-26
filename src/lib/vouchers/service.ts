import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { pricingPlans, productCards } from "@/lib/product/catalog";
import { getSiteUrl } from "@/lib/stripe/server";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

export const ACTIVE_VOUCHER_COOKIE = "pdu_active_voucher";

export const VOUCHER_KINDS = ["invite", "discount", "hybrid"] as const;
export const VOUCHER_STATUSES = [
  "draft",
  "active",
  "paused",
  "cancelled",
  "deleted",
] as const;

export type VoucherKind = (typeof VOUCHER_KINDS)[number];
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

export type VoucherRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  kind: VoucherKind;
  status: VoucherStatus;
  target_email: string | null;
  target_user_id: string | null;
  transferable: boolean;
  max_uses: number;
  times_used: number;
  starts_at: string;
  expires_at: string | null;
  last_redeemed_at: string | null;
  product_key: string | null;
  eligible_product_keys: string[] | null;
  grant_product_keys: string[] | null;
  grant_usage_limit: number | null;
  grant_expires_days: number | null;
  discount_percent: number | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VoucherRedemptionRow = {
  id: string;
  voucher_id: string;
  user_id: string | null;
  email: string | null;
  product_key: string | null;
  checkout_session_id: string | null;
  status: "pending_checkout" | "redeemed" | "transferred" | "revoked";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type VoucherAudience = {
  targetEmail?: string | null;
  targetUserId?: string | null;
  transferable?: boolean;
};

export type VoucherCreateInput = {
  code?: string | null;
  label: string;
  description?: string | null;
  kind: VoucherKind;
  productKey?: string | null;
  eligibleProductKeys?: string[];
  grantProductKeys?: string[];
  grantUsageLimit?: number | null;
  grantExpiresDays?: number | null;
  discountPercent?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
} & VoucherAudience;

export type VoucherUpdateInput = Partial<
  Pick<
    VoucherCreateInput,
    | "label"
    | "description"
    | "productKey"
    | "eligibleProductKeys"
    | "grantProductKeys"
    | "grantUsageLimit"
    | "grantExpiresDays"
    | "discountPercent"
    | "maxUses"
    | "startsAt"
    | "expiresAt"
    | "metadata"
  > &
    VoucherAudience
> & {
  status?: VoucherStatus;
};

type VoucherView = VoucherRow & {
  share_url: string;
  primary_title: string | null;
};

type VoucherValidation =
  | { ok: true; voucher: VoucherRow }
  | { ok: false; code: string; message: string };

const KIND_PREFIX: Record<VoucherKind, string> = {
  invite: "PDU",
  discount: "DISC",
  hybrid: "CIRCLE",
};

function normalizeList(values: string[] | null | undefined) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
}

export function normalizeVoucherCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/gi, "")
    .toUpperCase();
}

function cleanText(value: unknown, max = 240) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function cleanNumber(value: unknown, min: number, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function isVoucherKind(value: string): value is VoucherKind {
  return (VOUCHER_KINDS as readonly string[]).includes(value);
}

function isVoucherStatus(value: string): value is VoucherStatus {
  return (VOUCHER_STATUSES as readonly string[]).includes(value);
}

function createCode(kind: VoucherKind) {
  const prefix = KIND_PREFIX[kind] ?? "PDU";
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${random}`;
}

function getProductTitle(productKey: string | null) {
  if (!productKey) return null;
  const card = productCards.find((item) => item.productKey === productKey);
  if (card) return card.title;
  const plan = pricingPlans.find((item) => item.productKey === productKey);
  return plan?.title ?? productKey;
}

function getShareUrl(code: string) {
  return `${getSiteUrl()}/voucher/${encodeURIComponent(code)}`;
}

function validateVoucherInput(input: VoucherCreateInput | VoucherUpdateInput, strict = true) {
  const label = "label" in input ? cleanText(input.label, 160) : null;
  const kindRaw = "kind" in input ? String(input.kind ?? "") : "";
  const kind = kindRaw ? (kindRaw.toLowerCase() as VoucherKind) : null;
  const productKey = "productKey" in input ? cleanText(input.productKey, 100) : null;
  const eligibleProductKeys =
    "eligibleProductKeys" in input ? normalizeList(input.eligibleProductKeys) : [];
  const grantProductKeys =
    "grantProductKeys" in input ? normalizeList(input.grantProductKeys) : [];
  const discountPercent =
    "discountPercent" in input ? cleanNumber(input.discountPercent, 1, 100) : null;

  if (strict) {
    if (!label) throw new Error("Label is required");
    if (!kind || !isVoucherKind(kind)) throw new Error("Invalid voucher kind");
    if ((kind === "invite" || kind === "hybrid") && !grantProductKeys.length) {
      throw new Error("Choose at least one product to unlock");
    }
    if ((kind === "discount" || kind === "hybrid") && !discountPercent) {
      throw new Error("Discount vouchers need a percentage");
    }
  }

  return {
    label,
    description: "description" in input ? cleanText(input.description, 1200) : null,
    kind,
    productKey,
    eligibleProductKeys,
    grantProductKeys,
    grantUsageLimit:
      "grantUsageLimit" in input ? cleanNumber(input.grantUsageLimit, 1, 500) : null,
    grantExpiresDays:
      "grantExpiresDays" in input ? cleanNumber(input.grantExpiresDays, 1, 3650) : null,
    discountPercent,
    maxUses: "maxUses" in input ? cleanNumber(input.maxUses, 1, 5000) : null,
    startsAt: "startsAt" in input ? cleanText(input.startsAt, 80) : null,
    expiresAt: "expiresAt" in input ? cleanText(input.expiresAt, 80) : null,
    targetEmail:
      "targetEmail" in input
        ? cleanText(input.targetEmail, 320)?.toLowerCase() ?? null
        : null,
    targetUserId: "targetUserId" in input ? cleanText(input.targetUserId, 120) : null,
    transferable:
      "transferable" in input && typeof input.transferable === "boolean"
        ? input.transferable
        : false,
    metadata:
      "metadata" in input && input.metadata && typeof input.metadata === "object"
        ? input.metadata
        : {},
  };
}

async function getIncludedProductKeys(productKey: string) {
  const supabase = getSupabaseAdmin();
  const keys = new Set<string>([productKey]);

  if (productKey === "circulo_do_universo") {
    const { data } = await supabase
      .from("oracle_products")
      .select("product_key")
      .contains("included_in", ["circulo_do_universo"]);

    for (const item of data ?? []) {
      if (typeof item.product_key === "string" && item.product_key) {
        keys.add(item.product_key);
      }
    }
  }

  return [...keys];
}

async function resolveProfileByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("id,email")
    .ilike("email", normalized)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data && typeof data.id === "string" ? data : null;
}

export async function listVouchers(limit = 200) {
  const { data, error } = await getSupabaseAdmin()
    .from("voucher_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) throw error;

  return (data ?? []).map((item) => ({
    ...(item as VoucherRow),
    share_url: getShareUrl(item.code),
    primary_title: getProductTitle(item.product_key),
  })) as VoucherView[];
}

export async function createVoucher(actor: User, input: VoucherCreateInput) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured");
  }

  await ensureSupabaseProfile(actor.id);
  const parsed = validateVoucherInput(input, true);
  const code = normalizeVoucherCode(input.code) || createCode(parsed.kind as VoucherKind);

  let targetUserId = parsed.targetUserId;
  if (!targetUserId && parsed.targetEmail) {
    targetUserId = (await resolveProfileByEmail(parsed.targetEmail))?.id ?? null;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("voucher_codes")
    .insert({
      code,
      label: parsed.label,
      description: parsed.description,
      kind: parsed.kind,
      status: "active",
      target_email: parsed.targetEmail,
      target_user_id: targetUserId,
      transferable: parsed.transferable,
      max_uses: parsed.maxUses ?? 1,
      starts_at: parsed.startsAt || new Date().toISOString(),
      expires_at: parsed.expiresAt || null,
      product_key: parsed.productKey,
      eligible_product_keys: parsed.eligibleProductKeys,
      grant_product_keys: parsed.grantProductKeys,
      grant_usage_limit: parsed.grantUsageLimit,
      grant_expires_days: parsed.grantExpiresDays,
      discount_percent: parsed.discountPercent,
      metadata: parsed.metadata,
      created_by: actor.id,
      last_updated_by: actor.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This code already exists");
    }
    throw error;
  }

  return {
    ...(data as VoucherRow),
    share_url: getShareUrl(data.code),
    primary_title: getProductTitle(data.product_key),
  } satisfies VoucherView;
}

export async function updateVoucher(actor: User, voucherId: string, input: VoucherUpdateInput) {
  const parsed = validateVoucherInput(input, false);
  const patch: Record<string, unknown> = {
    last_updated_by: actor.id,
  };

  if ("label" in input && parsed.label) patch.label = parsed.label;
  if ("description" in input) patch.description = parsed.description;
  if ("productKey" in input) patch.product_key = parsed.productKey;
  if ("eligibleProductKeys" in input) patch.eligible_product_keys = parsed.eligibleProductKeys;
  if ("grantProductKeys" in input) patch.grant_product_keys = parsed.grantProductKeys;
  if ("grantUsageLimit" in input) patch.grant_usage_limit = parsed.grantUsageLimit;
  if ("grantExpiresDays" in input) patch.grant_expires_days = parsed.grantExpiresDays;
  if ("discountPercent" in input) patch.discount_percent = parsed.discountPercent;
  if ("maxUses" in input && parsed.maxUses !== null) patch.max_uses = parsed.maxUses;
  if ("startsAt" in input && parsed.startsAt) patch.starts_at = parsed.startsAt;
  if ("expiresAt" in input) patch.expires_at = parsed.expiresAt || null;
  if ("targetEmail" in input) patch.target_email = parsed.targetEmail;
  if ("targetUserId" in input) patch.target_user_id = parsed.targetUserId;
  if ("transferable" in input) patch.transferable = parsed.transferable;
  if ("metadata" in input) patch.metadata = parsed.metadata;
  if ("status" in input) {
    const nextStatus = String(input.status ?? "").toLowerCase();
    if (!isVoucherStatus(nextStatus)) throw new Error("Invalid voucher status");
    patch.status = nextStatus;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("voucher_codes")
    .update(patch)
    .eq("id", voucherId)
    .select("*")
    .single();

  if (error) throw error;

  return {
    ...(data as VoucherRow),
    share_url: getShareUrl(data.code),
    primary_title: getProductTitle(data.product_key),
  } satisfies VoucherView;
}

export async function softDeleteVoucher(actor: User, voucherId: string) {
  return updateVoucher(actor, voucherId, { status: "deleted" });
}

export async function getVoucherByCode(code: string) {
  const normalized = normalizeVoucherCode(code);
  if (!normalized || !hasSupabaseConfig()) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("voucher_codes")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();

  if (error) throw error;
  return (data as VoucherRow | null) ?? null;
}

function voucherAudienceMatches(voucher: VoucherRow, user: User | null) {
  if (voucher.transferable) return true;
  if (!voucher.target_email && !voucher.target_user_id) return true;
  if (!user) return false;
  const email = user.email?.trim().toLowerCase() ?? "";

  if (voucher.target_user_id && voucher.target_user_id !== user.id) return false;
  if (voucher.target_email && voucher.target_email !== email) return false;
  return true;
}

function validateVoucherRow(
  voucher: VoucherRow | null,
  normalized: string,
  user: User | null,
  options: { allowExhausted?: boolean } = {}
): VoucherValidation {
  if (!voucher || !normalized) {
    return { ok: false, code: "NOT_FOUND", message: "Voucher not found" };
  }
  if (voucher.status !== "active") {
    return { ok: false, code: "INACTIVE", message: "Voucher is not active" };
  }
  if (voucher.starts_at && new Date(voucher.starts_at).getTime() > Date.now()) {
    return { ok: false, code: "NOT_STARTED", message: "Voucher is not active yet" };
  }
  if (voucher.expires_at && new Date(voucher.expires_at).getTime() <= Date.now()) {
    return { ok: false, code: "EXPIRED", message: "Voucher expired" };
  }
  if (!options.allowExhausted && voucher.times_used >= voucher.max_uses) {
    return { ok: false, code: "EXHAUSTED", message: "Voucher usage limit reached" };
  }
  if (!voucherAudienceMatches(voucher, user)) {
    return { ok: false, code: "FORBIDDEN", message: "Voucher is reserved for another account" };
  }

  return { ok: true, voucher };
}

export async function validateVoucher(
  code: string,
  user: User | null = null
): Promise<VoucherValidation> {
  const voucher = await getVoucherByCode(code);
  const normalized = normalizeVoucherCode(code);
  return validateVoucherRow(voucher, normalized, user);
}

async function grantVoucherEntitlements(params: {
  voucher: VoucherRow;
  redemptionId: string;
  userId: string;
}) {
  const supabase = getSupabaseAdmin();
  const baseKeys = normalizeList(params.voucher.grant_product_keys);
  const productKeys = new Set<string>();

  for (const key of baseKeys) {
    for (const includedKey of await getIncludedProductKeys(key)) {
      productKeys.add(includedKey);
    }
  }

  const expiresAt =
    params.voucher.grant_expires_days && params.voucher.grant_expires_days > 0
      ? new Date(
          Date.now() + params.voucher.grant_expires_days * 24 * 60 * 60 * 1000
        ).toISOString()
      : null;

  for (const productKey of productKeys) {
    const { data: current, error: currentError } = await supabase
      .from("user_entitlements")
      .select("id,metadata,usage_limit,usage_count,consumed_at")
      .eq("user_id", params.userId)
      .eq("product_key", productKey)
      .eq("source", "admin");
    if (currentError) {
      throw new Error(`Could not read voucher entitlement: ${currentError.message}`);
    }

    const matching = (current ?? []).find((item) => {
      const metadata =
        item.metadata && typeof item.metadata === "object"
          ? (item.metadata as Record<string, unknown>)
          : {};
      return metadata.voucher_id === params.voucher.id;
    });

    const usageLimit = params.voucher.grant_usage_limit;
    const now = new Date().toISOString();
    const insertPayload = {
      user_id: params.userId,
      product_key: productKey,
      source: "admin" as const,
      status: "active",
      starts_at: now,
      expires_at: expiresAt,
      usage_limit: usageLimit,
      usage_count: 0,
      consumed_at: null,
      metadata: {
        voucher_id: params.voucher.id,
        voucher_code: params.voucher.code,
        voucher_kind: params.voucher.kind,
        voucher_redemption_id: params.redemptionId,
        voucher_label: params.voucher.label,
      },
      updated_at: now,
    };

    if (matching?.id) {
      const currentUsageCount =
        typeof matching.usage_count === "number" ? matching.usage_count : 0;
      const consumedAt =
        typeof usageLimit === "number" && currentUsageCount >= usageLimit
          ? matching.consumed_at ?? now
          : null;
      const updatePayload = {
        ...insertPayload,
        usage_count: currentUsageCount,
        consumed_at: consumedAt,
      };
      const { error } = await supabase
        .from("user_entitlements")
        .update(updatePayload)
        .eq("id", matching.id);
      if (error) throw new Error(`Could not update voucher entitlement: ${error.message}`);
    } else {
      const { error } = await supabase.from("user_entitlements").insert(insertPayload);
      if (error) throw new Error(`Could not create voucher entitlement: ${error.message}`);
    }
  }
}

async function incrementVoucherUsage(voucherId: string) {
  const { data, error } = await getSupabaseAdmin().rpc("increment_voucher_usage", {
    p_voucher_id: voucherId,
  });
  if (error) throw error;
  if (data !== true) {
    throw new Error("Voucher usage limit reached");
  }
}

export async function redeemVoucherForUser(user: User, code: string) {
  const existingVoucher = await getVoucherByCode(code);
  const normalized = normalizeVoucherCode(code);
  const initialValidation = validateVoucherRow(existingVoucher, normalized, user, {
    allowExhausted: true,
  });
  if (!initialValidation.ok) return initialValidation;

  const validation = validateVoucherRow(existingVoucher, normalized, user);
  const resolvedVoucher = initialValidation.voucher;
  await ensureSupabaseProfile(user.id);

  const existingRedemption = await getSupabaseAdmin()
    .from("voucher_redemptions")
    .select("*")
    .eq("voucher_id", resolvedVoucher.id)
    .eq("user_id", user.id)
    .in("status", ["redeemed", "pending_checkout"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingRedemption.error) throw existingRedemption.error;

  if (resolvedVoucher.kind !== "discount" && existingRedemption.data?.status === "redeemed") {
    await grantVoucherEntitlements({
      voucher: resolvedVoucher,
      redemptionId: existingRedemption.data.id,
      userId: user.id,
    });
    return {
      ok: true as const,
      voucher: resolvedVoucher,
      redemption: existingRedemption.data as VoucherRedemptionRow,
      alreadyRedeemed: true,
    };
  }

  if (!validation.ok) return validation;

  const voucher = validation.voucher;

  const { data: redemption, error } = await getSupabaseAdmin()
    .from("voucher_redemptions")
    .insert({
      voucher_id: voucher.id,
      user_id: user.id,
      email: user.email?.toLowerCase() ?? null,
      product_key: voucher.product_key,
      status: "redeemed",
      metadata: {
        action: voucher.kind === "discount" ? "activate_discount" : "redeem_access",
      },
    })
    .select("*")
    .single();

  if (error) throw error;

  if (voucher.kind !== "discount") {
    await grantVoucherEntitlements({
      voucher,
      redemptionId: redemption.id,
      userId: user.id,
    });
    await incrementVoucherUsage(voucher.id);
  }

  return { ok: true as const, voucher, redemption: redemption as VoucherRedemptionRow };
}

export async function activateDiscountVoucher(code: string) {
  const validation = await validateVoucher(code);
  if (!validation.ok) return validation;

  if (validation.voucher.kind === "invite") {
    return {
      ok: false as const,
      code: "REQUIRES_LOGIN",
      message: "This invitation must be redeemed by the account owner",
    };
  }

  return { ok: true as const, voucher: validation.voucher };
}

export async function readVoucherCodeFromRequest(preferred?: string | null) {
  const bodyCode = normalizeVoucherCode(preferred);
  if (bodyCode) return bodyCode;
  const cookieStore = await cookies();
  return normalizeVoucherCode(cookieStore.get(ACTIVE_VOUCHER_COOKIE)?.value ?? "");
}

export async function applyDiscountVoucherToCheckout(params: {
  code: string;
  user: User;
  productKey: string;
}) {
  const validation = await validateVoucher(params.code, params.user);
  if (!validation.ok) return validation;
  const voucher = validation.voucher;

  if (voucher.kind === "invite") {
    return {
      ok: false as const,
      code: "INVALID_KIND",
      message: "This code unlocks access directly instead of discounting checkout",
    };
  }
  if (!voucher.discount_percent) {
    return {
      ok: false as const,
      code: "NO_DISCOUNT",
      message: "This voucher has no discount configured",
    };
  }

  const eligible = normalizeList(voucher.eligible_product_keys);
  if (eligible.length && !eligible.includes(params.productKey)) {
    return {
      ok: false as const,
      code: "NOT_ELIGIBLE",
      message: "This voucher does not apply to this experience",
    };
  }

  return { ok: true as const, voucher };
}

export async function recordPendingVoucherCheckout(params: {
  voucher: VoucherRow;
  user: User;
  checkoutSessionId: string;
  productKey: string;
  originalAmountCents: number;
  discountedAmountCents: number;
}) {
  await ensureSupabaseProfile(params.user.id);
  await getSupabaseAdmin().from("voucher_redemptions").upsert(
    {
      voucher_id: params.voucher.id,
      user_id: params.user.id,
      email: params.user.email?.toLowerCase() ?? null,
      product_key: params.productKey,
      checkout_session_id: params.checkoutSessionId,
      status: "pending_checkout",
      metadata: {
        original_amount_cents: params.originalAmountCents,
        discounted_amount_cents: params.discountedAmountCents,
        discount_percent: params.voucher.discount_percent,
      },
    },
    { onConflict: "checkout_session_id" }
  );
}

export async function finalizeVoucherCheckoutSession(params: {
  voucherId: string;
  checkoutSessionId: string;
  userId: string;
  email?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { data: redemption } = await supabase
    .from("voucher_redemptions")
    .select("id,status")
    .eq("voucher_id", params.voucherId)
    .eq("checkout_session_id", params.checkoutSessionId)
    .maybeSingle();

  if (redemption?.status === "redeemed") {
    return;
  }

  if (redemption?.id) {
    await supabase
      .from("voucher_redemptions")
      .update({
        status: "redeemed",
        user_id: params.userId,
        email: params.email?.toLowerCase() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemption.id);
  } else {
    await supabase.from("voucher_redemptions").insert({
      voucher_id: params.voucherId,
      user_id: params.userId,
      email: params.email?.toLowerCase() ?? null,
      checkout_session_id: params.checkoutSessionId,
      status: "redeemed",
    });
  }

  await incrementVoucherUsage(params.voucherId);
}

export async function transferVoucher(params: {
  actor: User;
  voucherId: string;
  targetEmail?: string | null;
  targetUserId?: string | null;
  transferGrantedAccess?: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { data: voucher, error } = await supabase
    .from("voucher_codes")
    .select("*")
    .eq("id", params.voucherId)
    .single();

  if (error || !voucher) throw error ?? new Error("Voucher not found");

  let nextUserId = cleanText(params.targetUserId, 120);
  const nextEmail = cleanText(params.targetEmail, 320)?.toLowerCase() ?? null;

  if (!nextUserId && nextEmail) {
    nextUserId = (await resolveProfileByEmail(nextEmail))?.id ?? null;
  }

  const updated = await updateVoucher(params.actor, params.voucherId, {
    targetEmail: nextEmail,
    targetUserId: nextUserId,
  });

  if (!params.transferGrantedAccess || !nextUserId) {
    return updated;
  }

  const { data: redemptions } = await supabase
    .from("voucher_redemptions")
    .select("*")
    .eq("voucher_id", params.voucherId)
    .in("status", ["redeemed", "pending_checkout"]);

  const relevantRedemptions = (redemptions ?? []) as VoucherRedemptionRow[];
  const oldUserIds = Array.from(
    new Set(relevantRedemptions.map((item) => item.user_id).filter(Boolean))
  ) as string[];

  for (const oldUserId of oldUserIds) {
    const { data: entitlements } = await supabase
      .from("user_entitlements")
      .select("id,metadata")
      .eq("user_id", oldUserId)
      .eq("source", "admin");

    const voucherEntitlements = (entitlements ?? []).filter((item) => {
      const metadata =
        item.metadata && typeof item.metadata === "object"
          ? (item.metadata as Record<string, unknown>)
          : {};
      return metadata.voucher_id === params.voucherId;
    });

    for (const entitlement of voucherEntitlements) {
      await supabase
        .from("user_entitlements")
        .update({
          user_id: nextUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entitlement.id);
    }
  }

  if (relevantRedemptions.length) {
    await supabase
      .from("voucher_redemptions")
      .update({
        user_id: nextUserId,
        email: nextEmail,
        status: "transferred",
        updated_at: new Date().toISOString(),
      })
      .eq("voucher_id", params.voucherId);
  }

  return updated;
}
