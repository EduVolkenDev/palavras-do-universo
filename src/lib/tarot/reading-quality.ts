import type { Locale } from "../i18n/config";

type ReadingSectionKey = "actions" | "cards" | "closing" | "direct" | "map";

type ReadingQualityParams = {
  expectedCards: number;
  locale: Locale;
  maxCharacters: number;
  paidProduct: boolean;
};

type ReadingQualityResult =
  | { ok: true; text: string }
  | { ok: false; reason: string };

type ParsedReadingSection = {
  key: ReadingSectionKey;
  lines: string[];
};

const SECTION_HEADING_RE =
  /^(?:\d+[).]\s*)?(DIRECT ANSWER(?: TO THE QUESTION)?|RESPOSTA DIRETA(?: À PERGUNTA| A PERGUNTA)?|SPREAD MAP|MAP OF THE SPREAD|MAPA DA TIRADA|CARDS|CARTAS|READING BY POSITION|LEITURA POR POSIÇÃO|ACTIONS|AÇÕES|ACOES|CLOSING|FECHAMENTO)\b\s*[:—-]?\s*(.*)$/i;

function cleanReadingLine(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s*/g, "")
    .replace(/^\s*[-*_]{3,}\s*$/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^>\s?/g, "")
    .trim();
}

function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

const READING_LINE_TARGET = 280;

