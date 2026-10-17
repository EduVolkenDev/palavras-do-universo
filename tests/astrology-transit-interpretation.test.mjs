import assert from "node:assert/strict";
import test from "node:test";
import { getDailyTransitInterpretation, getPlanetAspectReading } from "../src/lib/astrology/transit-interpretation.ts";

const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const aspects = ["conjunction", "sextile", "square", "trine", "opposition"];
const transit = (transitBody, natalBody, overrides = {}) => ({
  transitBody, natalBody, type: "trine", tone: "supportive", orb: 1.1,
  transitSign: "leo", natalSign: "sagittarius", natalHouse: 12, ...overrides,
});

test("every calculated planet pair and major aspect has complete PT/EN editorial content", () => {
  for (const locale of ["pt-BR", "en"]) {
    for (const type of aspects) {
      const uniquePairs = new Set();
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i; j < bodies.length; j++) {
          const direct = getPlanetAspectReading(bodies[i], bodies[j], type, locale);
          assert.ok(direct.description.length > 80, `${bodies[i]}/${bodies[j]}/${type}/${locale}`);
          assert.ok(direct.practice.length > 40);
          assert.ok(direct.aspectMeaning.length > 80);
          assert.doesNotMatch(direct.description, /symbolic opening between|Uma abertura simbólica entre|trabalhar esse tema com intenção|\.\.\.|…/);
          uniquePairs.add(direct.description);
          assert.deepEqual(getPlanetAspectReading(bodies[j], bodies[i], type, locale), direct);
        }
      }
      assert.equal(uniquePairs.size, 55, `${type}/${locale} must not reuse a generic description across pairs`);
    }
  }
});

test("the six relationships in the reported screenshot explain different lived themes and actions", () => {
  const inputs = [
    transit("Jupiter", "Sun"), transit("Jupiter", "Mercury"),
    transit("Neptune", "Jupiter", { transitSign: "aries" }),
    transit("Venus", "Saturn", { transitSign: "scorpio", natalSign: "pisces", natalHouse: 3 }),
    transit("Moon", "Moon", { transitSign: "capricorn", natalSign: "taurus", natalHouse: 5 }),
    transit("Moon", "Mars", { transitSign: "capricorn", natalSign: "virgo", natalHouse: 9 }),
  ];
  for (const locale of ["pt-BR", "en"]) {
    const readings = inputs.map(input => getDailyTransitInterpretation(input, locale));
    assert.equal(new Set(readings.map(reading => reading.description)).size, inputs.length);
    assert.equal(new Set(readings.map(reading => reading.practice)).size, inputs.length);
    assert.match(readings[0].description, locale === "en" ? /confidence/ : /confiança/);
    assert.match(readings[1].description, locale === "en" ? /studying|learning/ : /estudar|aprendizagem/);
    assert.match(readings[2].description, locale === "en" ? /imagination/ : /imaginação/);
    assert.match(readings[3].description, locale === "en" ? /commitment/ : /compromisso/);
    assert.match(readings[4].description, locale === "en" ? /emotional rhythm/ : /ritmo emocional/);
    assert.match(readings[5].description, locale === "en" ? /boundar/ : /limite/);
  }
});

test("aspect geometry determines the reading rather than the coarse UI tone", () => {
  const readings = aspects.map(type => getDailyTransitInterpretation(transit("Jupiter", "Sun", { type }), "pt-BR"));
  assert.equal(new Set(readings.map(reading => reading.aspectMeaning)).size, 5);
  assert.match(readings[0].aspectMeaning, /conjunção/);
  assert.match(readings[1].aspectMeaning, /60°/);
  assert.match(readings[2].aspectMeaning, /90°/);
  assert.match(readings[3].aspectMeaning, /120°/);
  assert.match(readings[4].aspectMeaning, /180°/);
  assert.notEqual(readings[2].description, readings[3].description);
  const lunarReturn = getDailyTransitInterpretation(transit("Moon", "Moon", { type: "conjunction" }), "en");
  assert.equal(lunarReturn.isReturn, true);
  assert.match(lunarReturn.aspectMeaning, /planetary return/);
  assert.equal(getDailyTransitInterpretation(transit("Moon", "Moon"), "en").isReturn, false);
});

test("the moving and natal roles, signs and actual natal house remain distinct", () => {
  const forward = getDailyTransitInterpretation(transit("Jupiter", "Saturn"), "pt-BR");
  const reverse = getDailyTransitInterpretation(transit("Saturn", "Jupiter"), "pt-BR");
  assert.notEqual(forward.roles, reverse.roles);
  assert.notEqual(forward.description, reverse.description);
  assert.match(forward.roles, /^Júpiter é o planeta em trânsito/);
  assert.match(reverse.roles, /^Saturno é o planeta em trânsito/);
  assert.match(forward.signContext, /Leão/);
  assert.match(forward.signContext, /Sagitário/);
  for (let house = 1; house <= 12; house++) {
    assert.match(getDailyTransitInterpretation(transit("Jupiter", "Sun", { natalHouse: house }), "en").houseContext, new RegExp(`House ${house}\\b`, "i"));
  }
  for (const natalHouse of [null, 0, 13]) {
    const reading = getDailyTransitInterpretation(transit("Jupiter", "Sun", { natalHouse }), "pt-BR");
    assert.equal(reading.houseContext, null);
    assert.doesNotMatch(reading.detail, /casa/);
  }
});

test("all 100 directed encounters have distinct visible explanations in each language and aspect", () => {
  for (const locale of ["pt-BR", "en"]) for (const type of aspects) {
    const descriptions = bodies.flatMap(moving => bodies.map(natal =>
      getDailyTransitInterpretation(transit(moving, natal, { type }), locale).description
    ));
    assert.equal(new Set(descriptions).size, 100, `${locale}/${type} reused a description for different planetary roles`);
  }
});
