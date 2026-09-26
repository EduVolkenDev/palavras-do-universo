import type { NatalBody, NatalPosition, ZodiacSign } from "./natal-chart.ts";
import { getBodyInterpretation, getHouseInterpretation, getSignInterpretation, type AstrologyLocale } from "./interpretations.ts";

// The seven classical rulers remain visible alongside the three modern associations.
const rulerships: Record<NatalBody, { primary: ZodiacSign[]; traditional?: ZodiacSign[] }> = {
  Sun: { primary: ["leo"] },
  Moon: { primary: ["cancer"] },
  Mercury: { primary: ["gemini", "virgo"] },
  Venus: { primary: ["taurus", "libra"] },
  Mars: { primary: ["aries"], traditional: ["scorpio"] },
  Jupiter: { primary: ["sagittarius"], traditional: ["pisces"] },
  Saturn: { primary: ["capricorn"], traditional: ["aquarius"] },
  Uranus: { primary: ["aquarius"] },
  Neptune: { primary: ["pisces"] },
  Pluto: { primary: ["scorpio"] },
};

export function getPlanetRulership(body: NatalBody) {
  return rulerships[body];
}

export function describePlanetRulership(body: NatalBody, locale: AstrologyLocale) {
  const rulership = getPlanetRulership(body);
  const names = (signs: ZodiacSign[]) => signs.map((sign) => getSignInterpretation(sign, locale).label).join(locale === "en" ? " and " : " e ");
  const primary = names(rulership.primary);
  const traditional = rulership.traditional ? names(rulership.traditional) : null;
  if (locale === "en") {
    return traditional
      ? `${body} rules ${primary} and traditionally also rules ${traditional}.`
      : `${body} rules ${primary}${["Uranus", "Neptune", "Pluto"].includes(body) ? " in modern astrology" : ""}.`;
  }
  const label = getBodyInterpretation(body, locale).label;
  return traditional
    ? `${label} rege ${primary} e, na tradição, também ${traditional}.`
    : `${label} rege ${primary}${["Uranus", "Neptune", "Pluto"].includes(body) ? " na astrologia moderna" : ""}.`;
}

export function describePersonalRulership(position: NatalPosition, locale: AstrologyLocale) {
  const body = getBodyInterpretation(position.body, locale);
  const ruledSigns = [
    ...getPlanetRulership(position.body).primary,
    ...(getPlanetRulership(position.body).traditional ?? []),
  ];
  const signNames = ruledSigns.map((sign) => getSignInterpretation(sign, locale).label).join(locale === "en" ? " and " : " e ");
  const positionSign = getSignInterpretation(position.sign, locale).label;
  const house = position.house === null ? null : getHouseInterpretation(position.house, locale);
  if (locale === "en") {
    return `${body.label} carries the themes of ${signNames} through ${positionSign}${house ? ` and ${house.label} (${house.area})` : ""} in your birth chart. This links those ruled signs to how ${body.archetype} takes form for you; it does not mean every event in those areas is caused by this planet.`;
  }
  return `${body.label} leva os temas de ${signNames} para ${positionSign}${house ? ` e para a ${house.label} (${house.area})` : ""} no seu mapa natal. Isso relaciona os signos regidos à forma como ${body.archetype} se expressam em você; não significa que o planeta cause cada acontecimento nessas áreas.`;
}
