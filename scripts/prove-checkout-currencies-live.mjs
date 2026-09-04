import { readFileSync } from "node:fs";
import Stripe from "stripe";
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

function cleanBaseUrl(value) {
  return String(value ?? "http://localhost:3000").replace(/\/$/, "");
}

function createRunId() {
  return `currency-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function stage(name) {
  console.log(JSON.stringify({ stage: name, at: new Date().toISOString() }));
}

loadDotenv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;
const baseUrl = cleanBaseUrl(process.env.PDU_QA_URL);
const origin = new URL(baseUrl).origin;
const INTERNAL_TEST_PRODUCT_KEY = "teste_checkout_50";
const productKey = process.env.PDU_CURRENCY_PROOF_PRODUCT_KEY || INTERNAL_TEST_PRODUCT_KEY;
const requestTimeoutMs = Number(process.env.PDU_PROOF_TIMEOUT_MS || 45_000);
const stripeTimeoutMs = Number(process.env.PDU_STRIPE_TIMEOUT_MS || 45_000);

if (!supabaseUrl || !serviceRoleKey || !anonKey || !stripeKey) {
  console.error(
    "Currency proof skipped: configure Supabase URL, service role key, anon key, and STRIPE_SECRET_KEY."
  );
  process.exit(2);
}

if (
  productKey === INTERNAL_TEST_PRODUCT_KEY &&
  (process.env.PDU_ENABLE_INTERNAL_TEST_CHECKOUT !== "true" ||
    !/^(?:sk|rk)_test_/.test(stripeKey))
) {
  console.error(
    "Currency proof skipped: the internal checkout product requires PDU_ENABLE_INTERNAL_TEST_CHECKOUT=true and a sk_test_/rk_test_ Stripe key."
  );
  process.exit(2);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-05-27.dahlia",
  timeout: stripeTimeoutMs,
  maxNetworkRetries: 0,
});

const runId = createRunId();
const email = `pdu-${runId}@example.invalid`;
const cleanup = { authUserId: null, userId: null, sessionIds: [] };

async function fetchWithTimeout(url, init = {}, label = "request") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    throw new Error(
      `${label} failed or timed out after ${requestTimeoutMs}ms: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function apiJson(jar, method, path, body, clientIp) {
  const response = await fetchWithTimeout(
    `${baseUrl}${path}`,
    {
      method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: cookieHeader(jar),
        origin,
        "x-real-ip": clientIp,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    `${method} ${path}`
  );
  mergeSetCookies(jar, response);
  return { status: response.status, json: await readJsonResponse(response) };
}

async function createUser() {
  const password = `PduCurrency!${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { proof: `pdu-${runId}` },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Could not create currency proof user");
  }

  cleanup.authUserId = created.data.user.id;
  cleanup.userId = created.data.user.id;
  const profile = await admin.from("profiles").upsert(
    { id: created.data.user.id, email },
    { onConflict: "id" }
  );
  if (profile.error) throw profile.error;

  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw signedIn.error ?? new Error("Could not sign in currency proof user");
  }

  const jar = [];
  const serverClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => jar,
      setAll: (items) => {
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
  return jar;
}

async function cleanupProof() {
  const warnings = [];
  for (const sessionId of cleanup.sessionIds) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === "open") await stripe.checkout.sessions.expire(sessionId);
    } catch (error) {
      warnings.push(`expire Checkout Session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (cleanup.userId) {
    for (const table of [
      "readings",
      "usage_daily",
      "user_entitlements",
      "purchases",
      "subscriptions",
      "saved_messages",
      "profiles",
    ]) {
      const column = table === "profiles" ? "id" : "user_id";
      const { error } = await admin.from(table).delete().eq(column, cleanup.userId);
      if (error && table !== "saved_messages") warnings.push(`delete ${table}: ${error.message}`);
    }
  }
  if (cleanup.authUserId) {
    const { error } = await admin.auth.admin.deleteUser(cleanup.authUserId);
    if (error) warnings.push(`delete auth user: ${error.message}`);
  }
  return warnings;
}

let result = null;
let failure = null;

try {
  stage("health:supabase");
  const health = await fetchWithTimeout(`${baseUrl}/api/health/supabase`, {}, "GET /api/health/supabase");
  assert(health.ok, `Local app is not reachable at ${baseUrl}`);
  const healthJson = await readJsonResponse(health);
  assert(healthJson?.ok === true, "Local Supabase health is not OK");

  const product = await admin
    .from("oracle_products")
    .select("product_key,status,product_type,price_cents")
    .eq("product_key", productKey)
    .single();
  assert(!product.error && product.data, "Could not read currency proof product");
  assert(product.data.status === "active", "Currency proof product is not active");
  assert(product.data.product_type === "one_time", "Currency proof expects a one-time product");

  stage("auth:create-user");
  const jar = await createUser();
  const expected =
    productKey === INTERNAL_TEST_PRODUCT_KEY
      ? { BRL: 50, GBP: 50 }
      : { BRL: 1290, GBP: 600 };
  const sessions = [];

  for (const currency of ["BRL", "GBP"]) {
    stage(`checkout:${currency}`);
    const checkout = await apiJson(
      jar,
      "POST",
      "/api/checkout/create",
      {
        productKey,
        locale: currency === "GBP" ? "en" : "pt-BR",
        currency,
        email,
      },
      currency === "GBP" ? "198.51.100.11" : "198.51.100.10"
    );
    assert(
      checkout.status === 200 && checkout.json?.ok === true,
      `${currency} checkout failed: HTTP ${checkout.status} ${JSON.stringify(checkout.json).slice(0, 400)}`
    );
    assert(
      checkout.json.currency === currency && checkout.json.amountCents === expected[currency],
      `${currency} checkout response has the wrong price contract: ${JSON.stringify({
        currency: checkout.json?.currency ?? null,
        amountCents: checkout.json?.amountCents ?? null,
      })}`
    );
    assert(
      typeof checkout.json.checkoutUrl === "string" &&
        checkout.json.checkoutUrl.startsWith("https://checkout.stripe.com"),
      `${currency} checkout did not return a Stripe Checkout URL`
    );

    cleanup.sessionIds.push(checkout.json.sessionId);
    stage(`stripe:retrieve:${currency}`);
    const session = await stripe.checkout.sessions.retrieve(checkout.json.sessionId, {
      expand: ["line_items"],
    });
    assert(session.currency === currency.toLowerCase(), `${currency} Stripe session has the wrong currency`);
    assert(session.amount_total === expected[currency], `${currency} Stripe session has the wrong amount`);
    assert(session.metadata?.currency === currency, `${currency} session metadata is misaligned`);
    assert(
      session.metadata?.market === (currency === "GBP" ? "uk" : "br"),
      `${currency} session market metadata is misaligned`
    );
    assert(session.payment_status === "unpaid", `${currency} proof unexpectedly charged a payment`);
    const paymentMethods = session.payment_method_types ?? [];
    assert(
      paymentMethods.includes("card") && !paymentMethods.includes("pix"),
      `${currency} session payment methods are not aligned: ${JSON.stringify(paymentMethods)}`
    );
    sessions.push({
      currency,
      amountCents: session.amount_total,
      paymentMethods: session.payment_method_types ?? [],
      lineItemCurrency: session.line_items?.data?.[0]?.currency ?? null,
    });
  }

  assert(
    sessions.every((session) => session.lineItemCurrency === session.currency.toLowerCase()),
    "Stripe line item currency does not match the checkout currency"
  );
  result = {
    ok: true,
    proof: "checkout-currencies-and-payment-methods",
    baseUrl,
    productKey,
    checked: [
      "BRL checkout response and Stripe session amount",
      "GBP checkout response and Stripe session amount",
      "Stripe line item currency matches selected market",
      "checkout metadata preserves currency and market",
      "dynamic payment method configuration is observable per session",
      "dynamic Stripe methods currently expose card and no Pix",
      "controlled sessions remain unpaid",
    ],
    sessions,
  };
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
}

const warnings = await cleanupProof();
const output = failure
  ? { ok: false, proof: "checkout-currencies-and-payment-methods", error: failure, cleanupWarnings: warnings }
  : { ...result, cleanup: { temporarySessionsExpired: cleanup.sessionIds.length, warnings } };
console.log(JSON.stringify(output, null, 2));
if (failure || warnings.length) process.exit(1);
