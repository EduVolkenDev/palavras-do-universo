import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateDailySky, calculateDailyTransits } from "../src/lib/astrology/daily-sky.ts";
import { calculatePlanetPositionsAt } from "../src/lib/astrology/natal-chart.ts";
import { describePlanetRulership, getPlanetRulership } from "../src/lib/astrology/rulership.ts";

test("rulership identifies classical and modern rulers without erasing the traditional ones", () => {
  assert.deepEqual(getPlanetRulership("Mercury").primary, ["gemini", "virgo"]);
  assert.deepEqual(getPlanetRulership("Pluto").primary, ["scorpio"]);
  assert.deepEqual(getPlanetRulership("Mars").traditional, ["scorpio"]);
  assert.match(describePlanetRulership("Mars", "pt-BR"), /Escorpião/);
});

test("daily transit aspects distinguish support, tension, and amplification across the zodiac seam", () => {
  const natal = [{ body: "Sun", longitude: 359, sign: "pisces", degreesInSign: 29, house: 1 }];
  const today = [
    { body: "Moon", longitude: 1, sign: "aries", degreesInSign: 1, house: null },
    { body: "Venus", longitude: 119, sign: "cancer", degreesInSign: 29, house: null },
    { body: "Mars", longitude: 89, sign: "gemini", degreesInSign: 29, house: null },
  ];
  const hits = calculateDailyTransits(today, natal);
  assert.deepEqual(hits.map(({ type, tone }) => ({ type, tone })), [
    { type: "square", tone: "attention" },
    { type: "trine", tone: "supportive" },
    { type: "conjunction", tone: "intensified" },
  ]);
});

test("daily sky follows local calendar and withholds transits without Circle access, even when natal positions exist", () => {
  const now = new Date("2026-09-26T23:30:00.000Z");
  const natalPositions = calculatePlanetPositionsAt(now);
  const free = calculateDailySky(natalPositions, now, "Europe/London", false);
  const paid = calculateDailySky(natalPositions, now, "Europe/London", true);
  assert.equal(free.localDate, "2026-09-27");
  assert.equal(free.snapshotAtISO, now.toISOString());
  assert.equal(free.positions.length, 10);
  assert.deepEqual(free.transits, []);
  assert.equal(free.access, "preview");
  assert.ok(paid.transits.length > 0);
  assert.equal(paid.access, "circle");
});

test("daily route checks the Circle entitlement, not the one-time map entitlement", () => {
  const route = readFileSync(new URL("../src/app/api/astrology/daily/route.ts", import.meta.url), "utf8");
  const access = readFileSync(new URL("../src/lib/astrology/server-access.ts", import.meta.url), "utf8");
  assert.match(route, /hasCircleAstrologyAccess\(auth\.user\)/);
  assert.doesNotMatch(route, /hasFullAstrologyAccess/);
  assert.match(access, /productKey: CIRCLE_PRODUCT_KEY/);
});
