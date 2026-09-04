import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
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
    // CI can provide explicit environment variables instead.
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectNoError(result, message) {
  if (result.error) {
    throw new Error(`${message}: ${result.error.message ?? JSON.stringify(result.error)}`);
  }
  return result.data;
}

function createRunId() {
  return `phase2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanBaseUrl(value) {
  return String(value ?? "http://localhost:3000").replace(/\/$/, "");
}

function cookieHeader(jar) {
  return jar
    .filter((cookie) => cookie.value)
    .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
    .join("; ");
}

function mergeSetCookies(jar, response) {
  const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
  const values = getSetCookie ? getSetCookie() : [];
  for (const header of values) {
    const [pair] = header.split(";");
    const index = pair.indexOf("=");
    if (index < 0) continue;
    const name = pair.slice(0, index).trim();
    const value = decodeURIComponent(pair.slice(index + 1).trim());
    const existing = jar.findIndex((cookie) => cookie.name === name);
    if (existing >= 0) jar[existing] = { name, value };
    else jar.push({ name, value });
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { nonJson: text.slice(0, 500) };
  }
}

loadDotenv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = cleanBaseUrl(process.env.PDU_QA_URL);
const origin = new URL(baseUrl).origin;
const requestTimeoutMs = Math.max(
  5_000,
  Number.parseInt(process.env.PDU_PROOF_TIMEOUT_MS ?? "30000", 10) || 30_000
);

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error(
    "Phase 2 proof skipped: configure Supabase URL, service role key, and anon key."
  );
  process.exit(2);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const publicClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const runId = createRunId();
const proofTag = `pdu-${runId}`;
const voucherProductKey = "caminho_3_cartas";
const circleProductKey = "circulo_do_universo";
const circleIncludedProductKey = "sinais_do_amor";
const cleanup = {
  authUserIds: [],
  profileIds: [],
  voucherIds: [],
};

function stage(name) {
  console.log(JSON.stringify({ stage: name, at: new Date().toISOString() }));
}

async function fetchWithTimeout(url, options = {}, label = "request") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    throw new Error(`${label} failed or timed out after ${requestTimeoutMs}ms: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function createNormalUser(label) {
  const email = `pdu-${runId}-${label}@example.invalid`;
  const password = `PduPhase2!${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { proof: proofTag, label },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error(`Could not create ${label} user`);
  }

  const userId = created.data.user.id;
  cleanup.authUserIds.push(userId);
  cleanup.profileIds.push(userId);

  await expectNoError(
    await admin.from("profiles").upsert({ id: userId, email }, { onConflict: "id" }),
    `Could not create ${label} profile`
  );

  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw signedIn.error ?? new Error(`Could not sign in ${label} user`);
  }

  const jar = [];
  const serverClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return jar;
      },
      setAll(items) {
        for (const item of items) {
          const index = jar.findIndex((cookie) => cookie.name === item.name);
          const next = { name: item.name, value: item.value };
          if (index >= 0) jar[index] = next;
          else jar.push(next);
        }
      },
    },
  });
  const session = await serverClient.auth.setSession({
    access_token: signedIn.data.session.access_token,
    refresh_token: signedIn.data.session.refresh_token,
  });
  if (session.error) throw session.error;

  const proofIp =
    label === "voucher"
      ? "198.51.100.21"
      : label === "circle"
        ? "198.51.100.22"
        : "198.51.100.23";
  return { email, userId, jar, proofIp };
}

async function apiJson(user, method, path, body) {
  const response = await fetchWithTimeout(
    `${baseUrl}${path}`,
    {
      method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: cookieHeader(user.jar),
        origin,
        "x-real-ip": user.proofIp,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    `${method} ${path}`
  );
  mergeSetCookies(user.jar, response);
  const json = await readJsonResponse(response);
  return { status: response.status, json };
}

async function createVoucherFor(user) {
  const code = `PDU-PHASE2-${Date.now().toString(36).toUpperCase()}`;
  const voucher = await expectNoError(
    await admin
      .from("voucher_codes")
      .insert({
        code,
        label: "PDU Phase 2 controlled proof",
        description: "Temporary voucher proof for Meu Universo and entitlement consumption.",
        kind: "invite",
        status: "active",
        target_email: user.email,
        target_user_id: user.userId,
        transferable: false,
        max_uses: 1,
        product_key: voucherProductKey,
        grant_product_keys: [voucherProductKey],
        grant_usage_limit: 1,
        grant_expires_days: null,
        discount_percent: null,
        metadata: { proof: proofTag, run_id: runId },
      })
      .select("id,code,times_used,max_uses")
      .single(),
    "Could not create phase 2 voucher"
  );
  cleanup.voucherIds.push(voucher.id);
  return voucher;
}

async function readEntitlements(userId) {
  return expectNoError(
    await admin
      .from("user_entitlements")
      .select("id, product_key, source, status, usage_limit, usage_count, consumed_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    "Could not read user entitlements"
  );
}

async function readAvailableEntitlements(userId) {
  return expectNoError(
    await admin
      .from("available_entitlements")
      .select("id, product_key, source, usage_limit, usage_count")
      .eq("user_id", userId)
      .order("starts_at", { ascending: false }),
    "Could not read available entitlements"
  );
}

async function readPersistedReading(readingId) {
  return expectNoError(
    await admin
      .from("readings")
      .select("id, user_id, email, intent_key")
      .eq("id", readingId)
      .single(),
    "Could not read persisted reading"
  );
}

async function createCircleEntitlement(user) {
  const entitlement = await expectNoError(
    await admin
      .from("user_entitlements")
      .insert({
        user_id: user.userId,
        product_key: circleProductKey,
        source: "admin",
        status: "active",
        starts_at: new Date().toISOString(),
        expires_at: null,
        usage_limit: null,
        usage_count: 0,
        consumed_at: null,
        metadata: { proof: proofTag, run_id: runId, label: "circle" },
      })
      .select("id, usage_limit, usage_count")
      .single(),
    "Could not create Circle entitlement"
  );
  return entitlement;
}

async function cleanupProof() {
  const warnings = [];
  async function safe(label, promise) {
    const { error } = await promise;
    if (error) warnings.push(`${label}: ${error.message}`);
  }

  if (cleanup.profileIds.length) {
    await safe(
      "delete temp saved messages",
      admin.from("saved_messages").delete().in("user_id", cleanup.profileIds)
    );
    await safe(
      "delete temp readings",
      admin.from("readings").delete().in("user_id", cleanup.profileIds)
    );
    await safe(
      "delete temp daily usage",
      admin.from("usage_daily").delete().in("user_id", cleanup.profileIds)
    );
    await safe(
      "delete temp entitlements",
      admin.from("user_entitlements").delete().in("user_id", cleanup.profileIds)
    );
    await safe(
      "delete temp purchases",
      admin.from("purchases").delete().in("user_id", cleanup.profileIds)
    );
    await safe(
      "delete temp subscriptions",
      admin.from("subscriptions").delete().in("user_id", cleanup.profileIds)
    );
  }

  if (cleanup.voucherIds.length) {
    await safe(
      "delete temp voucher redemptions",
      admin.from("voucher_redemptions").delete().in("voucher_id", cleanup.voucherIds)
    );
    await safe(
      "delete temp vouchers",
      admin.from("voucher_codes").delete().in("id", cleanup.voucherIds)
    );
  }

  if (cleanup.profileIds.length) {
    await safe("delete temp profiles", admin.from("profiles").delete().in("id", cleanup.profileIds));
  }

  for (const userId of cleanup.authUserIds) {
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error) warnings.push(`delete auth user ${userId}: ${deleted.error.message}`);
  }

  if (warnings.length) {
    console.warn("Phase 2 proof cleanup warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  const [profiles, vouchers, redemptions, entitlements, readings] = await Promise.all([
    cleanup.profileIds.length
      ? admin.from("profiles").select("id").in("id", cleanup.profileIds)
      : { data: [], error: null },
    cleanup.voucherIds.length
      ? admin.from("voucher_codes").select("id").in("id", cleanup.voucherIds)
      : { data: [], error: null },
    cleanup.voucherIds.length
      ? admin.from("voucher_redemptions").select("id").in("voucher_id", cleanup.voucherIds)
      : { data: [], error: null },
    cleanup.profileIds.length
      ? admin.from("user_entitlements").select("id").in("user_id", cleanup.profileIds)
      : { data: [], error: null },
    cleanup.profileIds.length
      ? admin.from("readings").select("id").in("user_id", cleanup.profileIds)
      : { data: [], error: null },
  ]);

  const remaining =
    (profiles.data?.length ?? 0) +
    (vouchers.data?.length ?? 0) +
    (redemptions.data?.length ?? 0) +
    (entitlements.data?.length ?? 0) +
    (readings.data?.length ?? 0);
  return { warnings, remaining };
}

try {
  stage("health:supabase");
  const health = await fetchWithTimeout(
    `${baseUrl}/api/health/supabase`,
    {},
    "GET /api/health/supabase"
  );
  assert(health.ok, `Local app is not reachable at ${baseUrl}`);
  const healthJson = await readJsonResponse(health);
  assert(healthJson?.ok === true, "Local Supabase health is not OK");

  stage("catalog");
  const products = await expectNoError(
    await admin
      .from("oracle_products")
      .select("product_key,status,access_model")
      .in("product_key", [voucherProductKey, circleProductKey, circleIncludedProductKey]),
    "Could not read product catalog"
  );
  const productMap = new Map(products.map((product) => [product.product_key, product]));
  assert(productMap.get(voucherProductKey)?.status === "active", "Voucher product is not active");
  assert(productMap.get(circleProductKey)?.status === "active", "Circle product is not active");
  assert(
    productMap.get(circleIncludedProductKey)?.status === "active",
    "Circle included product is not active"
  );

  stage("auth:create-users");
  const voucherUser = await createNormalUser("voucher");
  const circleUser = await createNormalUser("circle");
  const noAccessUser = await createNormalUser("noaccess");

  stage("voucher:create");
  const voucher = await createVoucherFor(voucherUser);
  assert(voucher.times_used === 0 && voucher.max_uses === 1, "Voucher was not created with one use");

  stage("voucher:redeem");
  const redeem = await apiJson(voucherUser, "POST", "/api/vouchers/redeem", {
    code: voucher.code,
  });
  assert(redeem.status === 200 && redeem.json?.ok === true, "Voucher redeem route did not succeed");
  assert(
    redeem.json?.voucher?.kind === "invite",
    "Voucher redeem response did not identify invite access"
  );

  stage("entitlements:after-redeem");
  const availableAfterRedeem = await readAvailableEntitlements(voucherUser.userId);
  const voucherAccess = availableAfterRedeem.find(
    (entitlement) => entitlement.product_key === voucherProductKey
  );
  assert(voucherAccess, "Voucher entitlement is not available after redeem");
  assert(voucherAccess.usage_limit === 1, "Voucher entitlement usage_limit is not 1");
  assert(voucherAccess.usage_count === 0, "Voucher entitlement usage_count is not 0 before reading");

  stage("api:entitlements");
  const entitlementsApi = await apiJson(voucherUser, "GET", "/api/entitlements");
  assert(entitlementsApi.status === 200 && entitlementsApi.json?.ok === true, "Entitlements API failed");
  assert(
    entitlementsApi.json.entitlements?.some(
      (entitlement) =>
        entitlement.product_key === voucherProductKey &&
        entitlement.usage_limit === 1 &&
        entitlement.usage_count === 0
    ),
    "Meu Universo entitlement feed does not show the voucher access"
  );

  stage("page:meu-universo");
  const universePage = await fetchWithTimeout(
    `${baseUrl}/meu-universo`,
    {
      headers: { cookie: cookieHeader(voucherUser.jar) },
    },
    "GET /meu-universo"
  );
  assert(universePage.ok, "Meu Universo page did not render for voucher user");

  stage("reading:voucher");
  const reading = await apiJson(voucherUser, "POST", "/api/reading/create", {
    locale: "pt-BR",
    productKey: voucherProductKey,
    question:
      "O que eu preciso enxergar agora para tomar uma decisão pequena e possível com mais clareza?",
    theme: "spirit",
  });
  assert(reading.status === 200 && reading.json?.ok === true, "Voucher reading did not open");
  assert(reading.json?.readingId, "Voucher reading was not persisted");
  const persistedVoucherReading = await readPersistedReading(reading.json.readingId);
  assert(
    persistedVoucherReading.user_id === voucherUser.userId,
    "Voucher reading was not linked to the authenticated user"
  );
  assert(
    persistedVoucherReading.email === voucherUser.email,
    "Voucher reading did not persist the authenticated user's email"
  );
  assert(
    persistedVoucherReading.intent_key === voucherProductKey,
    "Voucher reading did not persist the paid product key"
  );

  stage("entitlements:after-reading");
  const availableAfterReading = await readAvailableEntitlements(voucherUser.userId);
  assert(
    !availableAfterReading.some((entitlement) => entitlement.product_key === voucherProductKey),
    "Consumed voucher entitlement is still available"
  );
  const consumedVoucherEntitlement = (await readEntitlements(voucherUser.userId)).find(
    (entitlement) => entitlement.product_key === voucherProductKey
  );
  assert(consumedVoucherEntitlement, "Consumed voucher entitlement row was not found");
  assert(consumedVoucherEntitlement.usage_count === 1, "Voucher entitlement was not consumed");
  assert(consumedVoucherEntitlement.consumed_at, "Voucher entitlement consumed_at was not set");

  stage("reading:voucher-second-paywall");
  const secondReading = await apiJson(voucherUser, "POST", "/api/reading/create", {
    locale: "pt-BR",
    productKey: voucherProductKey,
    question:
      "Que outra leitura eu conseguiria abrir se esse voucher tivesse permanecido indevidamente ativo?",
    theme: "spirit",
  });
  assert(secondReading.status === 402, "Consumed voucher allowed a second paid reading");
  assert(secondReading.json?.paywall === true, "Second voucher reading did not return paywall");

  stage("circle:create-entitlement");
  await createCircleEntitlement(circleUser);
  stage("circle:api-entitlements");
  const circleEntitlements = await apiJson(circleUser, "GET", "/api/entitlements");
  assert(circleEntitlements.status === 200, "Circle entitlements API failed");
  assert(
    circleEntitlements.json?.entitlements?.some(
      (entitlement) => entitlement.product_key === circleProductKey && entitlement.usage_limit === null
    ),
    "Circle entitlement does not appear in the entitlement feed"
  );

  stage("circle:included-checkout");
  const circleCheckout = await apiJson(circleUser, "POST", "/api/checkout/create", {
    productKey: circleIncludedProductKey,
    locale: "pt-BR",
  });
  assert(
    circleCheckout.status === 200 && circleCheckout.json?.alreadyUnlocked === true,
    `Circle user was still sent to checkout for an included product: HTTP ${circleCheckout.status} ${JSON.stringify(
      circleCheckout.json
    ).slice(0, 400)}`
  );
  assert(
    typeof circleCheckout.json?.checkoutUrl === "string" &&
      !circleCheckout.json.checkoutUrl.startsWith("https://checkout.stripe.com"),
    "Circle included product returned a Stripe checkout URL"
  );

  stage("reading:circle");
  const circleReading = await apiJson(circleUser, "POST", "/api/reading/create", {
    locale: "pt-BR",
    productKey: circleIncludedProductKey,
    question:
      "Que sinal merece minha atenção esta semana para eu agir com mais presença e menos pressa?",
    theme: "spirit",
  });
  assert(circleReading.status === 200 && circleReading.json?.ok === true, "Circle reading did not open");
  assert(circleReading.json?.readingId, "Circle reading was not persisted");
  const persistedCircleReading = await readPersistedReading(circleReading.json.readingId);
  assert(
    persistedCircleReading.user_id === circleUser.userId,
    "Circle reading was not linked to the authenticated user"
  );
  assert(
    persistedCircleReading.email === circleUser.email,
    "Circle reading did not persist the authenticated user's email"
  );
  const circleRows = await readEntitlements(circleUser.userId);
  const circleRow = circleRows.find((entitlement) => entitlement.product_key === circleProductKey);
  assert(circleRow?.usage_limit === null, "Circle entitlement should remain unlimited");
  assert(circleRow?.usage_count === 0, "Circle entitlement should not be consumed per reading");

  stage("reading:no-access-paywall");
  const noAccessReading = await apiJson(noAccessUser, "POST", "/api/reading/create", {
    locale: "pt-BR",
    productKey: voucherProductKey,
    question:
      "Sem acesso ativo, eu deveria conseguir abrir esta leitura paga ou ver o bloqueio correto?",
    theme: "spirit",
  });
  assert(noAccessReading.status === 402, "User without access opened a paid reading");
  assert(noAccessReading.json?.paywall === true, "User without access did not receive paywall");

  stage("cleanup");
  const cleanupResult = await cleanupProof();
  assert(cleanupResult.remaining === 0, "Temporary proof rows were not fully cleaned up");

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "phase2-voucher-meu-universo-consumption",
        baseUrl,
        checked: [
          "local Supabase health",
          "active product catalog",
          "one-use voucher creation",
          "voucher redeem route as normal user",
          "Meu Universo entitlement feed before reading",
          "Meu Universo page render",
          "paid reading opens with voucher entitlement",
          "voucher reading row stores authenticated user email",
          "voucher entitlement consumed after reading",
          "second paid reading blocked after voucher consumption",
          "Circle entitlement appears as unlimited",
          "Circle included product bypasses checkout",
          "Circle reading opens without consuming Circle entitlement",
          "Circle reading row stores authenticated user email",
          "user without access receives paywall",
        ],
        cleanup: {
          temporaryRowsRemaining: cleanupResult.remaining,
        },
      },
      null,
      2
    )
  );
} catch (error) {
  const cleanupResult = await cleanupProof();
  console.error(
    JSON.stringify(
      {
        ok: false,
        proof: "phase2-voucher-meu-universo-consumption",
        error: error instanceof Error ? error.message : String(error),
        cleanup: {
          temporaryRowsRemaining: cleanupResult.remaining,
        },
      },
      null,
      2
    )
  );
  process.exit(1);
}
