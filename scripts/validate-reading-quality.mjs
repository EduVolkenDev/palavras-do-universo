import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "pdu-reading-quality-"));

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

try {
  await compile("src/lib/tarot/reading-quality.ts", "src/lib/tarot/reading-quality.js");
  const qualityModule = await import(join(temp, "src/lib/tarot/reading-quality.js"));
  const validate = qualityModule.validateReadingQuality;

  const validPtFree = [
    "1) RESPOSTA DIRETA",
    "A resposta é escolher um passo pequeno antes de tentar resolver tudo. O ponto sensível é separar fato, medo e desejo.",
    "",
    "2) CARTAS",
    "- Situação: O Mago — existe energia disponível, mas ela precisa virar ação clara.",
    "- Obstáculo: Dois de Copas — reciprocidade pede conversa simples, não suposição.",
    "- Direção: A Temperança — avance com calma e constância.",
    "",
    "3) AÇÕES",
    "- Escreva o próximo passo em uma frase.",
    "- Tire uma distração por vinte minutos.",
    "- Faça uma pergunta direta antes de concluir sozinho.",
    "",
    "4) FECHAMENTO",
    "Mantra: Eu posso agir com calma e direção.",
    "Próxima pergunta: Qual gesto confirma minha escolha hoje?",
  ].join("\n");

  const validEnPaid = [
    "1) DIRECT ANSWER",
    "The answer is to move with one clear choice, not perfect certainty.",
    "",
    "2) SPREAD MAP",
    "The movement begins with pressure, crosses choice, and asks for practical care.",
    "",
    "3) CARDS",
    "- Situation: The Fool — begin with one visible step instead of a perfect plan.",
    "- Obstacle: The Lovers — choose by values instead of trying to please every path.",
    "- Root: Temperance — slow rhythm is not delay; it is support.",
    "- Environment: Three of Pentacles — ask for alignment around scope and timing.",
    "- Direction: The Empress — let care become a practical system.",
    "",
    "4) ACTIONS",
    "- Write the next action in one sentence.",
    "- Remove one distraction for twenty minutes.",
    "- Confirm the choice through one small gesture today.",
    "",
    "5) CLOSING",
    "Mantra: I can listen to myself and move with calm.",
    "Next question: What needs one practical step now?",
  ].join("\n");

  assert(
    validate(validPtFree, {
      expectedCards: 3,
      locale: "pt-BR",
      maxCharacters: 3_000,
      paidProduct: false,
    }).ok,
    "Valid Portuguese free reading was rejected"
  );

  assert(
    validate(validEnPaid, {
      expectedCards: 5,
      locale: "en",
      maxCharacters: 5_200,
      paidProduct: true,
    }).ok,
    "Valid English paid reading was rejected"
  );

  assert(
    !validate(validPtFree.replace("4) FECHAMENTO", ""), {
      expectedCards: 3,
      locale: "pt-BR",
      maxCharacters: 3_000,
      paidProduct: false,
    }).ok,
    "Reading without closing passed"
  );

  assert(
      !validate(`${validPtFree}\n${"texto ".repeat(500)}`, {
      expectedCards: 3,
      locale: "pt-BR",
      maxCharacters: 3_000,
      paidProduct: false,
    }).ok,
    "Reading with a long line passed"
  );

  assert(
    !validate(validEnPaid.replace("The answer", "A resposta"), {
      expectedCards: 5,
      locale: "en",
      maxCharacters: 5_200,
      paidProduct: true,
    }).ok,
    "Mixed-language English reading passed"
  );

  assert(
    !validate(validPtFree.replace("A resposta é escolher", "As cartas mostram que escolher"), {
      expectedCards: 3,
      locale: "pt-BR",
      maxCharacters: 3_000,
      paidProduct: false,
    }).ok,
    "Generic opener passed"
  );

  assert(
    !validate(validPtFree.replace(
      "Faça uma pergunta direta antes de concluir sozinho.",
      "Escreva o próximo passo em uma frase."
    ), {
      expectedCards: 3,
      locale: "pt-BR",
      maxCharacters: 3_000,
      paidProduct: false,
    }).ok,
    "Repeated line passed"
  );

  assert(
    !validate(validEnPaid.replace("2) SPREAD MAP\nThe movement begins with pressure, crosses choice, and asks for practical care.\n\n", ""), {
      expectedCards: 5,
      locale: "en",
      maxCharacters: 5_200,
      paidProduct: true,
    }).ok,
    "Paid reading without spread map passed"
  );

  console.log("Reading quality validation passed.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
