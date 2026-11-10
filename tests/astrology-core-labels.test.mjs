import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Ascendant card names the chart angle, not its zodiac placement", () => {
  const source = readFileSync(new URL("../src/components/astrology/AstrologyChartExperience.tsx", import.meta.url), "utf8");
  const card = source.split('\n').find((line) => line.includes('<CoreCard bodyKey="Ascendant"'));
  assert.ok(card);
  assert.match(card, /title=\{isEnglish \? "Ascendant" : "Ascendente"\}/);
  assert.match(card, /placement=\{\{ sign: ascendant.sign/);
  assert.doesNotMatch(source, /title=\{ascendantLabel\}/);
});
