import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  CIRCLE_PRODUCT_KEY,
  circleUnlocksProduct,
} from "@/lib/product/access";

type AvailableEntitlement = {
  id: string;
  product_key: string;
  source: string;
  usage_limit: number | null;
  usage_count: number;
};

export async function getAvailableEntitlementForProduct(params: {
  userId: string;
  productKey: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data: exactEntitlement, error } = await supabase
    .from("available_entitlements")
    .select("id, product_key, source, usage_limit, usage_count")
    .eq("user_id", params.userId)
    .eq("product_key", params.productKey)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle<AvailableEntitlement>();

  if (error) throw error;
  if (exactEntitlement || params.productKey === CIRCLE_PRODUCT_KEY) {
    return exactEntitlement;
  }
  if (!circleUnlocksProduct(params.productKey)) return null;

  const { data: circleEntitlement, error: circleError } = await supabase
    .from("available_entitlements")
    .select("id, product_key, source, usage_limit, usage_count")
    .eq("user_id", params.userId)
    .eq("product_key", CIRCLE_PRODUCT_KEY)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle<AvailableEntitlement>();

  if (circleError) throw circleError;
  return circleEntitlement;
}

export async function hasAvailableEntitlementForProduct(params: {
  userId: string;
  productKey: string;
}) {
  return Boolean(await getAvailableEntitlementForProduct(params));
}
