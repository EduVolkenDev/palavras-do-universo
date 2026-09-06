import type { JourneySnapshot } from "./journey";
import type { LabPracticeContinuity } from "@/lib/lab/practice";

export const READING_PROFILE_VERSION = "pdu-reading-profile-v2";

const MAX_FOCUS_AREAS = 6;
const MAX_BOUNDARIES = 6;

export type ReadingProfile = {
  displayName: string;
  focusAreas: string[];
  currentPhase: string;
  guidanceTone: string;
  desiredShift: string;
  boundaries: string[];
  contextNote: string;
};

export type PersonalizationSignals = {
  profileCompletion: number;
  profileComplete: boolean;
  hasExplicitContext: boolean;
  focusAreas: string[];
  currentPhase: string;
  guidanceTone: string;
  desiredShift: string;
  boundaries: string[];
  contextNote: string;
};

export type ActiveReadingCardContext = {
  cardKey: string;
  position: string;
  name: string;
  reversed: boolean;
  keyword: string;
  meaning: string;
  coreMeaning: string;
  lifeQuestion: string;
};

export type ActiveReadingContext = {
  readingId: string | null;
  locale: string;
  theme: string;
  productKey: string;
  spreadType: string;
  spreadLabel: string;
  question: string;
  spreadLine: string;
  cards: ActiveReadingCardContext[];
  result: string;
  updatedAt: string;
};

export type UserContext = {
  readingProfile: ReadingProfile;
  personalizationSignals: PersonalizationSignals;
  source: "remote" | "local" | "none";
  journey?: JourneySnapshot;
  practiceContinuity?: LabPracticeContinuity;
  activeReading?: ActiveReadingContext;
};

export type PersistedReadingProfile = ReadingProfile & {
  completedAt: string;
  version: string;
};

export const EMPTY_READING_PROFILE: ReadingProfile = {
  displayName: "",
  focusAreas: [],
  currentPhase: "",
  guidanceTone: "",
  desiredShift: "",
  boundaries: [],
  contextNote: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function trimText(value: unknown, max: number) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";
}

function trimReadingResult(value: unknown, max: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.trim().replace(/\s+/g, " "))
        .join("\n")
        .trim()
        .slice(0, max)
    : "";
}

function stringList(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => trimText(item, 64))
    .filter(Boolean)
    .slice(0, maxItems);
}

function firstString(...values: unknown[]) {
  return values.map((value) => trimText(value, 500)).find(Boolean) ?? "";
}

/**
 * Reads both the v1 profile payload and the legacy profile columns returned by
 * Supabase. This is the only boundary where profile data should be shaped.
 */
export function normalizeReadingProfile(value: unknown): ReadingProfile {
  if (!isRecord(value)) return { ...EMPTY_READING_PROFILE };

  const nested = isRecord(value.reading_profile) ? value.reading_profile : {};
  const source = Object.keys(nested).length ? nested : value;

  return {
    displayName: firstString(source.displayName, value.display_name).slice(0, 80),
    focusAreas:
      stringList(source.focusAreas, MAX_FOCUS_AREAS).length > 0
        ? stringList(source.focusAreas, MAX_FOCUS_AREAS)
        : stringList(value.favorite_themes, MAX_FOCUS_AREAS),
    currentPhase: firstString(source.currentPhase, value.emotional_phase).slice(0, 120),
    guidanceTone: firstString(source.guidanceTone).slice(0, 120),
    desiredShift: firstString(source.desiredShift).slice(0, 140),
    boundaries: stringList(source.boundaries, MAX_BOUNDARIES),
    contextNote: firstString(source.contextNote).slice(0, 500),
  };
}

function normalizeActiveReadingCard(value: unknown): ActiveReadingCardContext | null {
  if (!isRecord(value)) return null;

  const name = trimText(value.name, 120);
  const position = trimText(value.position, 120);
  if (!name || !position) return null;

  return {
    cardKey: trimText(value.cardKey ?? value.card_key, 120) || name,
    position,
    name,
    reversed: value.reversed === true,
    keyword: trimText(value.keyword, 120),
    meaning: trimText(value.meaning, 700),
    coreMeaning: trimText(value.coreMeaning ?? value.core_meaning, 700),
    lifeQuestion: trimText(value.lifeQuestion ?? value.life_question, 400),
  };
}

