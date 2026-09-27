import type { DailySky, DailyTone } from "./daily-sky.ts";
import type { NatalChart } from "./natal-chart.ts";

export const DAILY_READING_VERSION = "lume-astrology-daily-v1";
export const DAILY_READING_RETRY_SECONDS = 300;
export type DailyReadingLocale = "pt-BR" | "en";
export type DailyReadingContent = {
  overview: string;
  influences: Array<{ transitId: string; text: string }>;
  nextStep: string;
};
export type DailyReadingInput = {
  userId: string;
  locale: DailyReadingLocale;
  chart: NatalChart;
  sky: DailySky;
};
export type SavedDailyReading = {
  content: DailyReadingContent;
  localDate: string;
  timezone: string;
  locale: DailyReadingLocale;
  generatedAtISO: string;
  natalTimePrecision: NatalChart["timePrecision"];
  sky: DailySky;
};
export type DailyReadingResult =
  | { status: "ready"; reading: SavedDailyReading }
  | { status: "pending" | "unavailable"; retryAfterSeconds: number };

export function dailyTransitId(transit: { transitBody: string; type: string; natalBody: string }) {
  return `${transit.transitBody}-${transit.type}-${transit.natalBody}`;
}

export function selectDailyReadingTransits(sky: DailySky) {
  // Keep each available tone represented, rather than letting one tone crowd out the others.
  return (["supportive", "attention", "intensified"] as DailyTone[])
    .flatMap((tone) => sky.transits.filter((transit) => transit.tone === tone).slice(0, 2));
}

export function parseDailyReadingContent(text: string, sky: DailySky): DailyReadingContent {
  const value: unknown = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  if (!value || typeof value !== "object") throw new Error("Invalid daily reading object");
  const content = value as Record<string, unknown>;
  function paragraph(value: unknown, min: number, max: number) {
    if (typeof value !== "string") throw new Error("Invalid daily reading paragraph");
    const clean = value.trim();
    if (clean.length < min || clean.length > max || /<[^>]+>|https?:\/\//i.test(clean)) {
      throw new Error("Invalid daily reading paragraph");
    }
    return clean;
  }
  const transits = selectDailyReadingTransits(sky);
  const allowed = new Set(transits.map(dailyTransitId));
  if (!Array.isArray(content.influences) || content.influences.length !== allowed.size) {
    throw new Error("Daily reading must explain exactly the supplied transits");
  }
  const used = new Set<string>();
  const influences = content.influences.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid daily influence");
    const entry = item as Record<string, unknown>;
    if (typeof entry.transitId !== "string" || !allowed.has(entry.transitId) || used.has(entry.transitId)) {
      throw new Error("Daily reading referenced an uncalculated transit");
    }
    used.add(entry.transitId);
    return { transitId: entry.transitId, text: paragraph(entry.text, 30, 700) };
  });
  return { overview: paragraph(content.overview, 60, 1_200), influences, nextStep: paragraph(content.nextStep, 20, 400) };
}
