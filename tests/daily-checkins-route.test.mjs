import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import typescript from "typescript";
import { cleanPersonalText, daysSince, isDailyCheckIn, localDateAt } from "../src/lib/astrology/daily-continuity.ts";

const routeSource = await readFile(new URL("../src/app/api/astrology/daily/check-ins/route.ts", import.meta.url), "utf8");
const routeCode = typescript.transpileModule(routeSource, {
  compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const endpoint = "http://localhost:3000/api/astrology/daily/check-ins";
const today = new Date().toISOString().slice(0, 10);
const earlier = (days) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const request = (method, body, url = endpoint) => new Request(url, {
  method,
  ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
});

function harness() {
  const saved = [];
  const daily = [];
  let user = { id: "user-one", email: "test@example.invalid" };
  let circle = true;
  let configured = true;

  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.kind = "select";
      this.changes = null;
      this.orderBy = null;
      this.take = null;
    }
    select() { return this; }
    eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
    order(column, { ascending }) { this.orderBy = { column, ascending }; return this; }
    limit(count) { this.take = count; return this; }
    update(changes) { this.kind = "update"; this.changes = changes; return this; }
    delete() { this.kind = "delete"; return this; }
    upsert(row, { ignoreDuplicates }) {
      const previous = saved.find((item) => item.user_id === row.user_id && item.client_key === row.client_key);
      if (!previous) saved.push({ ...row, id: randomUUID(), created_at: new Date().toISOString() });
      else if (!ignoreDuplicates) Object.assign(previous, row);
      return Promise.resolve({ data: null, error: null });
    }
    run() {
      const rows = this.table === "saved_messages" ? saved : daily;
      let matched = rows.filter((row) => this.filters.every((matches) => matches(row)));
      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        matched = matched.sort((a, b) => (String(a[column]).localeCompare(String(b[column]))) * (ascending ? 1 : -1));
      }
      if (this.take !== null) matched = matched.slice(0, this.take);
      if (this.kind === "update") for (const row of matched) Object.assign(row, this.changes);
      if (this.kind === "delete") for (const row of matched) rows.splice(rows.indexOf(row), 1);
      return { data: matched, error: null };
    }
    range(start, end) { const result = this.run(); return Promise.resolve({ ...result, data: result.data.slice(start, end + 1) }); }
    maybeSingle() { const result = this.run(); return Promise.resolve({ ...result, data: result.data[0] ?? null }); }
    then(resolve, reject) { return Promise.resolve(this.run()).then(resolve, reject); }
  }

  const modules = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth/api": { requireApiUser: async () => user
      ? { user, response: null }
      : { user: null, response: Response.json({ code: "AUTH_REQUIRED" }, { status: 401 }) } },
    "@/lib/astrology/server-access": { hasCircleAstrologyAccess: async () => circle },
    "@/lib/astrology/daily-continuity": { cleanPersonalText, daysSince, isDailyCheckIn, localDateAt },
    "@/lib/astrology/birth-data": { isIanaTimezone: (timezone) => timezone === "UTC" },
    "@/lib/supabase/server": {
      ensureSupabaseProfile: async () => {},
      getSupabaseAdmin: () => ({ from: (table) => new Query(table) }),
      hasSupabaseConfig: () => configured,
    },
  };
  const exports = {};
  vm.runInNewContext(routeCode, {
    exports,
    require: (name) => name === "node:crypto" ? { createHash } : modules[name],
    Response, Request, URL, Date, Intl,
  }, { filename: "daily-check-ins-route.js" });
  return { route: exports, saved, daily, setUser: (value) => { user = value; },
    setCircle: (value) => { circle = value; }, setConfigured: (value) => { configured = value; } };
}

test("daily check-in route rejects anonymous requests and unavailable storage", async () => {
  const app = harness();
  app.setUser(null);
  for (const [method, body] of [["GET", undefined], ["POST", {}], ["PATCH", {}], ["DELETE", {}]]) {
    const response = await app.route[method](request(method, body));
    assert.equal(response.status, 401, method);
  }
  app.setUser({ id: "user-one", email: "test@example.invalid" });
  app.setConfigured(false);
  assert.equal((await app.route.GET(request("GET"))).status, 503);
});