export function normalizeActiveReading(value: unknown): ActiveReadingContext | null {
  if (!isRecord(value)) return null;

  const cardSource = value.spreadCards ?? value.spread_cards;
  const cards = Array.isArray(cardSource)
    ? cardSource
        .flatMap((card) => {
          const normalized = normalizeActiveReadingCard(card);
          return normalized ? [normalized] : [];
        })
        .slice(0, 12)
    : [];
  const question = trimText(value.question, 600);
  const result = trimReadingResult(value.result ?? value.interpretation, 8000);
  if (!question && !result && !cards.length) return null;

  return {
    readingId: trimText(value.readingId ?? value.reading_id, 120) || null,
    locale: trimText(value.locale, 32) || "pt-BR",
    theme: trimText(value.theme, 120),
    productKey: trimText(value.productKey ?? value.product_key, 120),
    spreadType: trimText(value.spreadType ?? value.spread_type, 120),
    spreadLabel: trimText(value.spreadLabel ?? value.spread_label, 180),
    question,
    spreadLine: trimText(value.spreadLine ?? value.spread_line, 1200),
    cards,
    result,
    updatedAt: trimText(value.updatedAt ?? value.updated_at ?? value.savedAt, 80),
  };
}

export function getProfileCompletion(profile: ReadingProfile) {
  return [
    profile.displayName,
    profile.focusAreas.length ? "focus" : "",
    profile.currentPhase,
    profile.guidanceTone,
    profile.desiredShift,
  ].filter(Boolean).length;
}

export function hasProfileSignal(profile: ReadingProfile) {
  return (
    getProfileCompletion(profile) > 0 ||
    profile.boundaries.length > 0 ||
    Boolean(profile.contextNote.trim())
  );
}

export function getPersonalizationSignals(
  profile: ReadingProfile
): PersonalizationSignals {
  const profileCompletion = getProfileCompletion(profile);

  return {
    profileCompletion,
    profileComplete: profileCompletion >= 4,
    hasExplicitContext: hasProfileSignal(profile),
    focusAreas: profile.focusAreas,
    currentPhase: profile.currentPhase,
    guidanceTone: profile.guidanceTone,
    desiredShift: profile.desiredShift,
    boundaries: profile.boundaries,
    contextNote: profile.contextNote,
  };
}

export function createUserContext(
  value: unknown,
  source: UserContext["source"] = "none",
  journey?: JourneySnapshot,
  practiceContinuity?: LabPracticeContinuity,
  activeReading?: ActiveReadingContext
): UserContext {
  const readingProfile = normalizeReadingProfile(value);

  return {
    readingProfile,
    personalizationSignals: getPersonalizationSignals(readingProfile),
    source,
    journey,
    practiceContinuity,
    activeReading,
  };
}

export function toPersistedReadingProfile(
  profile: ReadingProfile,
  completedAt = new Date().toISOString()
): PersistedReadingProfile {
  return {
    ...normalizeReadingProfile(profile),
    completedAt,
    version: READING_PROFILE_VERSION,
  };
}

export function formatPersonalizationMemory(context: UserContext) {
  const { readingProfile: profile, personalizationSignals: signals } = context;
  const lines: string[] = [];

  if (profile.displayName) lines.push(`Nome escolhido pela pessoa: ${profile.displayName}.`);
  if (signals.focusAreas.length) {
    lines.push(`Áreas de foco declaradas: ${signals.focusAreas.join(", ")}.`);
  }
  if (signals.currentPhase) lines.push(`Fase atual declarada: ${signals.currentPhase}.`);
  if (signals.guidanceTone) {
    lines.push(`Tom preferido para orientação: ${signals.guidanceTone}.`);
  }
  if (signals.desiredShift) lines.push(`Mudança desejada: ${signals.desiredShift}.`);
  if (signals.boundaries.length) {
    lines.push(`Evitar nas leituras: ${signals.boundaries.join(", ")}.`);
  }
  if (signals.contextNote) {
    lines.push(`Contexto livre informado pela pessoa: "${signals.contextNote.slice(0, 260)}".`);
  }

  return lines;
}
