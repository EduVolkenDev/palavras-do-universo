import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import ts from "typescript";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "pdu-ai-reading-quality-"));
const port = Number(process.env.PDU_AI_PROOF_PORT ?? 3042);
const baseUrl = `http://127.0.0.1:${port}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function hasAnthropicKey() {
  if (process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")) return true;

  const envText = await readFile(join(root, ".env.local"), "utf8").catch(() => "");
  return /^ANTHROPIC_API_KEY=sk-ant-/m.test(envText);
}

async function waitForServer(child) {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < 90_000) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev exited before proof started with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(baseUrl, { cache: "no-store" });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (caught) {
      lastError = caught instanceof Error ? caught.message : String(caught);
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${baseUrl}: ${lastError}`);
}

async function postReading(body) {
  const response = await fetch(`${baseUrl}/api/reading/create`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const text = await response.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  assert(response.ok, `Reading request failed: HTTP ${response.status} ${text.slice(0, 240)}`);
  return data;
}

try {
  assert(await hasAnthropicKey(), "ANTHROPIC_API_KEY is not configured in the environment or .env.local");
  await compile("src/lib/tarot/reading-quality.ts", "src/lib/tarot/reading-quality.js");
  const { validateReadingQuality } = await import(
    join(temp, "src/lib/tarot/reading-quality.js")
  );

  const nextBin = join(root, "node_modules", ".bin", "next");
  const child = spawn(nextBin, ["dev", "--webpack", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      PDU_READING_DEBUG_SOURCE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";

  child.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
    serverLog = serverLog.slice(-8_000);
  });
  child.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
    serverLog = serverLog.slice(-8_000);
  });

  try {
    await waitForServer(child);

    const cases = [
      {
        body: {
          locale: "pt-BR",
          onboardingFocus: "decisao com muita pressao",
          onboardingSignal: "firmar",
          productKey: "free_daily",
          question: "Como organizar minhas prioridades sem transformar tudo em urgência?",
          readingProfile: {
            currentPhase: "reorganizacao",
            desiredShift: "mais calma e foco",
            focusAreas: ["trabalho", "clareza"],
            guidanceTone: "direto e acolhedor",
          },
          theme: "career",
          timeZone: "Europe/London",
          userId: `pdu-ai-proof-pt-${Date.now()}`,
        },
        expectedCards: 3,
        locale: "pt-BR",
        maxCharacters: 3_000,
        paidProduct: false,
      },
      {
        body: {
          locale: "en",
          onboardingFocus: "choosing the next step calmly",
          onboardingSignal: "clear action",
          productKey: "free_daily",
          question: "How can I choose the next professional step without turning everything into pressure?",
          readingProfile: {
            currentPhase: "reorganizing priorities",
            desiredShift: "calmer focus",
            focusAreas: ["work", "clarity"],
            guidanceTone: "direct and warm",
          },
          theme: "career",
          timeZone: "Europe/London",
          userId: `pdu-ai-proof-en-${Date.now()}`,
        },
        expectedCards: 3,
        locale: "en",
        maxCharacters: 3_000,
        paidProduct: false,
      },
    ];

    const results = [];
    for (const item of cases) {
      const data = await postReading(item.body);
      assert(data.ok === true, `${item.locale} reading did not return ok:true`);
      assert(
        data.readingSource === "ai",
        `${item.locale} reading used ${data.readingSource ?? "unknown source"}${
          data.readingQualityReason ? ` (${data.readingQualityReason})` : ""
        }`
      );

      const quality = validateReadingQuality(data.interpretation, {
        expectedCards: item.expectedCards,
        locale: item.locale,
        maxCharacters: item.maxCharacters,
        paidProduct: item.paidProduct,
      });
      assert(
        quality.ok,
        `${item.locale} AI reading failed local quality validation: ${quality.reason}`
      );

      results.push({
        cards: data.spread?.length ?? 0,
        chars: data.interpretation.length,
        locale: item.locale,
        source: data.readingSource,
      });
    }

    console.log(JSON.stringify({ baseUrl, ok: true, results }, null, 2));
  } catch (caught) {
    if (serverLog.trim()) {
      console.error("Recent Next output:");
      console.error(serverLog.trim().slice(-3_000));
    }
    throw caught;
  } finally {
    child.kill("SIGINT");
    await delay(800);
    if (child.exitCode === null) child.kill("SIGTERM");
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
