export type TarotArcana = "major" | "minor";
export type TarotSuit = "wands" | "cups" | "swords" | "pentacles";

export type TarotCardShell = {
  key: string;
  name: string;
  arcana: TarotArcana;
  number?: number;
  suit?: TarotSuit;
  rank?: string;
  assetPath: string;
};

const majorArcana = [
  ["major-00-the-fool", "O Louco"],
  ["major-01-the-magician", "O Mago"],
  ["major-02-the-high-priestess", "A Sacerdotisa"],
  ["major-03-the-empress", "A Imperatriz"],
  ["major-04-the-emperor", "O Imperador"],
  ["major-05-the-hierophant", "O Hierofante"],
  ["major-06-the-lovers", "Os Enamorados"],
  ["major-07-the-chariot", "O Carro"],
  ["major-08-strength", "A Força"],
  ["major-09-the-hermit", "O Eremita"],
  ["major-10-wheel-of-fortune", "A Roda da Fortuna"],
  ["major-11-justice", "A Justiça"],
  ["major-12-the-hanged-man", "O Enforcado"],
  ["major-13-death", "A Morte"],
  ["major-14-temperance", "A Temperança"],
  ["major-15-the-devil", "O Diabo"],
  ["major-16-the-tower", "A Torre"],
  ["major-17-the-star", "A Estrela"],
  ["major-18-the-moon", "A Lua"],
  ["major-19-the-sun", "O Sol"],
  ["major-20-judgement", "O Julgamento"],
  ["major-21-the-world", "O Mundo"],
] as const;

const suits = {
  wands: {
    label: "Paus",
    ranks: [
      ["ace", "Ás"],
      ["two", "Dois"],
      ["three", "Três"],
      ["four", "Quatro"],
      ["five", "Cinco"],
      ["six", "Seis"],
      ["seven", "Sete"],
      ["eight", "Oito"],
      ["nine", "Nove"],
      ["ten", "Dez"],
      ["page", "Pajem"],
      ["knight", "Cavaleiro"],
      ["queen", "Rainha"],
      ["king", "Rei"],
    ],
  },
  cups: {
    label: "Copas",
    ranks: [
      ["ace", "Ás"],
      ["two", "Dois"],
      ["three", "Três"],
      ["four", "Quatro"],
      ["five", "Cinco"],
      ["six", "Seis"],
      ["seven", "Sete"],
      ["eight", "Oito"],
      ["nine", "Nove"],
      ["ten", "Dez"],
      ["page", "Pajem"],
      ["knight", "Cavaleiro"],
      ["queen", "Rainha"],
      ["king", "Rei"],
    ],
  },
  swords: {
    label: "Espadas",
    ranks: [
      ["ace", "Ás"],
      ["two", "Dois"],
      ["three", "Três"],
      ["four", "Quatro"],
      ["five", "Cinco"],
      ["six", "Seis"],
      ["seven", "Sete"],
      ["eight", "Oito"],
      ["nine", "Nove"],
      ["ten", "Dez"],
      ["page", "Pajem"],
      ["knight", "Cavaleiro"],
      ["queen", "Rainha"],
      ["king", "Rei"],
    ],
  },
  pentacles: {
    label: "Ouros",
    ranks: [
      ["ace", "Ás"],
      ["two", "Dois"],
      ["three", "Três"],
      ["four", "Quatro"],
      ["five", "Cinco"],
      ["six", "Seis"],
      ["seven", "Sete"],
      ["eight", "Oito"],
      ["nine", "Nove"],
      ["ten", "Dez"],
      ["page", "Pajem"],
      ["knight", "Cavaleiro"],
      ["queen", "Rainha"],
      ["king", "Rei"],
    ],
  },
} as const;

export const TAROT_CARD_CATALOG: TarotCardShell[] = [
  ...majorArcana.map(([key, name], index) => ({
    key,
    name,
    arcana: "major" as const,
    number: index,
    assetPath: `/assets/${key}.webp`,
  })),
  ...Object.entries(suits).flatMap(([suit, config]) =>
    config.ranks.map(([rank, rankLabel]) => ({
      key: `${suit}-${rank}`,
      name: `${rankLabel} de ${config.label}`,
      arcana: "minor" as const,
      suit: suit as TarotSuit,
      rank,
      assetPath: `/assets/${suit}-${rank}.webp`,
    }))
  ),
];

export const EXPECTED_TAROT_ASSET_PATHS = TAROT_CARD_CATALOG.map(
  (card) => card.assetPath
);

export function getTarotShellByName(name: string) {
  return TAROT_CARD_CATALOG.find((card) => card.name === name);
}
