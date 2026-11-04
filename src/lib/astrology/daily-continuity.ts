export type DailyCheckIn = {
  id: string;
  localDate: string;
  timezone: string;
  nextStep: string;
  gesture: string;
  reflection: string;
  createdAt: string;
  followupText: string | null;
  followupAt: string | null;
};

export function localDateAt(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function daysSince(localDate: string, timezone: string, now = new Date()): number {
  const current = localDateAt(now, timezone);
  const start = Date.parse(`${localDate}T00:00:00Z`);
  const end = Date.parse(`${current}T00:00:00Z`);
  return Math.floor((end - start) / 86_400_000);
}

export function cleanPersonalText(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ");
  return clean && clean.length <= max ? clean : null;
}

export function isDailyCheckIn(value: unknown): value is DailyCheckIn {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(String(item.localDate)) &&
    typeof item.timezone === "string" && typeof item.nextStep === "string" &&
    typeof item.gesture === "string" && typeof item.reflection === "string" &&
    typeof item.createdAt === "string" &&
    (item.followupText === null || typeof item.followupText === "string") &&
    (item.followupAt === null || typeof item.followupAt === "string");
}
