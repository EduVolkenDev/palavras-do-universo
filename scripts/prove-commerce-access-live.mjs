import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadDotenv(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // Optional in CI; explicit process env values are enough.
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createProofId(label) {
  return `pdu-live-proof-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

async function expectNoError(result, message) {
  if (result.error) throw new Error(`${message}: ${result.error.message}`);
  return result.data;
}

loadDotenv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Live commerce proof skipped: configure SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(2);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const actorId = createProofId("admin");
const userId = createProofId("user");
const actorEmail = `${actorId}@example.invalid`;
const userEmail = `${userId}@example.invalid`;
const voucherCode = `PDU-PROOF-${Date.now().toString(36).toUpperCase()}`;
let voucherId = null;
let entitlementId = null;
let circleEntitlementId = null;

try {
  const products = await expectNoError(
    await supabase
      .from("oracle_products")
      .select("product_key,status")
      .in("product_key", ["caminho_3_cartas", "circulo_do_universo"]),
    "Could not read products"
  );
  const productKeys = new Set((products ?? []).map((item) => item.product_key));
  assert(productKeys.has("caminho_3_cartas"), "Missing caminho_3_cartas product");
  assert(productKeys.has("circulo_do_universo"), "Missing circulo_do_universo product");

  await expectNoError(
    await supabase.from("profiles").upsert(
      [
        { id: actorId, email: actorEmail },
        { id: userId, email: userEmail },
      ],
      { onConflict: "id" }
    ),
    "Could not create proof profiles"
  );

  const voucher = await expectNoError(
    await supabase
      .from("voucher_codes")
      .insert({
        code: voucherCode,
        label: "PDU live commerce proof",
        description: "Temporary automated entitlement proof. Safe to delete.",
        kind: "invite",
        status: "active",
        target_email: userEmail,
        target_user_id: userId,
        transferable: false,
        max_uses: 1,
        product_key: "caminho_3_cartas",
        grant_product_keys: ["caminho_3_cartas"],
        grant_usage_limit: 1,
        grant_expires_days: null,
        discount_percent: null,
        metadata: { proof: "commerce-access-live" },
        created_by: actorId,
        last_updated_by: actorId,
      })
      .select("id,code,times_used,max_uses")
      .single(),
    "Could not create proof voucher"
  );
  voucherId = voucher.id;

  const redemption = await expectNoError(
    await supabase
      .from("voucher_redemptions")
      .insert({
        voucher_id: voucherId,
        user_id: userId,
        email: userEmail,
        product_key: "caminho_3_cartas",
        status: "redeemed",
        metadata: { proof: "commerce-access-live" },
      })
      .select("id")
      .single(),
    "Could not create proof redemption"
  );

  const incremented = await expectNoError(
    await supabase.rpc("increment_voucher_usage", { p_voucher_id: voucherId }),
    "Could not increment voucher usage"
  );
  assert(incremented === true, "Voucher usage RPC did not accept first use");

  const entitlement = await expectNoError(
    await supabase
      .from("user_entitlements")
      .insert({
        user_id: userId,
        product_key: "caminho_3_cartas",
        source: "admin",
        status: "active",
        starts_at: new Date().toISOString(),
        expires_at: null,
        usage_limit: 1,
        usage_count: 0,
        consumed_at: null,
        metadata: {
          voucher_id: voucherId,
          voucher_code: voucherCode,
          voucher_redemption_id: redemption.id,
          proof: "commerce-access-live",
        },
      })
      .select("id,usage_limit,usage_count")
      .single(),
    "Could not create proof entitlement"
  );
  entitlementId = entitlement.id;

  const availableBefore = await expectNoError(
    await supabase
      .from("available_entitlements")
      .select("id,product_key,source,usage_limit,usage_count")
      .eq("user_id", userId)
      .eq("product_key", "caminho_3_cartas"),
    "Could not read available entitlement before consume"
  );
  assert(availableBefore?.length === 1, "Proof entitlement was not available before consume");
  assert(availableBefore[0].usage_limit === 1, "Proof entitlement usage limit mismatch");
  assert(availableBefore[0].usage_count === 0, "Proof entitlement initial usage mismatch");

  const consumed = await expectNoError(
    await supabase.rpc("consume_user_entitlement", {
      p_entitlement_id: entitlementId,
      p_user_id: userId,
    }),
    "Could not consume proof entitlement"
  );
  assert(consumed === true, "Entitlement consume RPC did not consume first use");

  const availableAfter = await expectNoError(
    await supabase
      .from("available_entitlements")
      .select("id")
      .eq("user_id", userId)
      .eq("product_key", "caminho_3_cartas"),
    "Could not read available entitlement after consume"
  );
  assert(availableAfter?.length === 0, "Consumed entitlement is still available");

  const consumedAgain = await expectNoError(
    await supabase.rpc("consume_user_entitlement", {
      p_entitlement_id: entitlementId,
      p_user_id: userId,
    }),
    "Could not verify second consume rejection"
  );
  assert(consumedAgain === false, "Exhausted entitlement consumed twice");

  const circleEntitlement = await expectNoError(
    await supabase
      .from("user_entitlements")
      .insert({
        user_id: userId,
        product_key: "circulo_do_universo",
        source: "admin",
        status: "active",
        starts_at: new Date().toISOString(),
        expires_at: null,
        usage_limit: null,
        usage_count: 0,
        consumed_at: null,
        metadata: { proof: "commerce-access-live" },
      })
      .select("id")
      .single(),
    "Could not create proof Circle entitlement"
  );
  circleEntitlementId = circleEntitlement.id;

  const circleAvailable = await expectNoError(
    await supabase
      .from("available_entitlements")
      .select("id,product_key,usage_limit,usage_count")
      .eq("user_id", userId)
      .eq("product_key", "circulo_do_universo"),
    "Could not read proof Circle entitlement"
  );
  assert(circleAvailable?.length === 1, "Circle entitlement was not available");
  assert(circleAvailable[0].usage_limit === null, "Circle entitlement should be unlimited");

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "commerce-access-live",
        voucherCode,
        checked: [
          "product catalog",
          "voucher usage RPC",
          "available_entitlements before consume",
          "consume_user_entitlement first use",
          "available_entitlements after consume",
          "consume_user_entitlement second use rejected",
          "Circle entitlement remains unlimited",
        ],
      },
      null,
      2
    )
  );
} finally {
  const cleanupErrors = [];
  async function cleanup(label, promise) {
    const { error } = await promise;
    if (error) cleanupErrors.push(`${label}: ${error.message}`);
  }

  if (entitlementId || circleEntitlementId) {
    await cleanup(
      "delete proof entitlements",
      supabase
        .from("user_entitlements")
        .delete()
        .in("id", [entitlementId, circleEntitlementId].filter(Boolean))
    );
  }
  if (voucherId) {
    await cleanup(
      "delete proof redemptions",
      supabase.from("voucher_redemptions").delete().eq("voucher_id", voucherId)
    );
    await cleanup(
      "delete proof voucher",
      supabase.from("voucher_codes").delete().eq("id", voucherId)
    );
  }
  await cleanup(
    "delete proof profiles",
    supabase.from("profiles").delete().in("id", [actorId, userId])
  );

  if (cleanupErrors.length) {
    console.error("Proof cleanup warnings:");
    for (const error of cleanupErrors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    const leftoverChecks = await Promise.all([
      supabase.from("profiles").select("id").in("id", [actorId, userId]),
      voucherId
        ? supabase.from("voucher_codes").select("id").eq("id", voucherId)
        : Promise.resolve({ data: [], error: null }),
      voucherId
        ? supabase.from("voucher_redemptions").select("id").eq("voucher_id", voucherId)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("user_entitlements")
        .select("id")
        .in("id", [entitlementId, circleEntitlementId].filter(Boolean)),
    ]);
    const leftoverErrors = leftoverChecks
      .map((result) => result.error?.message)
      .filter(Boolean);
    const leftoverCount = leftoverChecks.reduce(
      (total, result) => total + (result.data?.length ?? 0),
      0
    );

    if (leftoverErrors.length || leftoverCount > 0) {
      console.error("Proof cleanup verification failed:");
      for (const error of leftoverErrors) console.error(`- ${error}`);
      if (leftoverCount > 0) console.error(`- ${leftoverCount} temporary rows remain`);
      process.exitCode = 1;
    } else {
      console.log("Live commerce proof cleanup: completed with 0 temporary rows remaining.");
    }
  }
}
