import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

function loadDotenv(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
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
    const separator = pair.indexOf("=");
    if (separator < 0) continue;

    const name = pair.slice(0, separator).trim();
    const value = decodeURIComponent(pair.slice(separator + 1).trim());
    const existing = jar.findIndex((cookie) => cookie.name === name);
    if (existing >= 0) jar[existing] = { name, value };
    else jar.push({ name, value });
  }
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { nonJson: text.slice(0, 500) };
  }
}

async function deleteRows(admin, userId) {
  const tables = [
    "impact_commitments",
    "saved_messages",
    "readings",
  ];
  const warnings = [];

  for (const table of tables) {
    const result = await admin.from(table).delete().eq("user_id", userId);
    if (result.error) warnings.push(`${table}: ${result.error.message}`);
  }

  const profileDelete = await admin.from("profiles").delete().eq("id", userId);
  if (profileDelete.error) warnings.push(`profiles by id: ${profileDelete.error.message}`);

  const deleted = await admin.auth.admin.deleteUser(userId);
  if (deleted.error) warnings.push(`auth user: ${deleted.error.message}`);

  for (const table of tables) {
    const result = await admin
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    if (result.error) warnings.push(`verify ${table}: ${result.error.message}`);
    else if (result.data?.length) warnings.push(`verify ${table}: rows remain`);
  }

  const profile = await admin.from("profiles").select("id").eq("id", userId).limit(1);
  if (profile.error) warnings.push(`verify profiles: ${profile.error.message}`);
  else if (profile.data?.length) warnings.push("verify profiles: row remains");

  return warnings;
}

async function proveAuthenticatedInterface(cookies, pageUrl, readingQuestions) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "pt-BR",
    viewport: { width: 390, height: 844 },
  });
  await context.addCookies(
    cookies.map(({ name, value }) => ({
      name,
      value,
      url: `${new URL(pageUrl).origin}/`,
      secure: pageUrl.startsWith("https://"),
    }))
  );

  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      failedRequests.push(request.url());
    }
  });

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(1_200);
    await page.getByText("Mapa ativo", { exact: true }).waitFor({
      state: "visible",
      timeout: 45_000,
    });
    await page.getByRole("heading", { name: "Fase QA", exact: true }).waitFor({
      state: "visible",
      timeout: 45_000,
    });
    await page.getByText("Seus compromissos com a vida real", { exact: true }).waitFor({
      state: "visible",
      timeout: 45_000,
    });
    for (const question of readingQuestions) {
      await page.getByText(question, { exact: true }).first().waitFor({
        state: "visible",
        timeout: 45_000,
      });
    }
    const lumeButton = page.locator("button.pdu-lume-ambient__button");
    assert((await lumeButton.count()) === 1, "Lume presence button was not unique");
    await lumeButton.click();
    const panel = page.locator("#lume-guide-panel");
    await panel.waitFor({ state: "visible", timeout: 10_000 });
    assert((await panel.getAttribute("role")) === "dialog", "Lume panel lost dialog semantics");
    assert(
      (await panel.getAttribute("aria-label")) === "Lume — orientação",
      "Lume panel lost its accessible label"
    );
    await panel.getByText(/gesto em aberto/).waitFor({
      state: "visible",
      timeout: 45_000,
    });
    await panel.locator('input[aria-label="Perguntar à Lume"]').fill("ação");
    await panel.locator('button[type="submit"]').click();
    await panel.getByText(/Você tem 1 gesto em aberto/).last().waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const actionLinkLocator = panel.locator('a[href="/meu-universo#acoes-vivas"]');
    assert((await actionLinkLocator.count()) === 1, "Lume did not render the live actions link");
    const actionLink = await actionLinkLocator.getAttribute("href");
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      bodyWidth: document.body.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
    }));

    assert(actionLink === "/meu-universo#acoes-vivas", "Lume action link did not target live actions");
    assert(!metrics.overflow, `Authenticated Meu Universo overflows at ${metrics.viewportWidth}px`);
    assert(!consoleErrors.length, `Authenticated interface console errors: ${consoleErrors[0]}`);
    assert(!failedRequests.length, `Authenticated interface failed requests: ${failedRequests[0]}`);

    return {
      route: "meu-universo",
      viewport: `${metrics.viewportWidth}px`,
      journeySection: "visible",
      lume: "open action recognized",
      actionLink,
      overflow: metrics.overflow,
    };
  } finally {
    await browser.close();
  }
}

loadDotenv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = cleanBaseUrl(process.env.PDU_QA_URL);
const origin = new URL(baseUrl).origin;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error(
    "Journey continuity proof skipped: configure Supabase URL, service role key, and anon key."
  );
  process.exit(2);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `pdu-journey-${runId}@example.invalid`;