function wrapReadingLine(line: string) {
  if (line.length <= READING_LINE_TARGET) return [line];

  const marker = line.match(/^([-•]\s+)/)?.[1] ?? "";
  let remaining = marker ? line.slice(marker.length).trimStart() : line;
  const wrapped: string[] = [];
  let isFirst = true;

  while (remaining.length > READING_LINE_TARGET) {
    const available = READING_LINE_TARGET - (isFirst ? marker.length : 0);
    const candidate = remaining.slice(0, available + 1);
    const sentenceMatches = Array.from(
      candidate.matchAll(/[.!?](?:["'”’)]*)?(?=\s|$)/g)
    );
    const sentenceMatch = sentenceMatches.at(-1);
    let cut = sentenceMatch ? sentenceMatch.index! + sentenceMatch[0].length : 0;

    if (cut < available * 0.45) {
      cut = remaining.lastIndexOf(" ", available);
    }
    if (cut <= 0) cut = available;

    const chunk = remaining.slice(0, cut).trim();
    wrapped.push(isFirst ? `${marker}${chunk}` : chunk);
    remaining = remaining.slice(cut).trimStart();
    isFirst = false;
  }

  if (remaining) wrapped.push(isFirst ? `${marker}${remaining}` : remaining);
  return wrapped;
}

function sectionKeyFromTitle(title: string): ReadingSectionKey {
  const normalized = normalizeForComparison(title);

  if (normalized.includes("direct answer") || normalized.includes("resposta direta")) {
    return "direct";
  }
  if (normalized.includes("spread map") || normalized.includes("mapa da tirada")) {
    return "map";
  }
  if (
    normalized.includes("cards") ||
    normalized.includes("cartas") ||
    normalized.includes("reading by position") ||
    normalized.includes("leitura por posicao")
  ) {
    return "cards";
  }
  if (normalized.includes("actions") || normalized.includes("acoes")) {
    return "actions";
  }
  return "closing";
}

function parseReadingSections(text: string) {
  const sections: ParsedReadingSection[] = [];
  let current: ParsedReadingSection | null = null;

  text.split("\n").forEach((rawLine) => {
    const line = cleanReadingLine(rawLine);
    if (!line) return;

    const heading = line.match(SECTION_HEADING_RE);
    if (heading) {
      if (current) sections.push(current);
      const trailing = heading[2]?.trim();
      current = {
        key: sectionKeyFromTitle(heading[1]),
        lines: trailing ? [trailing] : [],
      };
      return;
    }

    if (!current) {
      current = { key: "direct", lines: [] };
    }
    current.lines.push(line);
  });

  if (current) sections.push(current);
  return sections;
}

function hasLanguageLeak(text: string, locale: Locale) {
  if (locale === "en") {
    return /\b(voc[eê]|resposta|pergunta|cartas|aç[ãa]o|aç[õo]es|tirada|pr[oó]xima pergunta|fechamento)\b/i.test(text);
  }

  return /\b(direct answer|spread map|cards|actions|closing|next question)\b/i.test(text);
}

function hasRepeatedMeaningfulLine(lines: string[]) {
  const counts = new Map<string, number>();

  lines.forEach((line) => {
    const normalized = normalizeForComparison(line.replace(/^[-•]\s+/, ""));
    if (normalized.length < 28) return;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  return Array.from(counts.values()).some((count) => count > 1);
}

function startsWithGenericOpener(line: string, locale: Locale) {
  const normalized = normalizeForComparison(line.replace(/^[-•]\s+/, ""));
  if (locale === "en") {
    return normalized.startsWith("the cards show that");
  }
  return (
    normalized.startsWith("as cartas mostram que") ||
    normalized.startsWith("a tirada mostra que")
  );
}

export function validateReadingQuality(
  text: string,
  params: ReadingQualityParams
): ReadingQualityResult {
  const cleanText = text
    .split("\n")
    .map(cleanReadingLine)
    .flatMap(wrapReadingLine)
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanText) return { ok: false, reason: "empty reading" };
  if (cleanText.length > params.maxCharacters) {
    return { ok: false, reason: "reading exceeded character limit" };
  }
  if (hasLanguageLeak(cleanText, params.locale)) {
    return { ok: false, reason: "reading mixed languages" };
  }

  const sections = parseReadingSections(cleanText);
  const keys = new Set(sections.map((section) => section.key));
  const required: ReadingSectionKey[] = params.paidProduct
    ? ["direct", "map", "cards", "actions", "closing"]
    : ["direct", "cards", "actions", "closing"];
  const missing = required.filter((key) => !keys.has(key));
  if (missing.length) {
    return { ok: false, reason: `missing sections: ${missing.join(", ")}` };
  }

  const contentLines = sections.flatMap((section) => section.lines);
  const maxLineLength = params.paidProduct ? 320 : 280;
  const longLine = contentLines.find((line) => line.length > maxLineLength);
  if (longLine) {
    return {
      ok: false,
      reason: `line too long (${longLine.length} chars): ${longLine.slice(0, 120)}`,
    };
  }

  const longBullet = contentLines.find(
    (line) => /^[-•]\s+/.test(line) && countWords(line.replace(/^[-•]\s+/, "")) > 40
  );
  if (longBullet) {
    return {
      ok: false,
      reason: `bullet too long (${countWords(longBullet.replace(/^[-•]\s+/, ""))} words)`,
    };
  }
  if (contentLines.some((line) => startsWithGenericOpener(line, params.locale))) {
    return { ok: false, reason: "generic opener" };
  }
  if (hasRepeatedMeaningfulLine(contentLines)) {
    return { ok: false, reason: "repeated line" };
  }

  const cardSection = sections.find((section) => section.key === "cards");
  const cardLines = cardSection?.lines.filter((line) =>
    /^[-•]\s+/.test(line) || /[:—-]/.test(line)
  ) ?? [];
  const expectedCardLines = params.paidProduct
    ? params.expectedCards
    : Math.min(params.expectedCards, 3);
  if (cardLines.length < expectedCardLines) {
    return { ok: false, reason: "not enough card lines" };
  }

  const actionSection = sections.find((section) => section.key === "actions");
  const actionLines = actionSection?.lines.filter(Boolean) ?? [];
  if (actionLines.length < 3 || actionLines.length > 4) {
    return { ok: false, reason: "actions must have 3 concise lines" };
  }

  const closingSection = sections.find((section) => section.key === "closing");
  const closingLines = closingSection?.lines.filter(Boolean) ?? [];
  if (closingLines.length < 2 || closingLines.length > 3) {
    return { ok: false, reason: "closing must include mantra and next question" };
  }

  return { ok: true, text: cleanText };
}
