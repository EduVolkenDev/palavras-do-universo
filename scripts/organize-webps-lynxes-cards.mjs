import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const sourceDir = resolve(
  process.argv[2] ?? "/Users/eduardovolken_1/Downloads/webps lynxes cards"
);

const repeatDir = join(sourceDir, "_repetidas");
const nonCardDir = join(sourceDir, "_nao-cartas");
const reviewDir = join(sourceDir, "_revisar");
const auditDir = join(sourceDir, "_audit");

const ranks = [
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

const expectedStandard = [
  ...[
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
  ],
  ...["wands", "cups", "swords", "pentacles"].flatMap((suit) =>
    ranks.map((rank) => `${suit}-${rank}`)
  ),
];

const selected = [
  ["olouco2", "major-00-the-fool.webp"],
  ["OMAGO3", "major-01-the-magician.webp"],
  ["ASACERDOTISA", "major-02-the-high-priestess.webp"],
  ["III-AIMOERATRIZ", "major-03-the-empress.webp"],
  ["OIMPERADOR", "major-04-the-emperor.webp"],
  ["VI-OHIEROFANTE", "major-05-the-hierophant.webp"],
  ["AMORES-AMANTES1", "major-06-the-lovers.webp"],
  ["OCARRO3", "major-07-the-chariot.webp"],
  ["XI-AFORCA", "major-08-strength.webp"],
  ["OERMITAO", "major-09-the-hermit.webp"],
  ["ARODADAFORTUNA", "major-10-wheel-of-fortune.webp"],
  ["AJUSTICA", "major-11-justice.webp"],
  ["OENFORCADO", "major-12-the-hanged-man.webp"],
  ["AMORTE2", "major-13-death.webp"],
  ["ATEMPERANCA", "major-14-temperance.webp"],
  ["ODIABO", "major-15-the-devil.webp"],
  ["ATORRE", "major-16-the-tower.webp"],
  ["AESTRELA", "major-17-the-star.webp"],
  ["ALUA2", "major-18-the-moon.webp"],
  ["OSOL", "major-19-the-sun.webp"],
  ["OJULGAMENTO", "major-20-judgement.webp"],
  ["OMUNDO", "major-21-the-world.webp"],
  ["ASDEPAUS", "wands-ace.webp"],
  ["2DEPAUS", "wands-two.webp"],
  ["3DEPAUS", "wands-three.webp"],
  ["4DEPAUS", "wands-four.webp"],
  ["5DEPAUS", "wands-five.webp"],
  ["6DEPAUS", "wands-six.webp"],
  ["7DEPAUS", "wands-seven.webp"],
  ["8DEPAUS", "wands-eight.webp"],
  ["9DEPAUS", "wands-nine.webp"],
  ["10DEPAUS", "wands-ten.webp"],
  ["PAJEMDEPAUS", "wands-page.webp"],
  ["CAVALEIRODEPAUS", "wands-knight.webp"],
  ["RAINHADEPAUS", "wands-queen.webp"],
  ["REIDEPAUS", "wands-king.webp"],
  ["ChatGPT Image May 10, 2026, 12_15_11 AM (1)", "pentacles-two.webp"],
  ["ChatGPT Image May 10, 2026, 12_15_11 AM (2)", "pentacles-three.webp"],
  ["ChatGPT Image May 10, 2026, 12_15_11 AM (3)", "pentacles-four.webp"],
  ["ChatGPT Image May 10, 2026, 12_15_12 AM (4)", "pentacles-five.webp"],
  ["ChatGPT Image May 10, 2026, 12_15_12 AM (5)", "pentacles-six.webp"],
  ["ChatGPT Image May 10, 2026, 12_25_21 AM (1)", "pentacles-seven.webp"],
  ["ChatGPT Image May 10, 2026, 12_25_21 AM (2)", "pentacles-eight.webp"],
  ["ChatGPT Image May 10, 2026, 12_25_22 AM (3)", "pentacles-nine.webp"],
  ["ChatGPT Image May 10, 2026, 12_25_22 AM (4)", "pentacles-ten.webp"],
  ["ChatGPT Image May 10, 2026, 12_25_23 AM (5)", "pentacles-page.webp"],
  ["ChatGPT Image May 10, 2026, 05_41_10 AM (1)", "pentacles-knight.webp"],
  ["ChatGPT Image May 10, 2026, 05_41_12 AM (2)", "pentacles-queen.webp"],
  ["ChatGPT Image May 10, 2026, 05_41_13 AM (3)", "pentacles-king.webp"],
  ["ChatGPT Image May 9, 2026, 08_45_03 PM (5)", "pentacles-ace.webp"],
  ["ChatGPT Image May 10, 2026, 05_41_15 AM (4)", "swords-ace.webp"],
  ["ChatGPT Image May 10, 2026, 05_41_16 AM (5)", "swords-two.webp"],
  ["ChatGPT Image May 10, 2026, 08_03_57 AM (1)", "swords-three.webp"],
  ["ChatGPT Image May 10, 2026, 08_03_58 AM (2)", "swords-four.webp"],
  ["ChatGPT Image May 10, 2026, 08_04_00 AM (3)", "swords-five.webp"],
  ["ChatGPT Image May 10, 2026, 08_04_02 AM (4)", "swords-six.webp"],
  ["ChatGPT Image May 10, 2026, 08_04_04 AM (5)", "swords-seven.webp"],
  ["ChatGPT Image May 10, 2026, 09_26_36 AM (1)", "swords-eight.webp"],
  ["ChatGPT Image May 10, 2026, 09_26_36 AM (2)", "swords-nine.webp"],
  ["ChatGPT Image May 10, 2026, 09_26_36 AM (3)", "swords-ten.webp"],
  ["ChatGPT Image May 10, 2026, 09_26_38 AM (4)", "swords-page.webp"],
  ["ChatGPT Image May 10, 2026, 09_26_38 AM (5)", "swords-knight.webp"],
  ["ChatGPT Image May 9, 2026, 08_04_05 PM (1)", "cups-ace.webp"],
  ["ChatGPT Image May 9, 2026, 08_04_06 PM (2)", "cups-two.webp"],
  ["ChatGPT Image May 9, 2026, 08_04_07 PM (3)", "cups-three.webp"],
  ["ChatGPT Image May 9, 2026, 08_04_07 PM (4)", "cups-four.webp"],
  ["ChatGPT Image May 9, 2026, 08_04_08 PM (5)", "cups-five.webp"],
  ["ChatGPT Image May 9, 2026, 08_27_50 PM (1)", "cups-six.webp"],
  ["ChatGPT Image May 9, 2026, 08_27_51 PM (2)", "cups-seven.webp"],
  ["ChatGPT Image May 9, 2026, 08_27_52 PM (3)", "cups-eight.webp"],
  ["ChatGPT Image May 9, 2026, 08_27_53 PM (4)", "cups-nine.webp"],
  ["ChatGPT Image May 9, 2026, 08_27_54 PM (5)", "cups-ten.webp"],
  ["ChatGPT Image May 9, 2026, 08_44_58 PM (1)", "cups-page.webp"],
  ["ChatGPT Image May 9, 2026, 08_44_59 PM (2)", "cups-knight.webp"],
  ["ChatGPT Image May 9, 2026, 08_44_59 PM (3)", "cups-queen.webp"],
  ["ChatGPT Image May 9, 2026, 08_45_00 PM (4)", "cups-king.webp"],
];

const extras = [
  ["ALUTA1", "extra-a-luta.webp"],
  ["VIII-AACEITACAO", "extra-a-aceitacao.webp"],
  ["X-ACONSCIENCIA", "extra-a-consciencia.webp"],
  ["XI-ONAOEU", "extra-o-nao-eu.webp"],
  ["XIX-ACRIATIVIDADE", "extra-a-criatividade.webp"],
  ["ChatGPT Image May 10, 2026, 09_45_49 AM (2)", "extra-o-despertar.webp"],
  ["ChatGPT Image May 10, 2026, 09_45_50 AM (3)", "extra-o-portal.webp"],
  ["ChatGPT Image May 10, 2026, 09_45_51 AM (4)", "extra-a-cura.webp"],
  ["ChatGPT Image May 10, 2026, 09_45_51 AM (5)", "extra-o-chamado.webp"],
];

const repeated = [
  "olouco1",
  "OMAGO",
  "III-AIMPERATRIZ",
  "IV-OIMPERADOR",
  "IV-OIMPERADOR copy",
  "AMORES-AMANTES",
  "VII-OCARRO",
  "VII-OCARRO2",
  "VIII-AJUSTICA",
  "ALUA",
  "XVIII-ALUA",
  "XIII-AMORTE",
  "XVI-ATORRE",
  "XV-ODIABO",
  "HERMITAO",
  "HERMITA02",
  "ALUTA",
];

const nonCards = ["ChatGPT Image May 10, 2026, 09_45_48 AM (1)"];

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function rootWebps() {
  return readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".webp")
    .map((entry) => entry.name);
}

