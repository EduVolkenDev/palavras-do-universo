import type { User } from "@supabase/supabase-js";
import { productCards, pricingPlans } from "@/lib/product/catalog";
import { PAID_READING_PRODUCTS } from "@/lib/product/access";

type OwnerEntitlement = {
  id: string;
  user_id: string;
  product_key: string;
  title: string;
  product_type: string;
  access_model: string;
  source: "admin";
  status: "active";
  starts_at: string;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  consumed_at: string | null;
  metadata: Record<string, unknown>;
};

function parseList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isOwnerAccessUser(user: User | null | undefined) {
  if (!user) return false;

  const ownerEmails = parseList(process.env.OWNER_ACCESS_EMAILS);
  const ownerIds = parseList(process.env.OWNER_ACCESS_USER_IDS);
  const email = user.email?.trim().toLowerCase() ?? "";
  const id = user.id.trim().toLowerCase();

  return (email && ownerEmails.has(email)) || ownerIds.has(id);
}

export function getOwnerEntitlements(user: User): OwnerEntitlement[] {
  if (!isOwnerAccessUser(user)) return [];

  const ownerProductKeys = [
    "circulo_do_universo",
    ...Array.from(PAID_READING_PRODUCTS),
  ];
  const startsAt = "2026-01-01T00:00:00.000Z";

  return [...new Set(ownerProductKeys)].map((productKey) => {
    const product = productCards.find((item) => item.productKey === productKey);
    const plan = pricingPlans.find((item) => item.productKey === productKey);
    const isCircle = productKey === "circulo_do_universo";

    return {
      id: `owner-${productKey}`,
      user_id: user.id,
      product_key: productKey,
      title: product?.title ?? plan?.title ?? productKey,
      product_type: isCircle ? "subscription" : "one_time",
      access_model: isCircle ? "subscription" : "subscription_included",
      source: "admin",
      status: "active",
      starts_at: startsAt,
      expires_at: null,
      usage_limit: null,
      usage_count: 0,
      consumed_at: null,
      metadata: {
        owner_access: true,
      },
    };
  });
}

export function getOwnerEntitlementForProduct(user: User | null | undefined, productKey: string) {
  if (!user || !PAID_READING_PRODUCTS.has(productKey)) return null;
  return getOwnerEntitlements(user).find((item) => item.product_key === productKey) ?? null;
}
