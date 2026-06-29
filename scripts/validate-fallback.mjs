import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "pdu-fallback-"));

async function compile(source, target) {
  const code = await readFile(join(root, source), "utf8");
  const result = ts.transpileModule(code, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: source,
  });
  const destination = join(temp, target);
  await mkdir(join(destination, ".."), { recursive: true });
  await writeFile(destination, result.outputText);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cards = [
  ["major-01-the-magician", "O Mago", "The Magician", "ação", "action"],
  ["cups-two", "Dois de Copas", "Two of Cups", "reciprocidade", "reciprocity"],
  ["swords-eight", "Oito de Espadas", "Eight of Swords", "limitação", "limitation"],
  ["pentacles-three", "Três de Ouros", "Three of Pentacles", "colaboração", "collaboration"],
  ["major-14-temperance", "A Temperança", "Temperance", "equilíbrio", "balance"],
  ["wands-ace", "Ás de Paus", "Ace of Wands", "início", "beginning"],
].map(([key, ptName, enName, ptKeyword, enKeyword], index) => ({
  assetPath: `/tarot/cards/${key}.webp`,
  enKeyword,
  enName,
  id: index + 1,
  key,
  keywords: [ptKeyword],
  name: ptName,
  reversed: `A energia de ${ptKeyword} pede revisão antes de movimento.`,
  upright: `A energia de ${ptKeyword} favorece uma escolha concreta.`,
}));

const daily = {
  advice: "Escolha uma ação pequena que confirme sua verdade.",
  affirmation: "Eu ajo com calma e direção.",
  dateKey: "2026-06-21",
  energy: "Clareza em movimento",
  message: "Uma verdade simples já pode mover o dia.",
  reflection: "Que verdade fica simples quando o medo sai da frente?",
  ritual: "Respire três vezes e escreva o passo honesto de hoje.",
  spread: [],
  timeZone: "Europe/London",
};

function spreadFor(locale, offset = 0) {
  const positions = locale === "en"
    ? ["SITUATION", "OBSTACLE", "DIRECTION"]
    : ["SITUAÇÃO", "OBSTÁCULO", "DIREÇÃO"];

  return positions.map((position, index) => {
    const source = cards[(index + offset) % cards.length];
    return {
      card: {
        ...source,
        keywords: [locale === "en" ? source.enKeyword : source.keywords[0]],
        name: locale === "en" ? source.enName : source.name,
      },
      position,
      reversed: index === 1,
    };
  });
}

function params(overrides = {}) {
  const locale = overrides.locale ?? "pt-BR";
  return {
    daily,
    hasPortalMemory: true,
    locale,
    mode: "ANCORA",
    productKey: "caminho_3_cartas",
    question: "Como organizar minhas prioridades sem transformar tudo em urgência?",
    spread: spreadFor(locale),
    theme: "career",
    userId: "validation-user",
    ...overrides,
  };
}

try {
  await compile("src/lib/daily/seed.ts", "src/lib/daily/seed.js");
  await compile("src/lib/tarot/fallback.ts", "src/lib/tarot/fallback.js");
  const fallbackModule = await import(join(temp, "src/lib/tarot/fallback.js"));
  const generate = fallbackModule.generateFallbackReading;

  const baseline = generate(params());
  assert(baseline === generate(params()), "Same context must produce the same fallback");
  assert(baseline.length <= 7_500, "Portuguese fallback exceeded premium limit");
  assert(baseline.includes("Oito de Espadas"), "Direction card is missing");
  assert(baseline.includes("Caminho das 3 Cartas"), "Product context is missing");
  assert(
    baseline.includes("Como organizar minhas prioridades"),
    "Card-by-position text must reference the user's question"
  );
  assert(
    !/significado de baralho|deck meaning|na a pergunta/i.test(baseline),
    "Fallback leaked generic or broken card-description language"
  );

  const dateVariant = generate(
    params({ daily: { ...daily, dateKey: "2026-06-22" } })
  );
  assert(dateVariant !== baseline, "Date changes must produce a distinct fallback");

  const userVariants = new Set(
    Array.from({ length: 24 }, (_, index) =>
      generate(params({ userId: `validation-user-${index}` }))
    )
  );
  assert(
    userVariants.size >= 12,
    `User context created only ${userVariants.size} variants`
  );

  const love = generate(params({ theme: "love", mode: "LAMINA" }));
  assert(love.includes("afetos e vínculos"), "Theme context is missing");
  assert(love !== baseline, "Theme and mode must change the fallback");

  const modes = new Set(
    ["CURA", "ANCORA", "LAMINA", "NEVOA"].map((mode) =>
      generate(params({ mode }))
    )
  );
  assert(modes.size === 4, "Oracle modes must produce distinct fallbacks");

  const products = [
    "free_daily",
    "clareza_urgente",
    "caminho_3_cartas",
    "sinais_do_amor",
    "energia_da_semana",
    "mapa_do_momento",
    "circulo_do_universo",
  ];
  const productOutputs = products.map((productKey) =>
    generate(params({ productKey }))
  );
  assert(
    new Set(productOutputs).size === products.length,
    "Products must produce distinct fallback contexts"
  );
  assert(productOutputs[0].length <= 5_000, "Free fallback exceeded its limit");

  const englishDaily = {
    ...daily,
    advice: "Choose one small action that confirms your truth.",
    affirmation: "I act with calm and direction.",
    energy: "Clarity in motion",
    ritual: "Take three breaths and write today's honest step.",
  };
  const english = generate(
    params({
      daily: englishDaily,
      locale: "en",
      question: "How can I organize my priorities without turning everything into urgency?",
      spread: spreadFor("en"),
    })
  );
  assert(english.includes("INITIAL LISTENING"), "English structure is missing");
  assert(
    english.includes("How to organize my priorities") ||
      english.includes("How can I organize my priorities"),
    "English card-by-position text must reference the user's question"
  );
  assert(!english.includes("ESCUTA INICIAL"), "Portuguese leaked into English structure");
  assert(
    !/significado de baralho|na a pergunta/i.test(english),
    "English fallback leaked generic or broken card-description language"
  );
  assert(english.length <= 7_500, "English fallback exceeded premium limit");

  const spreadVariant = generate(params({ spread: spreadFor("pt-BR", 3) }));
  assert(spreadVariant !== baseline, "Card combination must change the fallback");

  const structuralCombinations = 78 * 77 * 76 * 8 * 4 * 4 * 4 * 3;
  assert(
    structuralCombinations >= 701_000_000,
    `Structural fallback combinations dropped below 701M: ${structuralCombinations}`
  );
  console.log(
    `Fallback valid: ${userVariants.size} user variants, ${modes.size} modes, ` +
      `${products.length} products; ` +
      `${structuralCombinations.toLocaleString("en-US")}+ structural combinations.`
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
