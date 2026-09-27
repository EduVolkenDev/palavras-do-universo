import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dailyTransitId, parseDailyReadingContent, selectDailyReadingTransits } from "../src/lib/astrology/daily-reading.ts";
import { dailyReadingCacheKey, getOrGenerateDailyReading } from "../src/lib/astrology/daily-reading-service.ts";
import { calculateDailySky } from "../src/lib/astrology/daily-sky.ts";

const position = { body: "Sun", sign: "aries", longitude: 10, degreesInSign: 10, house: 1 };
const input = {
  userId: "user-one", locale: "pt-BR",
  chart: { calculatedAtISO: "1990-01-01T12:00:00.000Z", timezone: "Europe/London", locationLabel: "London", timePrecision: "exact", houseSystem: "whole-sign", ascendant: null, positions: [position], aspects: [], limitations: [] },
  sky: { access: "circle", localDate: "2026-09-27", timezone: "Europe/London", snapshotAtISO: "2026-09-27T10:00:00.000Z", positions: [position], transits: [
    { transitBody: "Moon", natalBody: "Sun", type: "trine", transitSign: "leo", natalSign: "aries", natalHouse: 1, orb: 1, tone: "supportive" },
    { transitBody: "Mars", natalBody: "Sun", type: "square", transitSign: "cancer", natalSign: "aries", natalHouse: 1, orb: 1, tone: "attention" },
  ] },
};
const answer = (data = input) => JSON.stringify({
  overview: "O céu de hoje oferece uma leitura simbólica das relações calculadas com seu mapa. Observe essas possibilidades sem transformar um aspecto em destino.",
  influences: selectDailyReadingTransits(data.sky).map((transit) => ({ transitId: dailyTransitId(transit), text: "Observe como esse encontro pode aparecer no seu ritmo e escolha um gesto possível, sem concluir que um acontecimento está garantido." })),
  nextStep: "Escolha uma conversa pequena que você pode conduzir com atenção e reserve alguns minutos para ouvir antes de responder.",
});
function memoryStore() {
  const rows = new Map();
  let allowed = true;
  let saves = 0;
  const store = {
    async read(key) { return rows.get(key)?.reading ?? null; },
    async claim(key, token) { if (rows.has(key)) return false; rows.set(key, { token, status: "processing" }); return true; },
    async allowGeneration() { return allowed; },
    async complete(key, token, reading) { const row = rows.get(key); if (row?.token !== token) return false; rows.set(key, { reading, status: "ready" }); saves++; return true; },
    async fail(key, token) { if (rows.get(key)?.token === token) rows.set(key, { status: "failed" }); },
    async retryAfter(key) { return rows.get(key)?.status === "failed" ? 300 : 4; },
  };
  return { store, rows, setAllowed: (value) => { allowed = value; }, get saves() { return saves; } };
}

test("daily cache isolates user, locale, time zone, calendar and natal changes but ignores refreshed sky timestamps", () => {
  const key = dailyReadingCacheKey(input);
  assert.equal(key.length, 64);
  assert.equal(key, dailyReadingCacheKey({ ...input, sky: { ...input.sky, snapshotAtISO: "2026-09-27T12:00:00.000Z", positions: [] } }));
  for (const altered of [
    { ...input, userId: "user-two" }, { ...input, locale: "en" },
    { ...input, sky: { ...input.sky, localDate: "2026-09-28" } },
    { ...input, sky: { ...input.sky, timezone: "America/Sao_Paulo" } },
    { ...input, chart: { ...input.chart, timePrecision: "unknown" } },
    { ...input, chart: { ...input.chart, positions: [{ ...position, longitude: 12 }] } },
  ]) assert.notEqual(key, dailyReadingCacheKey(altered));
  const instant = new Date("2026-09-27T23:30:00.000Z");
  assert.equal(calculateDailySky([], instant, "Europe/London", true).localDate, "2026-09-28");
  assert.equal(calculateDailySky([], instant, "America/Sao_Paulo", true).localDate, "2026-09-27");
});

test("Lume output must explain supplied computed transits exactly once without invented references", () => {
  assert.equal(parseDailyReadingContent(answer(), input.sky).influences.length, 2);
  for (const change of [
    (content) => { content.influences[0].transitId = "invented-retrograde"; },
    (content) => { content.influences[1].transitId = content.influences[0].transitId; },
    (content) => { content.influences.pop(); },
    (content) => { content.overview = ""; },
    (content) => { content.influences[0].text = "https://untrusted.example"; },
  ]) { const content = JSON.parse(answer()); change(content); assert.throws(() => parseDailyReadingContent(JSON.stringify(content), input.sky)); }
});

