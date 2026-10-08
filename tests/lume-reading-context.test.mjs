import assert from "node:assert/strict";
import test from "node:test";
import { normalizeActiveReading } from "../src/lib/personalization/reading-context.ts";
import {
  composeLumeContext,
  MAX_LUME_CONTEXT_LENGTH,
} from "../src/lib/lume/context-budget.ts";

test("active reading keeps its cards when the server normalizes the client context again", () => {
  const savedReading = {
    locale: "pt-BR",
    question: "Como conversar sobre esta mudança?",
    result: "A conversa pede clareza e espaço para ouvir.",
    spread_cards: [
      {
        position: "O que se apresenta",
        cardKey: "the-star",
        name: "A Estrela",
        reversed: false,
        meaning: "Falar com esperança sem prometer um resultado.",
        coreMeaning: "Esperança e renovação.",
      },
    ],
  };

  const clientContext = normalizeActiveReading(savedReading);
  assert.ok(clientContext);
  const serverContext = normalizeActiveReading(clientContext);
  assert.deepEqual(serverContext, clientContext);
  assert.equal(serverContext.cards[0].name, "A Estrela");
});

test("a synced historical reading still supplies Lume with its question, text and cards", () => {
  const remoteReading = {
    id: "reading-123",
    locale: "pt-BR",
    question: "O que preciso entender nesta mudança?",
    interpretation: "A Estrela aponta para esperança com um passo concreto.",
    created_at: "2026-10-07T10:00:00.000Z",
    spread: [
      {
        position: "DIREÇÃO",
        cardKey: "major-17-the-star",
        name: "A Estrela",
        reversed: false,
        meaning: "Nesta pergunta, espere sem abandonar a ação.",
        coreMeaning: "Esperança e renovação.",
      },
    ],
  };

  const context = normalizeActiveReading(remoteReading);
  assert.ok(context);
  assert.equal(context.readingId, remoteReading.id);
  assert.equal(context.result, remoteReading.interpretation);
  assert.equal(context.cards[0].name, "A Estrela");
  assert.equal(normalizeActiveReading(context)?.cards[0].position, "DIREÇÃO");
});

test("the current reading survives the context budget ahead of older history", () => {
  const currentReading = `Texto da leitura atual:\n${"Uma explicação específica. ".repeat(260)}`;
  const olderHistory = `Histórico antigo: ${"outro tema ".repeat(5_000)}`;
  const context = composeLumeContext(currentReading, [olderHistory]);

  assert.ok(context.startsWith(currentReading));
  assert.ok(context.length <= MAX_LUME_CONTEXT_LENGTH);
  assert.ok(context.length < currentReading.length + olderHistory.length);
});

test("an extended reading keeps its final explanation when sent to Lume", () => {
  const result = `${"Esta posição tem um significado específico.\n".repeat(230)}FECHAMENTO: combinar a conversa de domingo sem exigir uma decisão.`;
  const context = normalizeActiveReading({ question: "Como conversar sobre esta mudança?", result });
  assert.ok(context);
  assert.equal(context.result, result);
  assert.ok(composeLumeContext(context.result, []).endsWith("sem exigir uma decisão."));
});
