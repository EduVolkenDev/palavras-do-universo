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
    // CI can provide explicit environment variables instead.
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cleanBaseUrl(value) {
  return String(value ?? "http://localhost:3000").replace(/\/$/, "");
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
const baseUrl = cleanBaseUrl(process.env.PDU_QA_URL);
const runId = `events-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Site events proof skipped: configure Supabase URL and service role key.");
  process.exit(2);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

try {
  const response = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      eventType: "qa.telemetry",
      severity: "error",
      source: "qa-script",
      route: "/qa/site-events",
      path: "/qa/site-events",
      locale: "pt-BR",
      anonymousId: `pdu_${runId.replace(/[^a-z0-9]/gi, "")}`,
      message: `Controlled telemetry proof ${runId}`,
      viewport: { width: 390, height: 844, pixelRatio: 3 },
      scroll: { y: 742, maxY: 3200 },
      context: {
        proof: "site-events",
        runId,
        expectedCleanup: true,
      },
    }),
  });
  const json = await readJsonResponse(response);
  assert(response.status === 202 && json?.ok === true, "Telemetry route did not accept the event");

  const { data, error } = await admin
    .from("site_events")
    .select("id,event_type,severity,status,context,viewport,scroll")
    .contains("context", { runId })
    .maybeSingle();

  if (error) throw error;
  assert(data, "Telemetry event was not persisted in Supabase");
  assert(data.event_type === "qa.telemetry", "Persisted telemetry type is wrong");
  assert(data.severity === "error", "Persisted telemetry severity is wrong");
  assert(data.status === "new", "Persisted telemetry status is wrong");

  const { error: deleteError } = await admin.from("site_events").delete().eq("id", data.id);
  if (deleteError) throw deleteError;

  const { data: remaining, error: remainingError } = await admin
    .from("site_events")
    .select("id")
    .eq("id", data.id);
  if (remainingError) throw remainingError;
  assert((remaining ?? []).length === 0, "Telemetry proof row was not cleaned up");

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "site-events",
        baseUrl,
        checked: [
          "telemetry route accepts client events",
          "event persists in Supabase",
          "severity/status/context are preserved",
          "temporary proof row is cleaned up",
        ],
        cleanup: {
          temporaryRowsRemaining: 0,
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        proof: "site-events",
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
}
