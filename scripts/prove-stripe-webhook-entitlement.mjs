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

async function expectNoError(result, message) {
  if (result.error) {
    throw new Error(`${message}: ${result.error.message ?? JSON.stringify(result.error)}`);
  }
  return result.data;
}

function createRunId() {
  return `stripe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

loadDotenv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const baseUrl = cleanBaseUrl(process.env.PDU_QA_URL);
const origin = new URL(baseUrl).origin;
const INTERNAL_TEST_PRODUCT_KEY = "teste_checkout_50";
const productKey = process.env.PDU_STRIPE_PROOF_PRODUCT_KEY || INTERNAL_TEST_PRODUCT_KEY;
const proofCurrency = process.env.PDU_STRIPE_PROOF_CURRENCY === "GBP" ? "GBP" : "BRL";
const proofLocale = proofCurrency === "GBP" ? "en" : "pt-BR";
const stripeTimeoutMs = Number(process.env.PDU_STRIPE_TIMEOUT_MS || 45_000);
const requestTimeoutMs = Number(process.env.PDU_PROOF_TIMEOUT_MS || 45_000);

if (!supabaseUrl || !serviceRoleKey || !anonKey || !stripeKey || !webhookSecret) {
  console.error(
    "Stripe proof skipped: configure Supabase URL, service role key, anon key, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET."
  );
  process.exit(2);
}

if (
  productKey === INTERNAL_TEST_PRODUCT_KEY &&
  (process.env.PDU_ENABLE_INTERNAL_TEST_CHECKOUT !== "true" ||
    !/^(?:sk|rk)_test_/.test(stripeKey))
) {
  console.error(
    "Stripe proof skipped: the internal checkout product requires PDU_ENABLE_INTERNAL_TEST_CHECKOUT=true and a sk_test_/rk_test_ Stripe key."
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
const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-05-27.dahlia",
  timeout: stripeTimeoutMs,
  maxNetworkRetries: 0,
});

const runId = createRunId();
const proofTag = `pdu-${runId}`;
const cleanup = {
  authUserIds: [],
  profileIds: [],
  checkoutSessionIds: [],
  paymentEventIds: [],
};

async function createNormalUser() {
  const email = `pdu-${runId}@example.invalid`;
  const password = `PduStripe!${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { proof: proofTag },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Could not create Stripe proof user");
  }

  const userId = created.data.user.id;
  cleanup.authUserIds.push(userId);
  cleanup.profileIds.push(userId);

  await expectNoError(
    await admin.from("profiles").upsert({ id: userId, email }, { onConflict: "id" }),
    "Could not create Stripe proof profile"
  );

  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw signedIn.error ?? new Error("Could not sign in Stripe proof user");
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

  return { email, userId, jar };
}

async function apiJson(user, method, path, body) {
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: cookieHeader(user.jar),
      origin,
      "x-real-ip": "198.51.100.31",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  mergeSetCookies(user.jar, response);
  const json = await readJsonResponse(response);
  return { status: response.status, json };
}

