import fs from "node:fs";

const dailyPath = "src/lib/daily/message.ts";
const oraclePath = "src/lib/i18n/oracle.ts";
const contentPath = "src/lib/i18n/oracle-content.ts";
const guidesPath = "src/lib/tarot/card-guides.ts";

const dailySource = fs.readFileSync(dailyPath, "utf8");
const oracleSource = fs.readFileSync(oraclePath, "utf8");
const contentSource = fs.readFileSync(contentPath, "utf8");
const guidesSource = fs.readFileSync(guidesPath, "utf8");

function unique(values) {
  return [...new Set(values)];
}

function quotedLineValues(source) {
  return [...source.matchAll(/^\s+"([^"\\]*(?:\\.[^"\\]*)*)",\s*$/gm)].map(
    (match) => match[1]
  );
}

const dailyCatalog = dailySource.slice(0, dailySource.indexOf("function pickThemePart"));
const dailyTextKeys = unique(quotedLineValues(dailyCatalog));
const dailyTranslationsBlock = contentSource.slice(
  contentSource.indexOf("export const DAILY_TEXT_TRANSLATIONS"),
  contentSource.indexOf("export const CARD_ENGLISH_MEANINGS")
);
const translatedDailyRawKeys = [
  ...dailyTranslationsBlock.matchAll(/^\s+"([^"\\]*(?:\\.[^"\\]*)*)":\s*$/gm),
].map((match) => match[1]);
const translatedDailyKeys = unique(translatedDailyRawKeys);

const cardTranslationsBlock = contentSource.slice(
  contentSource.indexOf("export const CARD_ENGLISH_MEANINGS"),
  contentSource.indexOf("export function translateDailyOracleText")
);
const translatedCardRawKeys = [
  ...cardTranslationsBlock.matchAll(/^\s+"([^"]+)":\s*\{/gm),
].map((match) => match[1]);
const translatedCardKeys = unique(translatedCardRawKeys);
const majorKeys = [
  "major-00-the-fool",
  "major-01-the-magician",
  "major-02-the-high-priestess",
  "major-03-the-empress",
  "major-04-the-emperor",
  "major-05-the-hierophant",
  "major-06-the-lovers",
  "major-07-the-chariot",
  "major-08-strength",
  "major-09-the-hermit",
  "major-10-wheel-of-fortune",
  "major-11-justice",
  "major-12-the-hanged-man",
  "major-13-death",
  "major-14-temperance",
  "major-15-the-devil",
  "major-16-the-tower",
  "major-17-the-star",
  "major-18-the-moon",
  "major-19-the-sun",
  "major-20-judgement",
  "major-21-the-world",
];
const minorRanks = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "page",
  "knight",
  "queen",
  "king",
];
const cardKeys = majorKeys.concat(
  ["wands", "cups", "swords", "pentacles"].flatMap((suit) =>
    minorRanks.map((rank) => `${suit}-${rank}`)
  )
);

const missingDaily = dailyTextKeys.filter((key) => !translatedDailyKeys.includes(key));
const missingCards = cardKeys.filter((key) => !translatedCardKeys.includes(key));
const duplicateDaily = translatedDailyRawKeys.length !== translatedDailyKeys.length;
const duplicateCards = translatedCardRawKeys.length !== translatedCardKeys.length;
const legacyDailyFallback = [
  "Something within you is asking for attention without urgency",
  "Choose one small action that puts this message into practice today",
  "Take three slow breaths, write down one honest sentence",
].some((text) => oracleSource.includes(text));
const guidesBlock = guidesSource.slice(
  guidesSource.indexOf("export const CARD_GUIDES"),
  guidesSource.indexOf("export function getCardGuide")
);
const guideEntries = [...guidesBlock.matchAll(/^\s+"([^"]+)": \{\s*$/gm)];
const guideKeys = guideEntries.map((match) => match[1]);
const missingGuides = cardKeys.filter((key) => !guideKeys.includes(key));
const incompleteGuides = guideEntries.flatMap((match, index) => {
  const nextStart = guideEntries[index + 1]?.index ?? guidesBlock.length;
  const entry = guidesBlock.slice(match.index, nextStart);
  const key = match[1];
  return entry.match(/\bpt:\s*\{/)
    && entry.match(/\ben:\s*\{/)
    && (entry.match(/^\s+core:/gm) ?? []).length === 2
    && (entry.match(/^\s+question:/gm) ?? []).length === 2
    ? []
    : [key];
});

if (
  missingDaily.length ||
  missingCards.length ||
  duplicateDaily ||
  duplicateCards ||
  legacyDailyFallback ||
  missingGuides.length ||
  incompleteGuides.length
) {
  console.error(
    JSON.stringify(
      {
        dailySource: dailyTextKeys.length,
        dailyTranslations: translatedDailyKeys.length,
        missingDaily,
        cards: cardKeys.length,
        cardTranslations: translatedCardKeys.length,
        missingCards,
        duplicateDaily,
        duplicateCards,
        legacyDailyFallback,
        guides: guideKeys.length,
        missingGuides,
        incompleteGuides,
      },
      null,
      2
    )
  );
  process.exit(1);
}

if (!contentSource.includes("Canonical oracle translations")) {
  console.error("Canonical oracle translation header is missing.");
  process.exit(1);
}

console.log(
  `Oracle locale coverage OK: ${dailyTextKeys.length} daily texts, ${cardKeys.length} cards, and ${guideKeys.length} human card guides.`
);
