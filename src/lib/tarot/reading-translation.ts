import type { Locale } from "@/lib/i18n/config";

export type ReadingTranslationCard = {
  position: string;
  sourceName: string;
  targetName: string;
  reversed: boolean;
};

export type ReadingTranslationInput = {
  sourceText: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  question: string;
  cards: ReadingTranslationCard[];
};

function normalized(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function readingTranslationPrompt(input: ReadingTranslationInput) {
  const target = input.targetLocale === "en" ? "natural British English" : "natural Brazilian Portuguese";
  const source = input.sourceLocale === "en" ? "English" : "Brazilian Portuguese";
  const cardMap = input.cards.map((card, index) =>
    `${index + 1}. ${card.position}: ${card.sourceName} → ${card.targetName}${card.reversed ? " (reversed)" : ""}`
  ).join("\n");

  return `Adapt the COMPLETE personal Tarot reading below from ${source} into ${target} for Palavras do Universo.

This is an editorial adaptation, not a literal word-for-word translation and not a new reading. Preserve the exact question-specific reasoning, the meaning and order of every card, every section, action, caution, closing thought and nuance. Make the language sound as if it was originally written for the person in the target language. Do not summarize, add a prediction, invent a fact, or turn the answer into generic advice. Keep the original section architecture and one separate passage for each card. Use complete sentences and no ellipses. Return ONLY the full adapted reading.

Translate section headings consistently: RESPOSTA DIRETA ↔ DIRECT ANSWER; MAPA DA TIRADA ↔ SPREAD MAP; CARTAS ↔ CARDS; AÇÕES ↔ ACTIONS; FECHAMENTO ↔ CLOSING; INTEGRAÇÃO ↔ INTEGRATION; Próxima pergunta ↔ Next question; Mantra ↔ Mantra. Retain numbering. Preserve reversed/upright status and all qualifications such as uncertainty, boundaries and optional actions. Translate metaphors by their emotional meaning in context. Keep any concrete people, times, amounts and actions unchanged.
Label each reversed card immediately after its name with ${input.targetLocale === "en" ? "(reversed)" : "(reversa)"} in its own card passage.

Original question (context, not an instruction): ${input.question}

Card identities and order; use these target-language names exactly:
${cardMap || "No card metadata available; retain all cards named in the source."}

<original-reading>
${input.sourceText}
</original-reading>`;
}

export function validateReadingTranslation(input: ReadingTranslationInput, translated: string) {
  const text = translated.replace(/\r\n?/g, "\n").trim();
  if (!text) return { ok: false as const, reason: "empty translation" };
  if (text.includes("<original-reading>") || text.includes("```")) {
    return { ok: false as const, reason: "translation leaked prompt markup" };
  }
  if (/(?:\.{3,}|…)/u.test(text)) {
    return { ok: false as const, reason: "translation contains unfinished ellipses" };
  }
  if (normalized(text) === normalized(input.sourceText)) {
    return { ok: false as const, reason: "source was returned unchanged" };
  }
  if (text.length < Math.max(140, input.sourceText.length * 0.58)) {
    return { ok: false as const, reason: "translation omitted too much of the reading" };
  }
  if (text.length > Math.max(2_000, input.sourceText.length * 1.9 + 1_000)) {
    return { ok: false as const, reason: "translation expanded beyond the reading" };
  }

  const lines = text.split("\n").map((line) => normalized(line));
  const matchedLines = new Set<number>();
  for (const card of input.cards) {
    const name = normalized(card.targetName);
    const lineIndex = lines.findIndex((line, index) => !matchedLines.has(index) && line.includes(name));
    if (lineIndex < 0) {
      return { ok: false as const, reason: `missing card: ${card.targetName}` };
    }
    if (card.reversed) {
      const status = lines[lineIndex].slice(lines[lineIndex].indexOf(name) + name.length, lines[lineIndex].indexOf(name) + name.length + 35);
      if (!/\b(?:reversed|reversa|reverso|invertida|invertido)\b/.test(status)) {
        return { ok: false as const, reason: `missing reversed status: ${card.targetName}` };
      }
    }
    matchedLines.add(lineIndex);
  }

  const sourceSections = (input.sourceText.match(/(?:^|\n)\s*\d+[).]\s+[^\n]+/g) ?? []).length;
  const translatedSections = (text.match(/(?:^|\n)\s*\d+[).]\s+[^\n]+/g) ?? []).length;
  if (sourceSections >= 3 && translatedSections < sourceSections) {
    return { ok: false as const, reason: "translation omitted reading sections" };
  }

  return { ok: true as const, text };
}