test("no calculated transits yields an honest empty influence array, not fictional aspects", () => {
  const noTransits = { ...input, sky: { ...input.sky, transits: [] } };
  assert.deepEqual(parseDailyReadingContent(answer(noTransits), noTransits.sky).influences, []);
  assert.throws(() => parseDailyReadingContent(answer(), noTransits.sky));
});

test("a saved daily response is reused after reload without another provider call", async () => {
  const memory = memoryStore(); let calls = 0;
  const dependencies = { store: memory.store, generate: async () => { calls++; return answer(); } };
  const first = await getOrGenerateDailyReading(input, dependencies);
  const second = await getOrGenerateDailyReading(input, dependencies);
  assert.equal(first.status, "ready"); assert.deepEqual(first, second);
  assert.equal(first.reading.natalTimePrecision, "exact");
  assert.equal(calls, 1); assert.equal(memory.saves, 1);
});

test("concurrent requests share one claim and never race to generate two daily interpretations", async () => {
  const memory = memoryStore(); let finish;
  const generation = new Promise((resolve) => { finish = resolve; }); let calls = 0;
  const dependencies = { store: memory.store, generate: async () => { calls++; return generation; } };
  const first = getOrGenerateDailyReading(input, dependencies);
  await new Promise((resolve) => setImmediate(resolve));
  const other = await getOrGenerateDailyReading(input, dependencies);
  assert.equal(other.status, "pending"); assert.equal(calls, 1);
  finish(answer()); assert.equal((await first).status, "ready");
  assert.equal((await getOrGenerateDailyReading(input, dependencies)).status, "ready");
  assert.equal(calls, 1);
});

test("a provider failure is not saved or disguised as a successful AI reading and respects backoff", async () => {
  const memory = memoryStore(); let calls = 0;
  const dependencies = { store: memory.store, generate: async () => { calls++; throw new Error("Provider down"); } };
  const result = await getOrGenerateDailyReading(input, dependencies);
  assert.deepEqual(result, { status: "unavailable", retryAfterSeconds: 300 });
  assert.deepEqual(await getOrGenerateDailyReading(input, dependencies), result);
  assert.equal(calls, 1); assert.equal(memory.saves, 0);
});

test("malformed output, exhausted cost budget and persistence failure cannot deliver an unsaved reading", async () => {
  const malformed = memoryStore();
  assert.equal((await getOrGenerateDailyReading(input, { store: malformed.store, generate: async () => "not JSON" })).status, "unavailable");
  const budget = memoryStore(); budget.setAllowed(false); let calls = 0;
  assert.equal((await getOrGenerateDailyReading(input, { store: budget.store, generate: async () => { calls++; return answer(); } })).status, "unavailable");
  assert.equal(calls, 0);
  const persistence = memoryStore(); persistence.store.complete = async () => { throw new Error("Database down"); };
  assert.equal((await getOrGenerateDailyReading(input, { store: persistence.store, generate: async () => answer() })).status, "unavailable");
  assert.equal(persistence.saves, 0);
});

test("an expired lease or superseded worker cannot return its own unsaved answer", async () => {
  const memory = memoryStore(); memory.store.complete = async () => false;
  assert.equal((await getOrGenerateDailyReading(input, { store: memory.store, generate: async () => answer() })).status, "pending");
  assert.equal(memory.saves, 0);
});

test("a preview is rejected before cache reads or generation", async () => {
  let touched = false;
  await assert.rejects(getOrGenerateDailyReading({ ...input, sky: { ...input.sky, access: "preview" } }, { store: { read: async () => { touched = true; } }, generate: async () => { touched = true; } }), /Circle/);
  assert.equal(touched, false);
});

test("server route gates cached output and generated output, never accepts a client natal chart, and keeps private persistence", () => {
  const route = readFileSync(new URL("../src/app/api/astrology/daily/reading/route.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20260927090000_lume_astrology_daily_readings.sql", import.meta.url), "utf8");
  assert.equal((route.match(/hasCircleAstrologyAccess\(auth.user\)/g) ?? []).length, 2);
  assert.ok(route.indexOf("hasCircleAstrologyAccess(auth.user)") < route.indexOf("getOrGenerateDailyReading(input"));
  assert.match(route, /readAstrologyBirthData\(supabase, auth.user.id\)/);
  assert.match(route, /private, no-store/);
  assert.match(migration, /references public.astrology_birth_profiles\(user_id\) on delete cascade/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /from public, anon, authenticated/);
  assert.match(migration, /attempt_count < 3/);
});
