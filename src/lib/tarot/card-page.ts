import { TAROT_CARD_CATALOG, type TarotCardShell } from "./cardCatalog";
import { CARDS, type TarotCard } from "./cards";
import { normalizeLocale, type Locale } from "@/lib/i18n/config";
import { localizeTarotCard } from "@/lib/i18n/oracle";

export type TarotCardPageData = TarotCardShell & { detail: TarotCard };

export function getTarotCardPageData(key: string): TarotCardPageData | null {
  const shell = TAROT_CARD_CATALOG.find((card) => card.key === key);
  const detail = CARDS.find((card) => card.key === key);

  if (!shell || !detail) return null;

  return { ...shell, detail };
}

export function getLocalizedTarotCardPageData(
  key: string,
  localeInput: Locale | string,
): TarotCardPageData | null {
  const source = getTarotCardPageData(key);
  if (!source) return null;

  const detail = localizeTarotCard(source.detail, normalizeLocale(localeInput));
  return { ...source, name: detail.name, detail };
}

export function getTarotCardPageParams() {
  return TAROT_CARD_CATALOG.map(({ key }) => ({ slug: key }));
}

export function getTarotCardGroup(card: TarotCardShell, localeInput: Locale | string = "pt-BR") {
  const locale = normalizeLocale(localeInput);
  if (card.arcana === "major") return locale === "en" ? "Major Arcana" : "Arcanos maiores";

  const labels = locale === "en" ? {
    wands: "Wands",
    cups: "Cups",
    swords: "Swords",
    pentacles: "Pentacles",
  } : {
    wands: "Paus",
    cups: "Copas",
    swords: "Espadas",
    pentacles: "Ouros",
  } as const;

  return card.suit ? labels[card.suit] : locale === "en" ? "Minor Arcana" : "Arcanos menores";
}
