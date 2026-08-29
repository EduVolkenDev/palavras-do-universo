import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "pdu-paid-reading-quality-"));
const port = Number(process.env.PDU_PAID_AI_PROOF_PORT ?? 3043);
const baseUrl = `http://127.0.0.1:${port}`;
const origin = new URL(baseUrl).origin;

const productCases = [
  {
    expectedCards: 10,
    productKey: "cruz_celta",
    question: {
      "pt-BR":
        "Que forças estão moldando esta fase da minha vida e qual direção merece prioridade agora?",
      en: "What forces are shaping this phase of my life, and which direction deserves priority now?",
    },
    theme: "spirit",
  },
  {
    expectedCards: 12,
    productKey: "o_espelho",
    question: {
      "pt-BR":
        "O que este vínculo revela sobre mim, sobre o outro e sobre o limite que preciso honrar?",
      en: "What does this bond reveal about me, the other person, and the boundary I need to honor?",
    },
    theme: "love",
  },
  {
    expectedCards: 8,
    productKey: "a_chave",
    question: {
      "pt-BR":
        "Que padrão oculto eu preciso compreender para abrir uma possibilidade mais madura neste momento?",
      en: "Which hidden pattern do I need to understand to open a more mature possibility now?",
    },
    theme: "emotional",
  },
  {
    expectedCards: 7,
    productKey: "passaro_voando",
    question: {
      "pt-BR":
        "O que em mim está pronto para ganhar movimento e como posso atravessar o medo com presença?",
      en: "What in me is ready to move, and how can I cross fear with presence?",
    },
    theme: "spirit",
  },
];

const locales = ["pt-BR", "en"];

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

async function compile(source, target) {
  const code = await readFile(join(root, source), "utf8");
  const result = ts.transpileModule(code, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: source,
  });
  const destination = join(temp, target);
  await mkdir(join(destination, ".."), { recursive: true });
  await writeFile(destination, result.outputText);
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
    const next = { name, value };
    if (existing >= 0) jar[existing] = next;
    else jar.push(next);
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

async function waitForServer(child) {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < 90_000) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev exited before proof started with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health/supabase`, {
        cache: "no-store",
      });
      const json = await readJsonResponse(response);
      if (response.ok && json?.ok === true) return;
      lastError = `HTTP ${response.status}`;
    } catch (caught) {
      lastError = caught instanceof Error ? caught.message : String(caught);
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${baseUrl}: ${lastError}`);
}

