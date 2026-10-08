import { localizeTarotCard } from "@/lib/i18n/oracle";
import { CARDS } from "./cards";

type StoredCard = {
  cardKey?: string;
  card_key?: string;
  position?: string;
  keyword?: string;
  reversed?: boolean;
  coreMeaning?: string;
  core_meaning?: string;
};

type LegacyReading = {
  question: string;
  interpretation: string;
  locale?: string;
  spread: unknown;
};

// These are the position sentences used by the old fallback. Keeping them here
// lets us identify its exact output before restoring any shortened sentence.
const PT_POSITION_CONTEXT = [
  [
    "{card} enquadra {question}: {keyword} aparece como o primeiro sinal a ser lido antes de decidir o próximo passo.",
    "Na situação, {card} traz {keyword} para dentro de {question}; comece separando fato, desejo e medo.",
    "{card} mostra o terreno inicial de {question}: antes de agir, reconheça onde {keyword} já está organizando a cena.",
    "A primeira camada de {question} passa por {card}; leia esse tema como contexto vivo, não como resposta fechada.",
  ],
  [
    "{card} mostra a tensão dentro de {question}: {keyword} virou ponto de pressão e pede uma resposta menos automática.",
    "No obstáculo, {card} revela onde {question} pode estar sendo atravessada por excesso, defesa ou pressa.",
    "{card} não bloqueia a resposta; ele mostra onde {keyword} precisa ser visto antes que você escolha no impulso.",
    "A sombra de {question} aparece em {card}: algo pede pausa para que {keyword} não vire repetição.",
  ],
  [
    "{card} leva a resposta para ação: use {keyword} para fazer uma escolha possível, em vez de esperar a situação inteira ficar certa.",
    "Como direção, {card} pede que {question} vire um gesto concreto guiado por {keyword}.",
    "{card} aponta o movimento mais limpo: transforme esse tema em uma decisão pequena, visível e realizável.",
    "A saída aberta por {card} não exige certeza total; ela pede um passo que confirme {keyword} no mundo real.",
  ],
  [
    "Nesta camada, {card} acrescenta {keyword} ao mapa de {question}; leia a relação com as outras posições antes de concluir.",
    "{card} amplia {question} por meio de {keyword}; essa posição ganha sentido no diálogo com o conjunto.",
    "A posição ocupada por {card} revela uma nuance de {keyword} que reorganiza a leitura de {question}.",
    "{card} pede que {keyword} seja integrado ao restante da tirada, sem transformar uma única carta em sentença.",
  ],
] as const;

const EN_POSITION_CONTEXT = [
  [
    "{card} frames {question}: {keyword} appears as the first signal to read before deciding what comes next.",
    "In the situation, {card} brings {keyword} into {question}; begin by separating fact, desire, and fear.",
    "{card} shows the starting ground of {question}: before acting, notice where {keyword} is already shaping the scene.",
    "The first layer of {question} moves through {card}; read this theme as living context, not a closed answer.",
  ],
  [
    "{card} shows the tension inside {question}: {keyword} is becoming a point of pressure and asks for a less automatic response.",
    "As the obstacle, {card} reveals where {question} may be crossed by excess, defense, or haste.",
    "{card} does not block the answer; it shows where {keyword} needs to be seen before you choose from impulse.",
    "The shadow of {question} appears through {card}: something asks for pause so {keyword} does not become repetition.",
  ],
  [
    "{card} turns the answer toward action: use {keyword} to make one possible choice instead of waiting for the whole situation to become certain.",
    "As direction, {card} asks {question} to become one concrete gesture guided by {keyword}.",
    "{card} points to the cleanest movement: turn this theme into a small, visible, doable decision.",
    "The way opened by {card} does not demand total certainty; it asks for one step that confirms {keyword} in real life.",
  ],
  [
    "In this layer, {card} adds {keyword} to the map of {question}; read its relationship with the other positions before concluding.",
    "{card} expands {question} through {keyword}; this position gains meaning in dialogue with the whole spread.",
    "The position held by {card} reveals a nuance of {keyword} that reorganizes the reading of {question}.",
    "{card} asks you to integrate {keyword} with the rest of the spread without turning one card into a verdict.",
  ],
] as const;

const ELLIPSIS = /(?:\.{3,}|…)/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function limitWords(text: string, limit: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length > limit ? `${words.slice(0, limit).join(" ")}...` : clean;
}

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