async function postWebhook(payload, signature) {
  const response = await fetchWithTimeout(`${baseUrl}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });
  return { status: response.status, json: await readJsonResponse(response) };
}

function createSignedCheckoutCompletedEvent(session, user, eventId) {
  const payload = JSON.stringify({
    id: eventId,
    object: "event",
    api_version: "2026-05-27.dahlia",
    created: nowUnix(),
    livemode: Boolean(session.livemode),
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
    data: {
      object: {
        ...session,
        object: "checkout.session",
        id: session.id,
        mode: "payment",
        payment_status: "paid",
        status: "complete",
        customer_email: user.email,
        customer_details: {
          ...(session.customer_details ?? {}),
          email: user.email,
        },
        payment_intent: `pi_pdu_${runId.replace(/[^a-z0-9]/gi, "")}`,
        metadata: {
          ...(session.metadata ?? {}),
          user_id: user.userId,
          product_key: productKey,
          proof: proofTag,
        },
      },
    },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  return { payload, signature };
}

async function readPurchases(userId) {
  return expectNoError(
    await admin
      .from("purchases")
      .select("id, product_key, status, provider_checkout_id, provider_payment_id, delivered_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    "Could not read proof purchases"
  );
}

async function readEntitlements(userId) {
  return expectNoError(
    await admin
      .from("user_entitlements")
      .select("id, product_key, source, status, usage_limit, usage_count, consumed_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    "Could not read proof entitlements"
  );
}

async function readPaymentEvents() {
  if (!cleanup.paymentEventIds.length) return [];
  return expectNoError(
    await admin
      .from("payment_events")
      .select("provider_event_id, event_type, status, user_id, product_key, processed_at")
      .eq("provider", "stripe")
      .in("provider_event_id", cleanup.paymentEventIds),
    "Could not read proof payment events"
  );
}

async function readPersistedReading(readingId) {
  return expectNoError(
    await admin
      .from("readings")
      .select("id, user_id, email, intent_key")
      .eq("id", readingId)
      .single(),
    "Could not read persisted Stripe proof reading"
  );
}

async function cleanupProof() {
  const warnings = [];
  async function safe(label, promise) {
    const { error } = await promise;
    if (error) warnings.push(`${label}: ${error.message}`);
  }

  for (const sessionId of cleanup.checkoutSessionIds) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(sessionId);
      }
    } catch (error) {
      warnings.push(
        `expire Stripe Checkout Session ${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (cleanup.paymentEventIds.length) {
    await safe(
      "delete temp payment events",
      admin
        .from("payment_events")
        .delete()
        .eq("provider", "stripe")
        .in("provider_event_id", cleanup.paymentEventIds)
    );
  }

  if (cleanup.profileIds.length) {
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
    await safe("delete temp profiles", admin.from("profiles").delete().in("id", cleanup.profileIds));
  }

  for (const userId of cleanup.authUserIds) {
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error) warnings.push(`delete auth user ${userId}: ${deleted.error.message}`);
  }

  if (warnings.length) {
    console.warn("Stripe proof cleanup warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  const [profiles, purchases, entitlements, readings, events] = await Promise.all([
    cleanup.profileIds.length
      ? admin.from("profiles").select("id").in("id", cleanup.profileIds)
      : { data: [], error: null },
    cleanup.profileIds.length
      ? admin.from("purchases").select("id").in("user_id", cleanup.profileIds)
      : { data: [], error: null },
    cleanup.profileIds.length
      ? admin.from("user_entitlements").select("id").in("user_id", cleanup.profileIds)
      : { data: [], error: null },
    cleanup.profileIds.length
      ? admin.from("readings").select("id").in("user_id", cleanup.profileIds)
      : { data: [], error: null },
    cleanup.paymentEventIds.length
      ? admin
          .from("payment_events")
          .select("provider_event_id")
          .eq("provider", "stripe")
          .in("provider_event_id", cleanup.paymentEventIds)
      : { data: [], error: null },
  ]);

  const remaining =
    (profiles.data?.length ?? 0) +
    (purchases.data?.length ?? 0) +
    (entitlements.data?.length ?? 0) +
    (readings.data?.length ?? 0) +
    (events.data?.length ?? 0);
  return { warnings, remaining };
}

try {
  const health = await fetchWithTimeout(`${baseUrl}/api/health/supabase`);
  assert(health.ok, `Local app is not reachable at ${baseUrl}`);
  const healthJson = await readJsonResponse(health);
  assert(healthJson?.ok === true, "Local Supabase health is not OK");

  const product = await expectNoError(
    await admin
      .from("oracle_products")
      .select("product_key,status,product_type,price_cents,currency,access_model,provider_price_id")
      .eq("product_key", productKey)
      .single(),
    "Could not read proof product"
  );
  assert(product.status === "active", "Proof product is not active");
  assert(product.product_type === "one_time", "Proof currently expects a one-time product");
  assert((product.price_cents ?? 0) >= 50, "Proof product is below Stripe minimum amount");

  const user = await createNormalUser();
  const checkout = await apiJson(user, "POST", "/api/checkout/create", {
    productKey,
    locale: proofLocale,
    currency: proofCurrency,
    email: user.email,
  });
  assert(
    checkout.status === 200 && checkout.json?.ok === true,
    `Checkout create route failed: HTTP ${checkout.status} ${JSON.stringify(checkout.json).slice(0, 500)}`
  );
  assert(checkout.json?.sessionId, "Checkout route did not return a Stripe session id");
  assert(
    typeof checkout.json.checkoutUrl === "string" &&
      checkout.json.checkoutUrl.startsWith("https://checkout.stripe.com"),
    "Checkout route did not return a Stripe Checkout URL"
  );
  cleanup.checkoutSessionIds.push(checkout.json.sessionId);

  const pendingPurchases = await readPurchases(user.userId);
  const pendingPurchase = pendingPurchases.find(
    (purchase) => purchase.provider_checkout_id === checkout.json.sessionId
  );
  assert(pendingPurchase?.status === "pending", "Checkout did not persist a pending purchase");

  const session = await stripe.checkout.sessions.retrieve(checkout.json.sessionId);
  assert(session.id === checkout.json.sessionId, "Stripe could not retrieve the created session");
  assert(session.payment_status === "unpaid", "Controlled proof should not charge a real payment");

  const eventId = `evt_pdu_${runId.replace(/[^a-z0-9]/gi, "")}`;
  cleanup.paymentEventIds.push(eventId);
  const { payload, signature } = createSignedCheckoutCompletedEvent(session, user, eventId);

  const invalidWebhook = await postWebhook(payload, "t=1,v1=invalid");
  assert(invalidWebhook.status === 400, "Webhook accepted an invalid Stripe signature");

  const webhook = await postWebhook(payload, signature);
  assert(webhook.status === 200 && webhook.json?.ok === true, "Signed webhook did not process");

  const paidPurchases = await readPurchases(user.userId);
  const paidPurchase = paidPurchases.find(
    (purchase) => purchase.provider_checkout_id === checkout.json.sessionId
  );
  assert(paidPurchase?.status === "paid", "Webhook did not mark purchase paid");
  assert(paidPurchase.delivered_at, "Webhook did not set purchase delivered_at");

  const entitlementsAfterWebhook = await readEntitlements(user.userId);
  const purchaseEntitlement = entitlementsAfterWebhook.find(
    (entitlement) => entitlement.product_key === productKey && entitlement.source === "purchase"
  );
  assert(purchaseEntitlement, "Webhook did not grant a purchase entitlement");
  assert(purchaseEntitlement.usage_limit === 1, "Purchase entitlement usage_limit is not 1");
  assert(purchaseEntitlement.usage_count === 0, "Purchase entitlement should start unused");

  const paymentEvents = await readPaymentEvents();
  const paymentEvent = paymentEvents.find((event) => event.provider_event_id === eventId);
  assert(paymentEvent?.status === "processed", "Webhook payment event was not marked processed");

  const duplicateWebhook = await postWebhook(payload, signature);
  assert(
    duplicateWebhook.status === 200 && duplicateWebhook.json?.ok === true,
    "Duplicate webhook did not return an idempotent success"
  );
  const entitlementsAfterDuplicate = await readEntitlements(user.userId);
  const duplicateEntitlement = entitlementsAfterDuplicate.find(
    (entitlement) => entitlement.product_key === productKey && entitlement.source === "purchase"
  );
  assert(
    duplicateEntitlement?.usage_limit === 1,
    "Duplicate webhook changed purchase entitlement usage_limit"
  );

  const reading = await apiJson(user, "POST", "/api/reading/create", {
    locale: "pt-BR",
    productKey,
    question:
      "Depois do pagamento, que direção pequena e concreta eu deveria enxergar para seguir com clareza?",
    theme: "spirit",
  });
  assert(reading.status === 200 && reading.json?.ok === true, "Paid entitlement did not open reading");
  assert(reading.json?.readingId, "Paid reading was not persisted");
  const persistedReading = await readPersistedReading(reading.json.readingId);
  assert(
    persistedReading.user_id === user.userId,
    "Paid reading was not linked to the authenticated user"
  );
  assert(
    persistedReading.email === user.email,
    "Paid reading did not persist the authenticated user's email"
  );
  assert(
    persistedReading.intent_key === productKey,
    "Paid reading did not persist the product key"
  );

  const entitlementsAfterReading = await readEntitlements(user.userId);
  const consumedEntitlement = entitlementsAfterReading.find(
    (entitlement) => entitlement.product_key === productKey && entitlement.source === "purchase"
  );
  assert(consumedEntitlement?.usage_count === 1, "Paid reading did not consume purchase entitlement");
  assert(consumedEntitlement?.consumed_at, "Consumed purchase entitlement has no consumed_at");

  const secondReading = await apiJson(user, "POST", "/api/reading/create", {
    locale: "pt-BR",
    productKey,
    question:
      "Se o acesso pago continuasse ativo indevidamente, esta segunda leitura abriria sem paywall?",
    theme: "spirit",
  });
  assert(secondReading.status === 402, "Consumed paid entitlement allowed a second reading");
  assert(secondReading.json?.paywall === true, "Second paid reading did not return paywall");

  const cleanupResult = await cleanupProof();
  assert(cleanupResult.remaining === 0, "Temporary Stripe proof rows were not fully cleaned up");

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "stripe-checkout-webhook-entitlement",
        baseUrl,
        productKey,
        checked: [
          "local Supabase health",
          "active one-time product catalog",
          "checkout create route creates Stripe Checkout Session",
          "pending purchase persisted",
          "Stripe session retrieved and remains unpaid",
          "invalid webhook signature rejected",
          "signed checkout.session.completed webhook processed",
          "purchase marked paid and delivered",
          "purchase entitlement granted with one use",
          "duplicate webhook idempotent",
          "paid reading opens with purchase entitlement",
          "paid reading row stores authenticated user email",
          "paid reading consumes purchase entitlement",
          "second paid reading blocked after consumption",
        ],
        cleanup: {
          temporaryRowsRemaining: cleanupResult.remaining,
        },
        caveat:
          "This proof signs a local webhook payload with STRIPE_WEBHOOK_SECRET; it does not complete a real card payment.",
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
        proof: "stripe-checkout-webhook-entitlement",
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