function uniquePath(dir, fileName) {
  let target = join(dir, fileName);
  if (!existsSync(target)) return target;

  const stem = basename(fileName, extname(fileName));
  const ext = extname(fileName);
  let index = 2;

  while (existsSync(join(dir, `${stem}-${index}${ext}`))) {
    index += 1;
  }

  return join(dir, `${stem}-${index}${ext}`);
}

function findSource(key) {
  const target = normalize(key);
  return rootWebps().find((file) => normalize(basename(file, extname(file))) === target);
}

function moveByKey(key, targetDir, targetName) {
  const sourceName = findSource(key);
  if (!sourceName) {
    const alreadyAtTarget = targetName ? join(targetDir, targetName) : null;
    if (alreadyAtTarget && existsSync(alreadyAtTarget)) return { skipped: true, key };
    const existingInTarget = readdirSync(targetDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .find((entry) => normalize(basename(entry.name, extname(entry.name))) === normalize(key));
    if (existingInTarget) return { skipped: true, key };
    throw new Error(`Source not found: ${key}`);
  }

  const sourcePath = join(sourceDir, sourceName);
  const destinationPath = uniquePath(targetDir, targetName ?? sourceName);
  renameSync(sourcePath, destinationPath);

  return {
    source: sourceName,
    destination: destinationPath,
  };
}

if (!existsSync(sourceDir)) {
  console.error(`Folder not found: ${sourceDir}`);
  process.exit(1);
}

for (const dir of [repeatDir, nonCardDir, reviewDir, auditDir]) {
  mkdirSync(dir, { recursive: true });
}

const moved = {
  selected: [],
  extras: [],
  repeated: [],
  nonCards: [],
  review: [],
};

const keepInRoot = new Set([
  ...expectedStandard.map((key) => `${key}.webp`),
  ...selected.map(([, destination]) => destination),
  ...extras.map(([, destination]) => destination),
]);

for (const [source, destination] of selected) {
  moved.selected.push(moveByKey(source, sourceDir, destination));
}

for (const [source, destination] of extras) {
  moved.extras.push(moveByKey(source, sourceDir, destination));
}

for (const source of repeated) {
  moved.repeated.push(moveByKey(source, repeatDir));
}

for (const source of nonCards) {
  moved.nonCards.push(moveByKey(source, nonCardDir));
}

for (const leftover of rootWebps().filter((file) => !keepInRoot.has(file))) {
  const sourcePath = join(sourceDir, leftover);
  const destinationPath = uniquePath(reviewDir, leftover);
  renameSync(sourcePath, destinationPath);
  moved.review.push({ source: leftover, destination: destinationPath });
}

const finalRoot = rootWebps();
const finalStandard = finalRoot.filter((file) =>
  expectedStandard.includes(basename(file, extname(file)))
);
const finalExtras = finalRoot.filter((file) => basename(file).startsWith("extra-"));
const missingStandard = expectedStandard
  .map((key) => `${key}.webp`)
  .filter((file) => !finalRoot.includes(file));

const report = {
  sourceDir,
  finalRootCards: finalRoot.length,
  standardTarotCards: finalStandard.length,
  extraOracleCards: finalExtras.length,
  repeatedMoved: moved.repeated.length,
  nonCardsMoved: moved.nonCards.length,
  reviewMoved: moved.review.length,
  missingStandard,
  moved,
};

writeFileSync(
  join(auditDir, "organization-report.json"),
  JSON.stringify(report, null, 2)
);

writeFileSync(
  join(sourceDir, "README-organizacao.md"),
  [
    "# Organizacao do Baralho Lynxes",
    "",
    `Cartas na raiz apos organizacao: ${finalRoot.length}`,
    `Cartas de tarot padrao na raiz: ${finalStandard.length} / 78`,
    `Cartas extras/oraculo na raiz: ${finalExtras.length}`,
    `Variantes repetidas movidas para _repetidas: ${moved.repeated.length}`,
    `Itens que nao sao carta movidos para _nao-cartas: ${moved.nonCards.length}`,
    "",
    "Observacao importante:",
    missingStandard.length
      ? `Ainda faltam no tarot padrao: ${missingStandard.join(", ")}`
      : "O tarot padrao esta completo.",
    "",
    "A raiz fica com nomes canonicos para uso no app.",
    "Nenhum arquivo foi apagado; repetidas e itens fora do baralho foram movidos para subpastas.",
  ].join("\n")
);

console.log(JSON.stringify(report, null, 2));
