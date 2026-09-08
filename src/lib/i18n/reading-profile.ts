import type { Locale } from "@/lib/i18n/config";

// These values are persisted in reading profiles and sent as stable context to the reading API.
// Keep them canonical; localize only their display labels at the UI boundary.
export const READING_PROFILE_FOCUS_AREAS = [
  "Amor e vínculos",
  "Carreira",
  "Dinheiro",
  "Família",
  "Propósito",
  "Espiritualidade",
];

export const READING_PROFILE_PHASES = [
  "Começando um ciclo",
  "Encerrando algo",
  "Esperando uma resposta",
  "Reorganizando a vida",
  "Tomando uma decisão",
  "Cuidando da energia",
];

export const READING_PROFILE_GUIDANCE_TONES = [
  "Direta e prática",
  "Acolhedora",
  "Profunda e simbólica",
  "Calma e objetiva",
];

export const READING_PROFILE_DESIRED_SHIFTS = [
  "Clareza para decidir",
  "Coragem para agir",
  "Calma para atravessar",
  "Fechamento de ciclo",
  "Mais honestidade comigo",
];

export const READING_PROFILE_BOUNDARIES = [
  "Sem fatalismo",
  "Sem respostas longas",
  "Sem romantizar ansiedade",
  "Sem tom duro",
  "Sem jargão esotérico",
];

const READING_PROFILE_LABELS: Record<string, Record<Locale, string>> = {
  "Amor e vínculos": { "pt-BR": "Amor e vínculos", en: "Love and bonds" },
  Carreira: { "pt-BR": "Carreira", en: "Career" },
  Dinheiro: { "pt-BR": "Dinheiro", en: "Money" },
  Família: { "pt-BR": "Família", en: "Family" },
  Propósito: { "pt-BR": "Propósito", en: "Purpose" },
  Espiritualidade: { "pt-BR": "Espiritualidade", en: "Spirituality" },
  "Começando um ciclo": { "pt-BR": "Começando um ciclo", en: "Starting a cycle" },
  "Encerrando algo": { "pt-BR": "Encerrando algo", en: "Closing something" },
  "Esperando uma resposta": {
    "pt-BR": "Esperando uma resposta",
    en: "Waiting for an answer",
  },
  "Reorganizando a vida": {
    "pt-BR": "Reorganizando a vida",
    en: "Reorganizing life",
  },
  "Tomando uma decisão": { "pt-BR": "Tomando uma decisão", en: "Making a decision" },
  "Cuidando da energia": { "pt-BR": "Cuidando da energia", en: "Caring for your energy" },
  "Direta e prática": { "pt-BR": "Direta e prática", en: "Direct and practical" },
  Acolhedora: { "pt-BR": "Acolhedora", en: "Warm and supportive" },
  "Profunda e simbólica": { "pt-BR": "Profunda e simbólica", en: "Deep and symbolic" },
  "Calma e objetiva": { "pt-BR": "Calma e objetiva", en: "Calm and clear" },
  "Clareza para decidir": { "pt-BR": "Clareza para decidir", en: "Clarity to decide" },
  "Coragem para agir": { "pt-BR": "Coragem para agir", en: "Courage to act" },
  "Calma para atravessar": { "pt-BR": "Calma para atravessar", en: "Calm to move through" },
  "Fechamento de ciclo": { "pt-BR": "Fechamento de ciclo", en: "Closing a cycle" },
  "Mais honestidade comigo": {
    "pt-BR": "Mais honestidade comigo",
    en: "More honesty with myself",
  },
  "Sem fatalismo": { "pt-BR": "Sem fatalismo", en: "No fatalism" },
  "Sem respostas longas": { "pt-BR": "Sem respostas longas", en: "No long answers" },
  "Sem romantizar ansiedade": {
    "pt-BR": "Sem romantizar ansiedade",
    en: "Do not romanticize anxiety",
  },
  "Sem tom duro": { "pt-BR": "Sem tom duro", en: "No harsh tone" },
  "Sem jargão esotérico": { "pt-BR": "Sem jargão esotérico", en: "No esoteric jargon" },
};

export function localizeReadingProfileValue(value: string, locale: Locale) {
  return READING_PROFILE_LABELS[value]?.[locale] ?? value;
}
