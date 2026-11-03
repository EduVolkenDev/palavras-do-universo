import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const consent = { SKY_EMAIL_CONSENT_VERSION: "daily-sky-2026-11-03", SKY_EMAIL_CONSENT: { "pt-BR": "Quero receber o boletim", en: "I want the newsletter" } };
function harness() {
  const rows = []; const messages = []; let failDelivery = false;
  class Query {
    filters = []; operation = "select"; values;
    select() { return this; }
    eq(key, value) { this.filters.push([key, value]); return this; }
    insert(values) { this.operation = "insert"; this.values = values; return this; }
    update(values) { this.operation = "update"; this.values = values; return this; }
    async run() {
      if (this.operation === "insert") { rows.push({ ...this.values, id: "subscription-one" }); return { data: null, error: null }; }
      const found = rows.filter(row => this.filters.every(([key, value]) => row[key] === value));
      if (this.operation === "update") found.forEach(row => Object.assign(row, this.values));
      return { data: found[0] ? { ...found[0] } : null, error: null };
    }
    maybeSingle() { return this.run(); }
    then(resolve, reject) { return this.run().then(resolve, reject); }
  }
  const modules = {
    "node:crypto": { createHash, randomBytes },
    "next/server": { NextResponse: { json: Response.json, redirect: Response.redirect } },
    "@/lib/http/request": { readJsonBody: async request => ({ ok: true, body: await request.json() }) },
    "@/lib/security/rateLimit": { checkRateLimit: async () => true },
    "@/lib/supabase/server": { getSupabaseAdmin: () => ({ from: () => new Query() }), hasSupabaseConfig: () => true },
    "@/lib/daily-sky-email/consent": consent,
    "@/lib/daily-sky-email/mailer": { skyEmailConfigured: () => true, sendSkyEmail: async input => {
      if (failDelivery) throw Error("provider unavailable");
      messages.push(input); return "test-provider-message";
    } },
  };
  async function load(name) {
    const source = await readFile(new URL(`../src/app/api/daily-sky-email/${name}/route.ts`, import.meta.url), "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, require: name => modules[name], Response, Request, URL, Date, console: { error() {} } });
    return exports;
  }
  return { rows, messages, load, fail: () => { failDelivery = true; } };
}
const base = "https://palavrasdouniverso.com/api/daily-sky-email/";
const request = body => new Request(`${base}subscribe`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("sign-up requires affirmative consent, records exact version and stays pending until explicit confirmation", async () => {
  const app = harness(); const subscribe = await app.load("subscribe");
  assert.equal((await subscribe.POST(request({ email: "test@example.invalid", consent: false }))).status, 400);
  assert.equal(app.rows.length, 0); assert.equal(app.messages.length, 0);
  assert.equal((await subscribe.POST(request({ email: " TEST@example.invalid ", consent: true }))).status, 201);
  const row = app.rows[0];
  assert.equal(row.email, "test@example.invalid"); assert.equal(row.status, "pending");
  assert.equal(row.consent_version, consent.SKY_EMAIL_CONSENT_VERSION);
  assert.equal(row.consent_text, consent.SKY_EMAIL_CONSENT["pt-BR"]);
  assert.equal(row.confirmation_message_id, "test-provider-message");
  const confirm = await app.load("confirm");
  const url = app.messages[0].action.url;
  const token = new URL(url).searchParams.get("token");
  assert.notEqual(row.confirmation_token_hash, token);
  assert.equal(row.confirmation_token_hash, createHash("sha256").update(token).digest("hex"));
  assert.match((await confirm.GET(new Request(url))).headers.get("location"), /\/confirmar\?token=/);
  assert.equal(row.status, "pending");
  const activated = await confirm.POST(new Request(url, { method: "POST" }));
  assert.equal(activated.status, 303); assert.match(activated.headers.get("location"), /status=confirmed/);
  assert.equal(row.status, "active"); assert.ok(row.confirmed_at); assert.equal(row.confirmation_token_hash, null);
  assert.match((await confirm.POST(new Request(url, { method: "POST" }))).headers.get("location"), /status=invalid/);
  await subscribe.POST(request({ email: row.email, consent: true }));
  assert.equal(app.messages.length, 1); assert.equal(row.status, "active");
  const unsubscribe = await app.load("unsubscribe");
  const cancelUrl = app.messages[0].unsubscribeUrl;
  await unsubscribe.GET(new Request(cancelUrl));
  assert.equal(row.status, "active");
  const removed = await unsubscribe.POST(new Request(cancelUrl, { method: "POST" }));
  assert.equal(removed.status, 303); assert.equal(row.status, "unsubscribed"); assert.ok(row.unsubscribed_at);
});

test("delivery failure and expired links never activate a subscription", async () => {
  const app = harness(); app.fail(); const subscribe = await app.load("subscribe");
  assert.equal((await subscribe.POST(request({ email: "test@example.invalid", consent: true }))).status, 503);
  assert.equal(app.rows[0].status, "pending"); assert.equal(app.rows[0].confirmation_message_id, null);
  const token = randomBytes(32).toString("base64url");
  app.rows[0].confirmation_token_hash = createHash("sha256").update(token).digest("hex");
  app.rows[0].confirmation_expires_at = new Date(Date.now() - 1000).toISOString();
  const confirm = await app.load("confirm");
  assert.match((await confirm.POST(new Request(`${base}confirm?token=${token}`, { method: "POST" }))).headers.get("location"), /status=invalid/);
  assert.equal(app.rows[0].status, "pending");
});

test("confirmation and cancellation addresses remain visible if the provider's button redirect fails", async () => {
  const source = await readFile(new URL("../src/lib/daily-sky-email/mailer.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {}; let sent;
  vm.runInNewContext(code, { exports, require: () => ({ brevoApiConfigured: () => true, sendBrevoEmail: async input => { sent = input; return "accepted"; } }) });
  const action = "https://palavrasdouniverso.com/api/daily-sky-email/confirm?token=TEST";
  const cancel = "https://palavrasdouniverso.com/api/daily-sky-email/unsubscribe?token=CANCEL";
  await exports.sendSkyEmail({ to: "test@example.invalid", locale: "pt-BR", subject: "Confirmar", paragraphs: ["Consentimento solicitado"],
    action: { label: "Confirmar minha inscrição", url: action }, unsubscribeUrl: cancel, tag: "daily-sky-confirmation" });
  assert.ok(sent.htmlContent.includes(`>${action}</p>`));
  assert.ok(sent.htmlContent.includes(`<br>${cancel}</p>`));
  assert.ok(sent.textContent.includes(action)); assert.ok(sent.textContent.includes(cancel));
  assert.equal(sent.senderEmail, "suporte@palavrasdouniverso.com");
  assert.ok(!sent.htmlContent.includes("você confirmou a assinatura"));
});
