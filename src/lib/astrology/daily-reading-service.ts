import { createHash, randomUUID } from "node:crypto";
import {
  DAILY_READING_VERSION, DAILY_READING_RETRY_SECONDS, parseDailyReadingContent,
  type DailyReadingInput, type DailyReadingResult, type SavedDailyReading,
} from "./daily-reading.ts";

export function dailyReadingCacheKey(input: DailyReadingInput) {
  // Do not include the moving sky timestamp: refreshes must reuse today's reading.
  return createHash("sha256").update(JSON.stringify({
    version: DAILY_READING_VERSION,
    userId: input.userId,
    date: input.sky.localDate,
    timezone: input.sky.timezone,
    locale: input.locale,
    natal: { positions: input.chart.positions, ascendant: input.chart.ascendant, precision: input.chart.timePrecision },
  })).digest("hex");
}

export type DailyReadingStore = {
  read: (key: string) => Promise<SavedDailyReading | null>;
  claim: (key: string, token: string) => Promise<boolean>;
  allowGeneration: () => Promise<boolean>;
  complete: (key: string, token: string, reading: SavedDailyReading) => Promise<boolean>;
  fail: (key: string, token: string) => Promise<void>;
  retryAfter: (key: string) => Promise<number>;
};

export async function getOrGenerateDailyReading(input: DailyReadingInput, dependencies: {
  store: DailyReadingStore;
  generate: (input: DailyReadingInput, requestId: string) => Promise<string>;
  now?: () => Date;
  onFailure?: () => void;
}): Promise<DailyReadingResult> {
  if (input.sky.access !== "circle") throw new Error("Circle access required");
  const { store } = dependencies;
  const key = dailyReadingCacheKey(input);
  const saved = await store.read(key);
  if (saved) return { status: "ready", reading: saved };
  const token = randomUUID();
  if (!await store.claim(key, token)) {
    // A concurrent worker might have finished between our read and claim.
    const ready = await store.read(key);
    if (ready) return { status: "ready", reading: ready };
    const retryAfterSeconds = await store.retryAfter(key);
    return { status: retryAfterSeconds <= 5 ? "pending" : "unavailable", retryAfterSeconds };
  }
  try {
    if (!await store.allowGeneration()) throw new Error("Daily AI budget unavailable");
    const text = await dependencies.generate(input, `${key}:${token}`);
    const reading: SavedDailyReading = {
      content: parseDailyReadingContent(text, input.sky),
      localDate: input.sky.localDate,
      timezone: input.sky.timezone,
      locale: input.locale,
      generatedAtISO: (dependencies.now?.() ?? new Date()).toISOString(),
      natalTimePrecision: input.chart.timePrecision,
      sky: input.sky,
    };
    if (!await store.complete(key, token, reading)) {
      // Never return an answer that was not persisted or whose lease was replaced.
      const winner = await store.read(key);
      return winner ? { status: "ready", reading: winner } : { status: "pending", retryAfterSeconds: 4 };
    }
    return { status: "ready", reading };
  } catch {
    dependencies.onFailure?.();
    await store.fail(key, token);
    return { status: "unavailable", retryAfterSeconds: DAILY_READING_RETRY_SECONDS };
  }
}
