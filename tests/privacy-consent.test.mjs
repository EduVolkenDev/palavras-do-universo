import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const consentSource = await readFile(new URL("../src/lib/client/privacy-consent.ts", import.meta.url), "utf8");
const eventsSource = await readFile(new URL("../src/lib/client/siteEvents.ts", import.meta.url), "utf8");
function load(source, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Date, Event, ...globals });
  return exports;
}
function harness() {
  const data = new Map();
  const listeners = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const window = { localStorage: storage, sessionStorage: storage,
    dispatchEvent: e => listeners.get(e.type)?.(), addEventListener: (type, listener) => listeners.set(type, listener), removeEventListener: type => listeners.delete(type) };
  return { data, window, consent: load(consentSource, { window }) };
}

test("unknown, malformed, future and expired consent fail closed", () => {
  const { consent } = harness();
  assert.equal(consent.diagnosticsAllowed(), false);
  for (const raw of ["", "{}", "null", "broken", JSON.stringify({ version: 1, diagnostics: true, savedAt: Date.now() + 60000 }),
    JSON.stringify({ version: 1, diagnostics: true, savedAt: Date.now() - 180 * 86400000 })]) {
    assert.equal(consent.parseConsent(raw), null);
  }
});

test("acceptance persists, revocation removes diagnostic storage but preserves readings", () => {
  const { consent, data, window } = harness();
  consent.saveConsent(true);
  assert.equal(consent.diagnosticsAllowed(), true);
  data.set("pdu_telemetry_id", "old"); data.set("pdu_site_event_rate", "old"); data.set("pdu_active_reading", "private");
  window.__pduLastAction = "old action";
  consent.saveConsent(false);
  assert.equal(consent.diagnosticsAllowed(), false);
  assert.equal(data.has("pdu_telemetry_id"), false);
  assert.equal(data.has("pdu_site_event_rate"), false);
  assert.equal(window.__pduLastAction, undefined);
  assert.equal(data.get("pdu_active_reading"), "private");
});

test("blocked storage supports a session choice and cross-tab changes refresh consent", () => {
  const { consent, window, data } = harness();
  consent.subscribeConsent(() => {});
  consent.saveConsent(true);
  data.set(consent.CONSENT_KEY, JSON.stringify({ version: 1, diagnostics: false, savedAt: Date.now() }));
  window.dispatchEvent(new Event("storage"));
  assert.equal(consent.diagnosticsAllowed(), false);
  window.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  consent.saveConsent(true);
  assert.equal(consent.diagnosticsAllowed(), true);
  consent.saveConsent(false);
  assert.equal(consent.diagnosticsAllowed(), false);
});

test("event calls before consent and after revocation never read context, allocate IDs or send", () => {
  const { consent, window } = harness();
  const events = load(eventsSource, { window, require: () => consent });
  // Missing browser transport/DOM mocks deliberately throw if normalization or sending runs.
  assert.doesNotThrow(() => events.recordSiteEvent({ eventType: "private-test" }));
  consent.saveConsent(true);
  consent.saveConsent(false);
  assert.doesNotThrow(() => events.recordSiteEvent({ eventType: "private-test" }));
});

test("consent permits a real telemetry submission and revocation stops subsequent submissions", () => {
  const { consent, window } = harness();
  Object.assign(window, { location: { pathname: "/privacidade", search: "", hash: "" },
    innerWidth: 390, innerHeight: 844, scrollX: 0, scrollY: 0, screen: {} });
  let submissions = 0;
  const events = load(eventsSource, { window, require: () => consent, Blob,
    document: { documentElement: { lang: "pt-BR", scrollHeight: 1000 } },
    navigator: { sendBeacon: () => { submissions++; return true; } } });
  events.recordSiteEvent({ eventType: "test" });
  assert.equal(submissions, 0);
  consent.saveConsent(true);
  events.recordSiteEvent({ eventType: "test" });
  assert.equal(submissions, 1);
  consent.saveConsent(false);
  events.recordSiteEvent({ eventType: "test" });
  assert.equal(submissions, 1);
});
