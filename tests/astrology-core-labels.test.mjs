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

test("sky navigation is handled before an active tarot reading or AI generation", () => {
  const persona = readFileSync(new URL("../src/lib/lume/persona.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/app/api/lume/route.ts", import.meta.url), "utf8");
  assert.match(persona, /href: "\/astrologia\/mapa#daily-sky-title"/);
  assert.ok(persona.indexOf("if (astrologyNavigation) return astrologyNavigation") < persona.indexOf("if (activeReading && asksAboutActiveReading"));
  assert.ok(route.indexOf('source: "navigation"') < route.indexOf("const system ="));
});
