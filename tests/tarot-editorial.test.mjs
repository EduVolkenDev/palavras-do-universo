import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { TAROT_CARD_CATALOG } from "../src/lib/tarot/cardCatalog.ts";
import { TAROT_EDITORIAL, getTarotEditorial } from "../src/lib/tarot/editorial/index.ts";

const fields = ["artwork", "upright", "reversed", "example", "comparison"];

test("all 78 cards have their own complete bilingual editorial entry and an existing artwork", () => {
  assert.equal(TAROT_CARD_CATALOG.length, 78);
  assert.deepEqual(Object.keys(TAROT_EDITORIAL).sort(), TAROT_CARD_CATALOG.map(card => card.key).sort());
  for (const card of TAROT_CARD_CATALOG) {
    const entry = getTarotEditorial(card.key);
    assert.ok(entry, card.key);
    assert.ok(existsSync(new URL(`../public${card.assetPath}`, import.meta.url)), card.assetPath);
    for (const language of ["pt", "en"]) {
      assert.deepEqual(Object.keys(entry[language]).sort(), [...fields].sort());
      for (const field of fields) {
        const text = entry[language][field];
        assert.ok(text.trim(), `${card.key}/${language}/${field}`);
        assert.ok((text.match(/[.!?](?:\s|$)/g) ?? []).length >= 2, `${card.key}/${language}/${field} needs explanation, not a keyword label`);
        assert.doesNotMatch(text, /TODO|Lorem ipsum|\.\.\.|\{\{|undefined/);
        assert.notEqual(text, entry[language === "pt" ? "en" : "pt"][field]);
      }
    }
  }
});

test("no card borrows another card's symbol reading, positions, example or comparison", () => {
  for (const language of ["pt", "en"]) for (const field of fields) {
    const passages = Object.values(TAROT_EDITORIAL).map(entry => entry[language][field]);
    assert.equal(new Set(passages).size, 78, `${language}/${field} reused editorial copy`);
  }
});

test("every comparison links to a different real card rather than an orphan or itself", () => {
  for (const [key, entry] of Object.entries(TAROT_EDITORIAL)) {
    assert.notEqual(entry.relatedKey, key);
    assert.ok(getTarotEditorial(entry.relatedKey), `${key} -> ${entry.relatedKey}`);
    assert.ok(TAROT_CARD_CATALOG.some(card => card.key === entry.relatedKey));
  }
  for (const missing of ["missing", "__proto__", "constructor", "toString"]) {
    assert.equal(getTarotEditorial(missing), null);
  }
});

test("visual interpretations refer to the actual feline deck, not substituted human figures", () => {
  assert.match(TAROT_EDITORIAL["major-00-the-fool"].pt.artwork, /borda de pedra/);
  assert.match(TAROT_EDITORIAL["major-02-the-high-priestess"].pt.artwork, /pergaminho/);
  assert.match(TAROT_EDITORIAL["major-08-strength"].en.artwork, /blue feline/);
  assert.match(TAROT_EDITORIAL["major-12-the-hanged-man"].en.artwork, /upside down/);
  assert.match(TAROT_EDITORIAL["cups-five"].en.artwork, /fallen cups/);
  assert.match(TAROT_EDITORIAL["swords-six"].en.artwork, /boat/);
  assert.match(TAROT_EDITORIAL["wands-ten"].pt.artwork, /feixe de bastões/);
  assert.match(TAROT_EDITORIAL["pentacles-eight"].pt.artwork, /mesa/);
});

test("sensitive cards explicitly avoid literal predictions and accusations", () => {
  assert.match(TAROT_EDITORIAL["major-13-death"].pt.upright, /não de previsão de morte física/);
  assert.match(TAROT_EDITORIAL["major-15-the-devil"].pt.artwork, /não comprova entidades/);
  assert.match(TAROT_EDITORIAL["major-18-the-moon"].en.upright, /does not confirm deception/);
  assert.match(TAROT_EDITORIAL["swords-seven"].en.artwork, /cannot identify a liar/);
  assert.match(TAROT_EDITORIAL["swords-nine"].en.upright, /nor a diagnosis/);
  assert.match(TAROT_EDITORIAL["pentacles-seven"].en.reversed, /predicts no financial return/);
});

test("the page uses descriptive H2s, honest attribution and separate styles", () => {
  const component = readFileSync(new URL("../src/components/tarot/TarotCardMeaningContent.tsx", import.meta.url), "utf8");
  for (const section of ["arte", "direta", "reversa", "exemplo", "comparacao"]) {
    assert.ok(component.includes(`id="${section}"`));
    assert.ok(component.includes(`<h2 id="${section}-titulo"`));
    assert.ok(component.includes(`href="#${section}"`));
  }
  assert.match(component, /Human review of this version has not yet been recorded/);
  assert.match(component, /AI-assisted writing/);
  assert.match(component, /data-i18n-ignore/);
  assert.match(component, /TarotCardMeaningContent\.module\.css/);
  assert.doesNotMatch(component, /style=\{|<style/);
  assert.match(component, /href=\{`\/significados\/tarot\/\$\{related.key\}`\}/);
});

test("only the current card's editorial travels from the server to the client", () => {
  const route = readFileSync(new URL("../src/app/significados/tarot/[slug]/page.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/tarot/TarotCardMeaningContent.tsx", import.meta.url), "utf8");
  assert.match(route, /getTarotEditorial\(slug\)/);
  assert.match(route, /editorial=\{editorial\}/);
  assert.match(component, /import type \{ TarotCardEditorial \}/);
  assert.doesNotMatch(component, /import \{.*(?:TAROT_EDITORIAL|getTarotEditorial)/);
});

test("live translation respects the bilingual editorial boundary even for descendant mutations", () => {
  const provider = readFileSync(new URL("../src/components/I18nProvider.tsx", import.meta.url), "utf8");
  const guard = provider.indexOf('element?.closest("[data-i18n-ignore]")');
  const textBranch = provider.indexOf("if (node.nodeType === Node.TEXT_NODE)");
  assert.ok(guard > 0 && guard < textBranch, "text nodes must check ignored ancestors before translation");
  assert.match(provider, /node instanceof Element \? node : node.parentElement/);
});
