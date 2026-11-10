import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { reportSupabaseFailure } from "../src/lib/supabase/diagnostics.ts";

const source = await readFile(new URL("../src/app/api/astrology/birth-data/route.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function harness() {
  let authenticated = true;
  let failure = null;
  let mutations = 0;
  let data = null;
  const filters = [];
  const query = {
    upsert: async () => { mutations++; return { error: failure }; },
    delete: () => { mutations++; return query; },
    eq: async (column, value) => { filters.push([column, value]); return { error: failure }; },
  };
  const modules = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth/api": { requireApiUser: async () => authenticated
      ? { user: { id: "owner-one", email: "test@example.invalid" }, response: null }
      : { response: Response.json({ code: "AUTH_REQUIRED" }, { status: 401 }) } },
    "@/lib/http/request": { readJsonBody: async (request) => ({ ok: true, body: await request.json() }) },
    "@/lib/astrology/birth-data": {
      ASTROLOGY_BIRTH_CALCULATION_VERSION: "test",
      readAstrologyBirthData: async () => { if (failure) throw failure; return data; },
      validateAstrologyBirthData: (value) => ({ ok: true, data: value }),
    },
    "@/lib/supabase/server": {
      hasSupabaseConfig: () => true,
      ensureSupabaseProfile: async () => { if (failure) throw failure; },
      getSupabaseAdmin: () => ({ from: () => query }),
    },
    "@/lib/supabase/diagnostics": { reportSupabaseFailure },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => modules[name], Response });
  return { route: exports, filters, mutations: () => mutations, setFailure: (v) => { failure = v; },
    setUser: (v) => { authenticated = v; }, setData: (v) => { data = v; } };
}
const put = (body) => new Request("https://example.invalid/api/astrology/birth-data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("birth-data endpoints reject anonymous calls before any mutation", async () => {
  const app = harness(); app.setUser(false);
  for (const [method, arg] of [["GET"], ["PUT", put({})], ["DELETE"]]) {
    assert.equal((await app.route[method](arg)).status, 401);
  }
  assert.equal(app.mutations(), 0);
});

test("missing birth data is distinct from failed storage; consent remains required", async () => {
  const app = harness();
  let response = await app.route.GET();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).birthData, null);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await app.route.PUT(put({}))).status, 400);
  assert.equal(app.mutations(), 0);
  app.setData({ localDate: "1990-01-01" });
  response = await app.route.GET();
  assert.equal((await response.json()).birthData.localDate, "1990-01-01");
});

test("credential errors in profile setup and reads become private JSON errors without upstream details", async () => {
  const app = harness(); app.setFailure({ message: "Wrong API key sb_secret_PRIVATE", details: "private-birth-data" });
  const previous = console.error; console.error = () => {};
  try {
    for (const [method, arg] of [["GET"], ["PUT", put({ consent: { storeBirthData: true } })], ["DELETE"]]) {
      const response = await app.route[method](arg);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      const body = await response.text();
      assert.doesNotMatch(body, /sb_secret|private-birth-data|Wrong API key/);
      assert.ok(JSON.parse(body).incidentId);
    }
  } finally { console.error = previous; }
  assert.deepEqual(app.filters, [["user_id", "owner-one"]]);
});
