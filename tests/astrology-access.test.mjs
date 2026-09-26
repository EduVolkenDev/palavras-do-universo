import assert from "node:assert/strict";
import test from "node:test";
import { chartForAstrologyAccess } from "../src/lib/astrology/chart-access.ts";

test("free astrology response keeps the first layer without paid planetary placements", () => {
  const chart = {
    calculatedAtISO: "2026-09-26T00:00:00.000Z",
    timezone: "Europe/London",
    locationLabel: "London",
    timePrecision: "exact",
    houseSystem: "whole-sign",
    ascendant: { longitude: 14, sign: "aries", degreesInSign: 14 },
    positions: [
      { body: "Sun", longitude: 12, sign: "aries", degreesInSign: 12, house: 1 },
      { body: "Moon", longitude: 55, sign: "taurus", degreesInSign: 25, house: 2 },
      { body: "Mars", longitude: 122, sign: "leo", degreesInSign: 2, house: 5 },
    ],
    aspects: [{ id: "sun-mars", firstBody: "Sun", secondBody: "Mars", type: "trine", exactAngle: 120, orb: 1 }],
    limitations: [],
  };

  const preview = chartForAstrologyAccess(chart, false);
  assert.deepEqual(preview.positions.map(({ body, sign, house }) => ({ body, sign, house })), [
    { body: "Sun", sign: "aries", house: null },
    { body: "Moon", sign: "taurus", house: null },
  ]);
  assert.deepEqual(preview.aspects, []);
  assert.equal(chartForAstrologyAccess(chart, true), chart);
  assert.equal(chart.positions[0].house, 1);
});
