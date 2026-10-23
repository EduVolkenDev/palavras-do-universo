export type TarotEditorialText = {
  artwork: string;
  upright: string;
  reversed: string;
  example: string;
  comparison: string;
};

export type TarotCardEditorial = {
  relatedKey: string;
  pt: TarotEditorialText;
  en: TarotEditorialText;
};

// Each tuple is authored per card, not expanded from keywords or a suit template.
type EditorialPassages = [
  artwork: string,
  upright: string,
  reversed: string,
  example: string,
  comparison: string,
];

export function editorial(
  relatedKey: string,
  pt: EditorialPassages,
  en: EditorialPassages,
): TarotCardEditorial {
  const passages = ([artwork, upright, reversed, example, comparison]: EditorialPassages): TarotEditorialText =>
    ({ artwork, upright, reversed, example, comparison });
  return { relatedKey, pt: passages(pt), en: passages(en) };
}