test("creation needs Circle and a ready reading, then saves only one user-owned moment", async () => {
  const app = harness();
  const body = { localDate: today, timezone: "UTC", locale: "pt-BR", gesture: "  Caminhar  ", reflection: "  Respirar  " };
  app.setCircle(false);
  assert.equal((await app.route.POST(request("POST", body))).status, 403);
  app.setCircle(true);
  assert.equal((await app.route.POST(request("POST", body))).status, 409);
  app.daily.push({ user_id: "user-one", local_date: today, timezone: "UTC", locale: "pt-BR", status: "ready",
    created_at: new Date().toISOString(), reading: { content: { nextStep: "Uma pausa possível" } } });
  const created = await app.route.POST(request("POST", body));
  assert.equal(created.status, 200);
  const first = (await created.json()).checkIn;
  assert.equal(first.gesture, "Caminhar");
  assert.equal(first.nextStep, "Uma pausa possível");
  const repeated = await app.route.POST(request("POST", { ...body, gesture: "Outro gesto" }));
  assert.equal((await repeated.json()).checkIn.id, first.id);
  assert.equal(app.saved.length, 1);
  assert.equal(app.saved[0].payload.gesture, "Caminhar");
  app.setUser({ id: "user-two", email: "other@example.invalid" });
  const otherHistory = await app.route.GET(request("GET"));
  assert.deepEqual((await otherHistory.json()).checkIns, []);
  assert.equal((await app.route.PATCH(request("PATCH", { id: first.id, followupText: "Outro olhar" }))).status, 404);
  assert.equal((await app.route.DELETE(request("DELETE", { id: first.id }))).status, 200);
  assert.equal(app.saved.length, 1);
});

test("follow-up waits two local days, stays idempotent, and removal is user-scoped", async () => {
  const app = harness();
  const id = randomUUID();
  app.saved.push({ id, user_id: "user-one", message_type: "daily_sky_checkin", client_key: "local_daily_test",
    created_at: new Date().toISOString(), payload: { kind: "daily_sky_checkin", version: 1,
      localDate: today, timezone: "UTC", nextStep: "Respirar", gesture: "Pausar", reflection: "",
      followupText: null, followupAt: null } });
  const tooSoon = await app.route.PATCH(request("PATCH", { id, followupText: "Hoje foi diferente" }));
  assert.equal(tooSoon.status, 409);
  app.saved[0].payload.localDate = earlier(2);
  const saved = await app.route.PATCH(request("PATCH", { id, followupText: "  Hoje foi diferente  " }));
  assert.equal(saved.status, 200);
  const first = (await saved.json()).checkIn;
  assert.equal(first.followupText, "Hoje foi diferente");
  assert.ok(first.followupAt);
  const repeated = await app.route.PATCH(request("PATCH", { id, followupText: "Não substituir" }));
  assert.equal((await repeated.json()).checkIn.followupText, "Hoje foi diferente");
  assert.equal((await app.route.DELETE(request("DELETE", { id }))).status, 200);
  assert.equal(app.saved.length, 0);
});

test("former subscribers retain read and deletion rights, while malformed writes are rejected", async () => {
  const app = harness();
  const id = randomUUID();
  app.saved.push({ id, user_id: "user-one", message_type: "daily_sky_checkin", client_key: "local_daily_old",
    created_at: new Date().toISOString(), payload: { kind: "daily_sky_checkin", version: 1,
      localDate: earlier(4), timezone: "UTC", nextStep: "Observar", gesture: "Pausar", reflection: "",
      followupText: null, followupAt: null } });
  app.setCircle(false);
  const history = await app.route.GET(request("GET"));
  assert.equal(history.status, 200);
  assert.equal((await history.json()).checkIns[0].id, id);
  const invalid = await app.route.POST(new Request(endpoint, { method: "POST", body: JSON.stringify({
    localDate: today, timezone: "UTC", locale: "pt-BR", gesture: "Teste",
  }) }));
  assert.equal(invalid.status, 400);
  assert.equal((await app.route.DELETE(request("DELETE", { id }))).status, 200);
  assert.equal(app.saved.length, 0);
});
