import assert from "node:assert/strict";
import test from "node:test";
import { readingTranslationPrompt, validateReadingTranslation } from "../src/lib/tarot/reading-translation.ts";

export const sourceText = [
  "1) RESPOSTA DIRETA",
  "Você pode iniciar a conversa sobre mudar de cidade sem prometer que já decidiu. Separe a vontade de explorar uma possibilidade da obrigação de fechar um plano hoje.",
  "2) CARTAS",
  "- Situação: O Mago — você já tem informações para propor uma conversa, mas ainda precisa ouvir o que seu parceiro considera essencial.",
  "- Obstáculo: Dois de Copas reversa — não confunda silêncio com concordância. A diferença de ritmo entre vocês pede escuta antes de um compromisso.",
  "- Direção: A Temperança — combine um período de pesquisa com uma data para voltar ao assunto; testar uma possibilidade juntos respeita os dois tempos.",
  "3) AÇÕES",
  "- Diga o que deseja explorar e pergunte o que seu parceiro teme perder.",
  "- Marquem uma conversa no domingo, sem exigir uma decisão nesse encontro.",
  "4) FECHAMENTO",
  "Mantra: Posso expressar meu desejo e deixar espaço para ouvir.",
  "Próxima pergunta: Que condição faria esta mudança parecer possível para nós dois?",
].join("\n");
export const translated = [
  "1) DIRECT ANSWER",
  "You can open a conversation about moving to another city without suggesting that your mind is already made up. Exploring the possibility does not mean you both have to settle on a plan today.",
  "2) CARDS",
  "- Situation: The Magician — you have enough information to start the conversation, but you still need to hear what matters most to your partner.",
  "- Obstacle: Two of Cups (reversed) — silence is not the same as agreement. If you are moving at different speeds, listen before making a commitment.",
  "- Direction: Temperance — agree on some time to research and a date to revisit the idea. Exploring it together gives both of you room to move at your own pace.",
  "3) ACTIONS",
  "- Explain what you want to explore and ask what your partner is afraid of losing.",
  "- Arrange a conversation on Sunday without requiring a decision at that meeting.",
  "4) CLOSING",
  "Mantra: I can express what I want and make room to listen.",
  "Next question: What would make this move feel possible for both of us?",
].join("\n");
export const input = {
  sourceText, sourceLocale: "pt-BR", targetLocale: "en",
  question: "Como conversar com meu parceiro sobre mudar de cidade?",
  cards: [
    { position: "SITUAÇÃO", sourceName: "O Mago", targetName: "The Magician", reversed: false },
    { position: "OBSTÁCULO", sourceName: "Dois de Copas", targetName: "Two of Cups", reversed: true },
    { position: "DIREÇÃO", sourceName: "A Temperança", targetName: "Temperance", reversed: false },
  ],
};

test("accepts a full contextual adaptation with the complete card sequence and sections", () => {
  assert.equal(validateReadingTranslation(input, translated).ok, true);
  const reverse = { ...input, sourceText: translated, sourceLocale: "en", targetLocale: "pt-BR", cards: input.cards.map(card => ({ ...card, sourceName: card.targetName, targetName: card.sourceName })) };
  assert.equal(validateReadingTranslation(reverse, sourceText).ok, true);
});

test("rejects unchanged originals, incomplete card explanations and missing closing sections", () => {
  assert.equal(validateReadingTranslation(input, sourceText).ok, false);
  assert.equal(validateReadingTranslation(input, translated.replace("The Magician", "A card")).ok, false);
  assert.equal(validateReadingTranslation(input, translated.replace(" (reversed)", "")).ok, false);
  assert.equal(validateReadingTranslation(input, translated.replace("before making a commitment.", "before making...")).ok, false);
  assert.equal(validateReadingTranslation(input, translated.split("4) CLOSING")[0]).ok, false);
  assert.equal(validateReadingTranslation(input, "The Magician, Two of Cups and Temperance suggest that you listen to yourself.").ok, false);
});

test("the adaptation receives the full question, source and reversed-card context", () => {
  const prompt = readingTranslationPrompt(input);
  assert.ok(prompt.includes(input.question));
  assert.ok(prompt.includes(sourceText));
  assert.ok(prompt.includes("Dois de Copas → Two of Cups (reversed)"));
  assert.ok(prompt.includes("every section, action, caution, closing thought and nuance"));
});
