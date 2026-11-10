import assert from "node:assert/strict";
import test from "node:test";
import { classifySupabaseFailure, reportSupabaseFailure, validateSupabaseAdminConfig } from "../src/lib/supabase/diagnostics.ts";

const url = "https://project-one.supabase.co";
const jwt = (role, ref = "project-one") => `header.${Buffer.from(JSON.stringify({ role, ref })).toString("base64url")}.signature`;

test("admin configuration rejects a key from another project, an anon key, and mixed URLs", () => {
  assert.doesNotThrow(() => validateSupabaseAdminConfig(url, jwt("service_role"), `${url}/`));
  assert.doesNotThrow(() => validateSupabaseAdminConfig(url, "sb_secret_test"));
  assert.doesNotThrow(() => validateSupabaseAdminConfig("http://127.0.0.1:54321", jwt("service_role")));
  for (const [serverUrl, key, publicUrl] of [
    [url, jwt("anon")], [url, jwt("service_role", "project-two")],
    [url, jwt("service_role"), "https://project-two.supabase.co"],
    [url, "not-a-key"], ["http://project-one.supabase.co", jwt("service_role")],
  ]) assert.throws(() => validateSupabaseAdminConfig(serverUrl, key, publicUrl), /configuration is inconsistent/);
});

test("upstream failures are categorized without serializing secrets or birth details", () => {
  assert.equal(classifySupabaseFailure({ message: "Wrong API key" }), "credentials");
  assert.equal(classifySupabaseFailure({ message: "Invalid API key" }), "credentials");
  assert.equal(classifySupabaseFailure({ code: "42P01" }), "schema");
  assert.equal(classifySupabaseFailure({ code: "42501" }), "permission");
  assert.equal(classifySupabaseFailure(new Error("fetch failed")), "network");
  const output = [];
  const previous = console.error;
  console.error = (line) => output.push(line);
  try {
    const result = reportSupabaseFailure("astrology.birth-data.read", {
      message: "Wrong API key sb_secret_DO_NOT_LOG", details: "birth-date-private", code: "sensitive-code",
    });
    assert.equal(result.status, 503);
    assert.match(result.incidentId, /^[a-f0-9-]{36}$/);
    const event = JSON.parse(output[0]);
    assert.equal(event.kind, "credentials");
    assert.equal(event.incidentId, result.incidentId);
    assert.doesNotMatch(output.join(""), /sb_secret|birth-date|sensitive-code|Wrong API key/);
  } finally { console.error = previous; }
});