async function createProofUser({ admin, anonKey, publicClient, runId, supabaseUrl }) {
  const email = `pdu-paid-ai-${runId}@example.invalid`;
  const password = `PduPaidAI!${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { proof: "paid-ai-reading-quality", runId },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Could not create proof user");
  }

  const userId = created.data.user.id;
  await expectNoError(
    await admin.from("profiles").upsert({ id: userId, email }, { onConflict: "id" }),
    "Could not create proof profile"
  );

  const signedIn = await publicClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw signedIn.error ?? new Error("Could not sign in proof user");
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

  return { email, jar, userId };
}

async function apiJson(user, method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: cookieHeader(user.jar),
      origin,
    },
    method,
  });
  mergeSetCookies(user.jar, response);
  const json = await readJsonResponse(response);
  return { json, status: response.status };
}

async function cleanupProof({ admin, userId }) {
  const warnings = [];
  async function safe(label, promise) {
    const { error } = await promise;
    if (error) warnings.push(`${label}: ${error.message}`);
  }

  if (userId) {
    await safe("delete proof readings", admin.from("readings").delete().eq("user_id", userId));
    await safe("delete proof usage", admin.from("usage_daily").delete().eq("user_id", userId));
    await safe("delete proof entitlements", admin.from("user_entitlements").delete().eq("user_id", userId));
    await safe("delete proof purchases", admin.from("purchases").delete().eq("user_id", userId));
    await safe("delete proof subscriptions", admin.from("subscriptions").delete().eq("user_id", userId));
    await safe("delete proof saved messages", admin.from("saved_messages").delete().eq("user_id", userId));
    await safe("delete proof profile", admin.from("profiles").delete().eq("id", userId));

    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error) warnings.push(`delete auth user ${userId}: ${deleted.error.message}`);
  }

  const remaining = userId
    ? await Promise.all([
        admin.from("readings").select("id").eq("user_id", userId),
        admin.from("user_entitlements").select("id").eq("user_id", userId),
        admin.from("profiles").select("id").eq("id", userId),
      ])
    : [];
  remaining.forEach((result, index) => {
    if (result.error) warnings.push(`verify cleanup ${index + 1}: ${result.error.message}`);
  });
  const temporaryRowsRemaining = remaining.reduce(
    (total, result) => total + (result.error ? 1 : result.data?.length ?? 0),
    0
  );

  return { temporaryRowsRemaining, warnings };
}

loadDotenv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey || !anthropicKey?.startsWith("sk-ant-")) {
  console.error(
    "Paid AI proof skipped: configure Supabase URL, service role key, anon key, and ANTHROPIC_API_KEY."
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

let child = null;
let serverLog = "";
let proofUser = null;

try {
  await compile("src/lib/tarot/reading-quality.ts", "src/lib/tarot/reading-quality.js");
  const { validateReadingQuality } = await import(
    join(temp, "src/lib/tarot/reading-quality.js")
  );

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const nextBin = join(root, "node_modules", ".bin", "next");
  child = spawn(nextBin, ["dev", "--webpack", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      PDU_READING_DEBUG_SOURCE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
    serverLog = serverLog.slice(-10_000);
  });
  child.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
    serverLog = serverLog.slice(-10_000);
  });

  await waitForServer(child);

  proofUser = await createProofUser({
    admin,
    anonKey,
    publicClient,
    runId,
    supabaseUrl,
  });

  await expectNoError(
    await admin.from("user_entitlements").insert(
      productCases.map((item) => ({
        user_id: proofUser.userId,
        product_key: item.productKey,
        source: "admin",
        status: "active",
        starts_at: new Date().toISOString(),
        expires_at: null,
        usage_limit: null,
        usage_count: 0,
        consumed_at: null,
        metadata: {
          proof: "paid-ai-reading-quality",
          runId,
        },
      }))
    ),
    "Could not create proof entitlements"
  );

  const results = [];
  for (const product of productCases) {
    for (const locale of locales) {
      const maxCharacters = product.expectedCards > 7 ? 6_800 : 5_200;
      const reading = await apiJson(proofUser, "POST", "/api/reading/create", {
        locale,
        productKey: product.productKey,
        question: product.question[locale],
        theme: product.theme,
        timeZone: "Europe/London",
      });
      assert(
        reading.status === 200 && reading.json?.ok === true,
        `${product.productKey}/${locale} did not open: HTTP ${reading.status} ${JSON.stringify(
          reading.json
        ).slice(0, 240)}`
      );
      assert(
        reading.json?.readingSource === "ai",
        `${product.productKey}/${locale} used ${
          reading.json?.readingSource ?? "unknown source"
        }${reading.json?.readingQualityReason ? ` (${reading.json.readingQualityReason})` : ""}`
      );
      assert(
        reading.json?.spread?.length === product.expectedCards,
        `${product.productKey}/${locale} returned ${reading.json?.spread?.length ?? 0} cards`
      );

      const quality = validateReadingQuality(reading.json.interpretation, {
        expectedCards: product.expectedCards,
        locale,
        maxCharacters,
        paidProduct: true,
      });
      const longestLine = reading.json.interpretation
        .split("\n")
        .map((line) => line.trim())
        .sort((left, right) => right.length - left.length)[0] ?? "";
      assert(
        quality.ok,
        `${product.productKey}/${locale} failed local quality validation: ${quality.reason}; longest line ${longestLine.length} chars: ${longestLine.slice(0, 360)}`
      );

      const persisted = await expectNoError(
        await admin
          .from("readings")
          .select("id,user_id,email,intent_key")
          .eq("id", reading.json.readingId)
          .single(),
        `Could not read persisted reading for ${product.productKey}/${locale}`
      );
      assert(persisted.user_id === proofUser.userId, `${product.productKey}/${locale} user mismatch`);
      assert(persisted.email === proofUser.email, `${product.productKey}/${locale} email mismatch`);
      assert(persisted.intent_key === product.productKey, `${product.productKey}/${locale} intent mismatch`);

      results.push({
        cards: reading.json.spread.length,
        chars: reading.json.interpretation.length,
        locale,
        productKey: product.productKey,
        readingId: reading.json.readingId,
        source: reading.json.readingSource,
      });
    }
  }

  const cleanup = await cleanupProof({ admin, userId: proofUser.userId });
  assert(cleanup.temporaryRowsRemaining === 0, "Temporary proof rows were not fully cleaned up");

  console.log(
    JSON.stringify(
      {
        baseUrl,
        checkedProducts: productCases.map((item) => item.productKey),
        cleanup,
        ok: true,
        proof: "paid-ai-reading-quality",
        results,
      },
      null,
      2
    )
  );
} catch (error) {
  const cleanup = await cleanupProof({ admin, userId: proofUser?.userId });
  if (serverLog.trim()) {
    console.error("Recent Next output:");
    console.error(serverLog.trim().slice(-4_000));
  }
  console.error(
    JSON.stringify(
      {
        cleanup,
        error: error instanceof Error ? error.message : String(error),
        ok: false,
        proof: "paid-ai-reading-quality",
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} finally {
  if (child) {
    child.kill("SIGINT");
    await delay(800);
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  await rm(temp, { recursive: true, force: true });
}
