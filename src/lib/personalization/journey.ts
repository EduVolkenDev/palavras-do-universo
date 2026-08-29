import { getProfileCompletion, type ReadingProfile } from "./reading-context";

/**
 * Domain inputs accepted from both Supabase responses and localUniverse
 * payloads. This module deliberately does not know about a page or a
 * persistence layer, so the same journey model can feed Meu Universo and
 * Lume without duplicating parsing rules.
 */
export type JourneyReadingRecord = {
  theme?: unknown;
  question?: unknown;
  spread?: unknown;
  created_at?: unknown;
};

export type JourneyMessageRecord = {
  message_type?: unknown;
  payload?: unknown;
  created_at?: unknown;
};

export type JourneyPattern = {
  key: string;
  label: string;
  count: number;
  lastSeenAt: string | null;
};

export type JourneySnapshot = {
  totalSignals: number;
  readingCount: number;
  savedMessageCount: number;
  hasHistory: boolean;
  lastEntryAt: string | null;
  themes: JourneyPattern[];
  cards: JourneyPattern[];
  recurringThemes: JourneyPattern[];
  recurringCards: JourneyPattern[];
  recentThemes: string[];
  focusMatches: string[];
  profileCompletion: number;
};

export type JourneyRecommendation = {
  kind:
    | "calibrate_profile"
    | "open_first_reading"
    | "review_pattern"
    | "continue_thread";
  signal: string;
  patternKey?: string;
};

type Signal = {
  key: string;
  label: string;
  seenAt: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeKey(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(value: unknown) {
  const raw = asString(value);
  if (!raw) return null;

  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function addSignal(signals: Signal[], label: unknown, seenAt: unknown) {
  const cleanLabel = asString(label).slice(0, 120);
  const key = normalizeKey(cleanLabel);
  if (!key) return;

  signals.push({
    key,
    label: cleanLabel,
    seenAt: normalizeDate(seenAt),
  });
}

function spreadCards(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    return [asString(item.name) || asString(item.cardKey || item.card_key)].filter(Boolean);
  });
}

function messageCards(message: JourneyMessageRecord) {
  if (!isRecord(message.payload)) return [];

  if (message.message_type === "daily_card" && isRecord(message.payload.card)) {
    return [asString(message.payload.card.name)].filter(Boolean);
  }

  if (message.message_type === "reading") {
    return spreadCards(message.payload.spreadCards || message.payload.spread_cards);
  }

  return [];
}

function messageTheme(message: JourneyMessageRecord) {
  if (!isRecord(message.payload)) return "";
  return asString(message.payload.theme);
}

function rankSignals(signals: Signal[]): JourneyPattern[] {
  const grouped = new Map<string, JourneyPattern>();

  signals.forEach((signal) => {
    const existing = grouped.get(signal.key);
    if (!existing) {
      grouped.set(signal.key, {
        key: signal.key,
        label: signal.label,
        count: 1,
        lastSeenAt: signal.seenAt,
      });
      return;
    }

    existing.count += 1;
    if (
      signal.seenAt &&
      (!existing.lastSeenAt || signal.seenAt > existing.lastSeenAt)
    ) {
      existing.lastSeenAt = signal.seenAt;
    }
  });

  return [...grouped.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "");
    })
    .slice(0, 8);
}

function sortedDates(values: Array<string | null>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));
}

function sharesMeaningfulToken(left: string, right: string) {
  const leftTokens = left.split(" ").filter((token) => token.length > 2);
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));
  return leftTokens.some((token) => rightTokens.has(token));
}

function profileFocusMatches(profile: ReadingProfile, readings: JourneyReadingRecord[]) {
  const searchable = readings
    .flatMap((reading) => [asString(reading.theme), asString(reading.question)])
    .map(normalizeKey)
    .filter(Boolean);

  return profile.focusAreas.filter((focus) => {
    const key = normalizeKey(focus);
    return (
      key &&
      searchable.some(
        (value) =>
          value.includes(key) ||
          key.includes(value) ||
          sharesMeaningfulToken(key, value)
      )
    );
  });
}

export function buildJourneySnapshot(
  readings: JourneyReadingRecord[],
  messages: JourneyMessageRecord[],
  profile: ReadingProfile
): JourneySnapshot {
  const themeSignals: Signal[] = [];
  const cardSignals: Signal[] = [];
  const entryDates: Array<string | null> = [];

  readings.forEach((reading) => {
    const seenAt = reading.created_at;
    addSignal(themeSignals, reading.theme, seenAt);
    spreadCards(reading.spread).forEach((card) => addSignal(cardSignals, card, seenAt));
    entryDates.push(normalizeDate(seenAt));
  });

  messages.forEach((message) => {
    const seenAt = message.created_at;
    addSignal(themeSignals, messageTheme(message), seenAt);
    messageCards(message).forEach((card) => addSignal(cardSignals, card, seenAt));
    entryDates.push(normalizeDate(seenAt));
  });

  const themes = rankSignals(themeSignals);
  const cards = rankSignals(cardSignals);

  return {
    totalSignals: readings.length + messages.length,
    readingCount: readings.length,
    savedMessageCount: messages.length,
    hasHistory: readings.length > 0 || messages.length > 0,
    lastEntryAt: sortedDates(entryDates)[0] ?? null,
    themes,
    cards,
    recurringThemes: themes.filter((pattern) => pattern.count > 1),
    recurringCards: cards.filter((pattern) => pattern.count > 1),
    recentThemes: themeSignals
      .filter((signal) => signal.label && signal.seenAt)
      .sort((a, b) => (b.seenAt ?? "").localeCompare(a.seenAt ?? ""))
      .map((signal) => signal.label)
      .filter((label, index, values) => values.indexOf(label) === index)
      .slice(0, 3),
    focusMatches: profileFocusMatches(profile, readings),
    profileCompletion: getProfileCompletion(profile),
  };
}

export function getJourneyRecommendations(
  snapshot: JourneySnapshot
): JourneyRecommendation[] {
  const recommendations: JourneyRecommendation[] = [];

  if (snapshot.profileCompletion < 4) {
    recommendations.push({
      kind: "calibrate_profile",
      signal: "profile_incomplete",
    });
  }

  if (!snapshot.hasHistory) {
    recommendations.push({
      kind: "open_first_reading",
      signal: "history_empty",
    });
    return recommendations;
  }

  const recurringPattern = snapshot.recurringThemes[0] ?? snapshot.recurringCards[0];
  if (recurringPattern) {
    recommendations.push({
      kind: "review_pattern",
      signal: "pattern_returned",
      patternKey: recurringPattern.key,
    });
  }

  if (snapshot.recentThemes.length) {
    recommendations.push({
      kind: "continue_thread",
      signal: "recent_context",
      patternKey: normalizeKey(snapshot.recentThemes[0]),
    });
  }

  return recommendations;
}
