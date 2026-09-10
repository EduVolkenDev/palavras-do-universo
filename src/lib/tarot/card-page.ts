import { TAROT_CARD_CATALOG, type TarotCardShell } from "./cardCatalog";
import { CARDS, type TarotCard } from "./cards";

export type TarotCardPageData = TarotCardShell & { detail: TarotCard };

export function getTarotCardPageData(key: string): TarotCardPageData | null {
  const shell = TAROT_CARD_CATALOG.find((card) => card.key === key);
  const detail = CARDS.find((card) => card.key === key);

  if (!shell || !detail) return null;

  return { ...shell, detail };
}

export function getTarotCardPageParams() {
  return TAROT_CARD_CATALOG.map(({ key }) => ({ slug: key }));
}

export function getTarotCardGroup(card: TarotCardShell) {
  if (card.arcana === "major") return "Arcanos maiores";

  const labels = {
    wands: "Paus",
    cups: "Copas",
    swords: "Espadas",
    pentacles: "Ouros",
  } as const;

  return card.suit ? labels[card.suit] : "Arcanos menores";
}