const password = `PduJourney!${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
const clientKey = `action_fase14${Date.now()}`;
const readingQuestion = "O que precisa ficar claro na minha próxima decisão?";
const importedReadingQuestion = "Que pequena escolha pode devolver meu centro hoje?";
let userId = "";
const jar = [];

async function apiJson(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: cookieHeader(jar),
      origin,
    },
    method,
  });
  mergeSetCookies(jar, response);
  return { response, json: await readJson(response) };
}

function expectStatus(result, status, label) {
  assert(
    result.response.status === status,
    `${label}: expected ${status}, received ${result.response.status} ${JSON.stringify(result.json)}`
  );
}

try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { proof: "journey-continuity", runId },
  });
  assert(created.data.user && !created.error, created.error?.message ?? "Could not create proof user");
  userId = created.data.user.id;

  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  assert(signedIn.data.session && !signedIn.error, signedIn.error?.message ?? "Could not sign in proof user");

  const serverClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return jar;
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const existing = jar.findIndex((item) => item.name === cookie.name);
          const next = { name: cookie.name, value: cookie.value };
          if (existing >= 0) jar[existing] = next;
          else jar.push(next);
        }
      },
    },
  });
  const session = await serverClient.auth.setSession({
    access_token: signedIn.data.session.access_token,
    refresh_token: signedIn.data.session.refresh_token,
  });
  assert(!session.error, session.error?.message ?? "Could not establish server session");

  const privatePaths = [
    "/api/profile",
    "/api/readings?limit=1",
    "/api/saved-messages?limit=1",
    "/api/actions",
    "/api/entitlements",
  ];
  for (const path of privatePaths) {
    const result = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    assert(result.status === 401, `${path}: unauthenticated request returned ${result.status}`);
  }

  const profile = await apiJson("PUT", "/api/profile", {
    displayName: "Fase QA",
    focusAreas: ["Carreira"],
    currentPhase: "Tomando uma decisão",
    guidanceTone: "Direta e prática",
    desiredShift: "agir com clareza",
    boundaries: ["Sem fatalismo"],
    contextNote: "Temporary journey continuity proof",
  });
  expectStatus(profile, 200, "profile PUT");
  assert(profile.json?.profile?.display_name === "Fase QA", "Profile was not persisted");
  assert(profile.json?.personalizationSignals?.profileComplete === true, "Profile signals were not returned as complete");

  const reading = await apiJson("POST", "/api/reading/create", {
    theme: "career",
    question: readingQuestion,
    productKey: "free_daily",
    spreadType: "three_card_timeline",
    locale: "pt-BR",
    readingProfile: {
      displayName: "Fase QA",
      focusAreas: ["Carreira"],
      currentPhase: "Tomando uma decisão",
      guidanceTone: "Direta e prática",
      desiredShift: "agir com clareza",
      boundaries: ["Sem fatalismo"],
      contextNote: "Authenticated reading continuity proof",
    },
    timeZone: "Europe/London",
  });
  expectStatus(reading, 200, "authenticated reading POST");
  const readingId = reading.json?.readingId;
  assert(
    typeof readingId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(readingId),
    "Authenticated reading did not return a UUID"
  );
  assert(
    reading.json?.readingSource === "fallback:qa_no_ai",
    `Reading proof did not use the no-AI QA fallback: ${reading.json?.readingSource ?? "missing source"}`
  );
  assert(Array.isArray(reading.json?.spread) && reading.json.spread.length === 3, "Authenticated reading returned the wrong spread");
  assert(typeof reading.json?.interpretation === "string" && reading.json.interpretation.length > 80, "Authenticated reading returned no interpretation");

  const localSyncClientKey = `local_fase14${Date.now()}`;
  const importedReadingPayload = {
    savedAt: new Date().toISOString(),
    locale: "pt-BR",
    theme: "career",
    productKey: "free_daily",
    spreadType: "three_card_timeline",
    spreadLabel: "3 Cartas — Passado / Presente / Caminho",
    question: importedReadingQuestion,
    spreadLine: "RAIZ: O Louco | AGORA: Os Enamorados | CAMINHO: A Imperatriz",
    spreadCards: reading.json.spread,
    result: "1) RESPOSTA DIRETA\n\nUma pequena escolha pode devolver eixo sem exigir que você resolva tudo hoje.\n\n2) CARTAS\n\n- O conjunto pede presença, escolha e cuidado.\n\n3) AÇÕES\n\n- Escreva o próximo passo possível.\n\n4) FECHAMENTO\n\nMantra: posso avançar com calma.",
  };
  const sync = await apiJson("POST", "/api/account/sync-local", {
    messages: [
      {
        id: localSyncClientKey,
        reading_id: null,
        message_type: "reading",
        payload: importedReadingPayload,
        created_at: importedReadingPayload.savedAt,
      },
    ],
  });
  expectStatus(sync, 200, "local reading sync");
  assert(sync.json?.syncedKeys?.includes(localSyncClientKey), "Local reading sync did not acknowledge its client key");

  const syncAgain = await apiJson("POST", "/api/account/sync-local", {
    messages: [
      {
        id: localSyncClientKey,
        reading_id: null,
        message_type: "reading",
        payload: importedReadingPayload,
        created_at: importedReadingPayload.savedAt,
      },
    ],
  });
  expectStatus(syncAgain, 200, "idempotent local reading sync");

  const action = await apiJson("POST", "/api/actions", {
    clientKey,
    actionKey: "resolver_pendencia",
    plan: "Hoje, vou dedicar vinte minutos a esta pendência.",
    sourceReadingId: readingId,
    status: "committed",
  });
  expectStatus(action, 200, "action POST");
  const actionId = action.json?.commitment?.id;
  assert(typeof actionId === "string", "Action id was not returned");
  assert(action.json?.commitment?.source_reading_id === readingId, "Action was not linked to the authenticated reading");

  const message = await apiJson("POST", "/api/saved-messages", {
    clientKey: `local_fase14_saved${Date.now()}`,
    readingId,
    messageType: "reading",
    payload: {
      theme: "career",
      savedAt: new Date().toISOString(),
      locale: "pt-BR",
      productKey: "free_daily",
      spreadType: reading.json?.spreadType,
      spreadLabel: reading.json?.spreadLabel,
      question: readingQuestion,
      spreadLine: "RAIZ: O Louco | AGORA: Os Enamorados | CAMINHO: A Imperatriz",
      spreadCards: reading.json?.spread,
      result: reading.json?.interpretation,
    },
  });
  expectStatus(message, 200, "saved message POST");

  const profileRead = await apiJson("GET", "/api/profile");
  const actionsRead = await apiJson("GET", "/api/actions");
  const messagesRead = await apiJson("GET", "/api/saved-messages?limit=20");
  const readingsRead = await apiJson("GET", "/api/readings?limit=20");
  for (const [label, result] of [
    ["profile GET", profileRead],
    ["actions GET", actionsRead],
    ["messages GET", messagesRead],
    ["readings GET", readingsRead],
  ]) {
    expectStatus(result, 200, label);
  }

  assert(profileRead.json?.profile?.display_name === "Fase QA", "Authenticated profile GET returned another profile");
  assert(
    actionsRead.json?.commitments?.some((item) => item.client_key === clientKey && item.status === "committed"),
    "Authenticated actions GET did not return the open commitment"
  );
  assert(
    messagesRead.json?.messages?.some((item) => item.message_type === "reading" && item.reading_id === readingId),
    "Authenticated messages GET did not return the saved reading link"
  );
  assert(
    readingsRead.json?.readings?.some((item) => item.id === readingId && item.question === readingQuestion),
    "Authenticated readings GET did not return the created reading"
  );
  assert(
    readingsRead.json?.readings?.some((item) => item.question === importedReadingQuestion),
    "Authenticated readings GET did not return the imported local reading"
  );
  const importedReadingIds = readingsRead.json?.readings
    ?.filter((item) => item.question === importedReadingQuestion)
    .map((item) => item.id);
  assert(importedReadingIds?.length === 1, "Idempotent local sync created duplicate readings");
  assert(
    messagesRead.json?.messages?.some((item) => item.client_key === localSyncClientKey && item.reading_id === importedReadingIds?.[0]),
    "Imported local message did not preserve its reading link"
  );

  const universe = await fetch(`${baseUrl}/meu-universo`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const universeHtml = await universe.text();
  assert(universe.status === 200, `Meu Universo returned ${universe.status}`);
  assert(universeHtml.includes("Meu Universo"), "Meu Universo page did not render for authenticated session");

  const interfaceProof = await proveAuthenticatedInterface(
    jar,
    `${baseUrl}/meu-universo?lang=pt-BR&qa=${runId}`,
    [readingQuestion, importedReadingQuestion]
  );

  const completed = await apiJson("PATCH", `/api/actions/${encodeURIComponent(actionId)}`, {
    status: "completed",
    reflection: "Registrei o primeiro passo possível.",
  });
  expectStatus(completed, 200, "action PATCH completed");

  const completedRead = await apiJson("GET", "/api/actions");
  expectStatus(completedRead, 200, "actions GET after completion");
  assert(
    completedRead.json?.commitments?.some((item) => item.client_key === clientKey && item.status === "completed"),
    "Completed action was not returned with completed status"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "journey-continuity",
        profile: "persisted and returned",
        reading: "created authenticated and imported locally without duplication",
        action: "committed, linked to reading, then completed",
        savedMessage: "persisted with reading link",
        universe: "200 with authenticated session",
        interface: interfaceProof,
      },
      null,
      2
    )
  );
} finally {
  if (userId) {
    const warnings = await deleteRows(admin, userId);
    if (warnings.length) {
      console.warn(`Cleanup warnings: ${warnings.join("; ")}`);
      process.exitCode = 1;
    }
  }
}
