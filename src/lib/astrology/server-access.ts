import type { User } from "@supabase/supabase-js";
import { CIRCLE_PRODUCT_KEY } from "@/lib/product/access";
import { ASTROLOGY_FULL_PRODUCT_KEY } from "./natal-chart";
import { getAvailableEntitlementForProduct } from "@/lib/product/entitlements";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";

export async function hasFullAstrologyAccess(user: User) {
  return isOwnerAccessUser(user) || Boolean(await getAvailableEntitlementForProduct({
    userId: user.id,
    productKey: ASTROLOGY_FULL_PRODUCT_KEY,
  }));
}

export async function hasCircleAstrologyAccess(user: User) {
  return isOwnerAccessUser(user) || Boolean(await getAvailableEntitlementForProduct({
    userId: user.id,
    productKey: CIRCLE_PRODUCT_KEY,
  }));
}