function restoreCardLine(
  line: string,
  cardValue: unknown,
  index: number,
  locale: "pt-BR" | "en",
  question: string
) {
  if (!isRecord(cardValue)) return null;
  const card = cardValue as StoredCard;
  const key = asText(card.cardKey ?? card.card_key);
  const source = CARDS.find((item) => item.key === key);
  if (!source) return null;

  const localized = localizeTarotCard(source, locale);
  const position = asText(card.position);
  const keyword = asText(card.keyword) || localized.keywords[0] || (locale === "en" ? "presence" : "presença");
  const label = `${localized.name}${card.reversed ? (locale === "en" ? " (reversed)" : " (reversa)") : ""}`;
  const prefix = `- ${position}: ${label} — `;
  if (!line.startsWith(prefix)) return null;

  const cardMeaning = (card.reversed ? localized.reversed : localized.upright)
    .replace(/\s+/g, " ")
    .replace(/[.!?]\s.*$/, "")
    .trim();
  // Older persisted spreads kept the Portuguese guide even for English
  // readings, while the fallback itself localized the guide before writing.
  const simpleMeaning = (locale === "en"
    ? localized.guide.core
    : asText(card.coreMeaning ?? card.core_meaning) || localized.guide.core || cardMeaning || keyword)
    .replace(/\s+/g, " ")
    .trim();
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  const shortQuestion = cleanQuestion.length > 96
    ? `${cleanQuestion.slice(0, 93).trim()}...`
    : cleanQuestion;
  const questionPart = shortQuestion
    ? `${locale === "en" ? "your question" : "sua pergunta"} "${shortQuestion}"`
    : locale === "en" ? "this moment" : "este momento";
  const fullQuestionPart = cleanQuestion
    ? `${locale === "en" ? "your question" : "sua pergunta"} "${cleanQuestion}"`
    : locale === "en" ? "this moment" : "este momento";
  const templates = locale === "en" ? EN_POSITION_CONTEXT : PT_POSITION_CONTEXT;
  const candidates = templates[Math.min(index, 3)];
  const bridge = locale === "en" ? "In simple terms:" : "Em termos simples:";
  const application = locale === "en" ? "Here:" : "Aqui:";
  const practice = locale === "en" ? "In practice:" : "Na prática:";

  for (const template of candidates) {
    const originalPositionLine = fillTemplate(template, {
      card: label,
      keyword,
      meaning: cardMeaning || keyword,
      question: questionPart,
    });
    const shortenedBody = `${bridge} ${limitWords(simpleMeaning, 13)} ${application} ${limitWords(originalPositionLine, 12)} ${practice} ${limitWords(cardMeaning || keyword, 7)}.`;
    if (line !== `${prefix}${limitWords(shortenedBody, 38)}`) continue;

    const completePositionLine = fillTemplate(template, {
      card: label,
      keyword,
      meaning: cardMeaning || keyword,
      question: fullQuestionPart,
    });
    return `${prefix}${bridge} ${simpleMeaning} ${application} ${completePositionLine} ${practice} ${cardMeaning || keyword}.`;
  }
  return null;
}

/** Restores only text that exactly matches the retired word-limited fallback. */
export function repairLegacyReading(reading: LegacyReading) {
  const original = reading.interpretation;
  if (!ELLIPSIS.test(original)) {
    return { text: original, changed: false, complete: true, repairedLines: 0 };
  }

  const locale: "pt-BR" | "en" = reading.locale?.startsWith("en") ? "en" : "pt-BR";
  const spread = Array.isArray(reading.spread) ? reading.spread : [];
  const lines = original.split("\n");
  let repairedLines = 0;

  for (let index = 0; index < spread.length; index += 1) {
    const matchingLineIndex = lines.findIndex((line) =>
      line.startsWith(`- ${asText(isRecord(spread[index]) ? spread[index].position : "")}: `) &&
      ELLIPSIS.test(line)
    );
    if (matchingLineIndex < 0) continue;
    const restored = restoreCardLine(lines[matchingLineIndex], spread[index], index, locale, reading.question);
    if (!restored) continue;
    lines[matchingLineIndex] = restored;
    repairedLines += 1;
  }

  // The old fallback also shortened long questions in its direct answer.
  // This replacement is exact: the complete question is already in this row.
  const cleanQuestion = reading.question.replace(/\s+/g, " ").trim();
  if (cleanQuestion.length > 96) {
    const shortQuestion = `${cleanQuestion.slice(0, 93).trim()}...`;
    const originalPrefix = locale === "en" ? `For "${shortQuestion}",` : `Para "${shortQuestion}",`;
    const restoredPrefix = locale === "en" ? `For "${cleanQuestion}",` : `Para "${cleanQuestion}",`;
    const lineIndex = lines.findIndex((line) => line.startsWith(originalPrefix));
    if (lineIndex >= 0) {
      lines[lineIndex] = lines[lineIndex].replace(originalPrefix, restoredPrefix);
      repairedLines += 1;
    }
  }

  const text = lines.join("\n");
  return {
    text,
    changed: text !== original,
    complete: !ELLIPSIS.test(text),
    repairedLines,
  };
}
