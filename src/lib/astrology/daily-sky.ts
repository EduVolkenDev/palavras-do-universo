import { calculatePlanetPositionsAt, type NatalAspectType, type NatalBody, type NatalPosition, type ZodiacSign } from "./natal-chart.ts";

export type DailyTone = "supportive" | "attention" | "intensified";

export type DailyTransit = {
  transitBody: NatalBody;
  transitSign: ZodiacSign;
  natalBody: NatalBody;
  natalSign: ZodiacSign;
  natalHouse: number | null;
  type: NatalAspectType;
  orb: number;
  tone: DailyTone;
};

export type DailySky = {
  localDate: string;
  timezone: string;
  snapshotAtISO: string;
  positions: Array<Pick<NatalPosition, "body" | "sign" | "degreesInSign">>;
  transits: DailyTransit[];
  access: "preview" | "circle";
};

const aspectAngles: Array<{ type: NatalAspectType; angle: number; tone: DailyTone }> = [
  { type: "conjunction", angle: 0, tone: "intensified" },
  { type: "sextile", angle: 60, tone: "supportive" },
  { type: "square", angle: 90, tone: "attention" },
  { type: "trine", angle: 120, tone: "supportive" },
  { type: "opposition", angle: 180, tone: "attention" },
];

function localDateAt(instant: Date, timezone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function angularDistance(first: number, second: number) {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

export function calculateDailyTransits(today: NatalPosition[], natal: NatalPosition[]): DailyTransit[] {
  const hits: DailyTransit[] = [];
  for (const transit of today) {
    for (const birth of natal) {
      const distance = angularDistance(transit.longitude, birth.longitude);
      const closest = aspectAngles
        .map((aspect) => ({ ...aspect, orb: Math.abs(distance - aspect.angle) }))
        .sort((first, second) => first.orb - second.orb)[0];
      // A tighter orb keeps a daily snapshot focused on the relationships actually near exact.
      const maxOrb = transit.body === "Moon" ? 3 : 2;
      if (closest.orb > maxOrb) continue;
      hits.push({
        transitBody: transit.body,
        transitSign: transit.sign,
        natalBody: birth.body,
        natalSign: birth.sign,
        natalHouse: birth.house,
        type: closest.type,
        orb: Number(closest.orb.toFixed(2)),
        tone: closest.tone,
      });
    }
  }
  return hits.sort((first, second) => first.orb - second.orb || first.transitBody.localeCompare(second.transitBody));
}

export function calculateDailySky(natalPositions: NatalPosition[], now: Date, timezone: string, circleAccess: boolean): DailySky {
  if (Number.isNaN(now.getTime())) throw new Error("Invalid current date");
  const localDate = localDateAt(now, timezone);
  const positions = calculatePlanetPositionsAt(now);
  return {
    localDate,
    timezone,
    snapshotAtISO: now.toISOString(),
    positions: positions.map(({ body, sign, degreesInSign }) => ({ body, sign, degreesInSign })),
    transits: circleAccess ? calculateDailyTransits(positions, natalPositions) : [],
    access: circleAccess ? "circle" : "preview",
  };
}
