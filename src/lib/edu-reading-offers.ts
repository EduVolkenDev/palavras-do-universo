import type { ProductCurrency } from "@/lib/product/pricing";

export type EduReadingOffer = {
  id: "caminho-3-cartas" | "diamante" | "passaro-voando";
  title: string;
  cards: number;
  durationLabel: string;
  priceCents: Record<ProductCurrency, number>;
  description: string;
};

// Valores e duração ficam aqui para que possam ser revisados sem alterar a jornada.
// Estes atendimentos humanos não usam os produtos digitais nem o checkout até os
// respectivos produtos Stripe e regras de agenda serem configurados.
export const EDU_READING_OFFERS: EduReadingOffer[] = [
  {
    id: "caminho-3-cartas",
    title: "Caminho das 3 Cartas",
    cards: 3,
    durationLabel: "40–50 min",
    priceCents: { BRL: 19900, GBP: 3500 },
    description: "Uma pergunta central, três perspectivas e um próximo passo possível.",
  },
  {
    id: "diamante",
    title: "O Diamante",
    cards: 5,
    durationLabel: "50–70 min",
    priceCents: { BRL: 29900, GBP: 5000 },
    description: "Uma leitura para olhar a questão por camadas e encontrar integração.",
  },
  {
    id: "passaro-voando",
    title: "O Pássaro Voando",
    cards: 7,
    durationLabel: "70–80 min",
    priceCents: { BRL: 35000, GBP: 7000 },
    description: "Uma leitura ampla para transições, direção e movimento consciente.",
  },
];

export type EduReadingAvailabilitySlot = { startsAt: string; timezone: string };

// Preencha apenas com horários que você realmente poderá atender.
export const EDU_READING_AVAILABILITY: EduReadingAvailabilitySlot[] = [];
