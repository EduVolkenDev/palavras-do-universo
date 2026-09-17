import {
  Body,
  Ecliptic,
  GeoVector,
  SiderealTime,
  SunPosition,
} from "astronomy-engine";
import type { AstrologyBirthDataPayload } from "./birth-data";

export const ASTROLOGY_FULL_PRODUCT_KEY = "mapa_astral";

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type NatalBody =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

export type NatalAspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface NatalPosition {
  body: NatalBody;
  longitude: number;
  sign: ZodiacSign;
  degreesInSign: number;
  house: number;
}

export interface NatalAspect {
  id: string;
  firstBody: NatalBody;
  secondBody: NatalBody;
  type: NatalAspectType;
  exactAngle: number;
  orb: number;
}

export interface NatalChart {
  calculatedAtISO: string;
  timezone: string;
  locationLabel: string;
  houseSystem: "whole-sign";
  ascendant: {
    longitude: number;
    sign: ZodiacSign;
    degreesInSign: number;
  };
  positions: NatalPosition[];
  aspects: NatalAspect[];
  limitations: string[];
}

const zodiacSigns: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const bodies: Array<{ body: NatalBody; astronomyBody: Body }> = [
  { body: "Sun", astronomyBody: Body.Sun },
  { body: "Moon", astronomyBody: Body.Moon },
  { body: "Mercury", astronomyBody: Body.Mercury },
  { body: "Venus", astronomyBody: Body.Venus },
  { body: "Mars", astronomyBody: Body.Mars },
  { body: "Jupiter", astronomyBody: Body.Jupiter },
  { body: "Saturn", astronomyBody: Body.Saturn },
  { body: "Uranus", astronomyBody: Body.Uranus },
  { body: "Neptune", astronomyBody: Body.Neptune },
  { body: "Pluto", astronomyBody: Body.Pluto },
];

const aspectDefinitions: Array<{ type: NatalAspectType; angle: number; maxOrb: number }> = [
  { type: "conjunction", angle: 0, maxOrb: 8 },
  { type: "opposition", angle: 180, maxOrb: 8 },
  { type: "trine", angle: 120, maxOrb: 7 },
  { type: "square", angle: 90, maxOrb: 6 },
  { type: "sextile", angle: 60, maxOrb: 5 },
];

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function zodiacFromLongitude(longitude: number): ZodiacSign {
  return zodiacSigns[Math.floor(normalizeDegrees(longitude) / 30)];
}

function positionFor(body: NatalBody, astronomyBody: Body, date: Date) {
  const longitude = normalizeDegrees(
    body === "Sun"
      ? SunPosition(date).elon
      : Ecliptic(GeoVector(astronomyBody, date, true)).elon,
  );

  return {
    body,
    longitude,
    sign: zodiacFromLongitude(longitude),
    degreesInSign: Number((longitude % 30).toFixed(2)),
  };
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function ascendantLongitude(date: Date, latitude: number, longitude: number) {
  const localSiderealDegrees = normalizeDegrees(SiderealTime(date) * 15 + longitude);
  const obliquity = degreesToRadians(23.4392911);
  const latitudeRadians = degreesToRadians(latitude);
  const siderealRadians = degreesToRadians(localSiderealDegrees);
  const y = Math.cos(siderealRadians);
  const x =
    -(Math.sin(obliquity) * Math.tan(latitudeRadians) +
      Math.cos(obliquity) * Math.sin(siderealRadians));

  return normalizeDegrees(radiansToDegrees(Math.atan2(y, x)));
}

function addHouses<T extends { longitude: number }>(positions: T[], ascendant: number) {
  const firstHouseStart = Math.floor(ascendant / 30) * 30;
  return positions.map((position) => ({
    ...position,
    house: Math.floor(normalizeDegrees(position.longitude - firstHouseStart) / 30) + 1,
  }));
}

function shortestDistance(first: number, second: number) {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function calculateAspects(positions: NatalPosition[]): NatalAspect[] {
  const aspects: NatalAspect[] = [];

  for (let firstIndex = 0; firstIndex < positions.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < positions.length; secondIndex += 1) {
      const first = positions[firstIndex];
      const second = positions[secondIndex];
      const distance = shortestDistance(first.longitude, second.longitude);
      const match = aspectDefinitions
        .map((definition) => ({ ...definition, orb: Math.abs(distance - definition.angle) }))
        .filter((definition) => definition.orb <= definition.maxOrb)
        .sort((a, b) => a.orb - b.orb)[0];

      if (!match) continue;
      aspects.push({
        id: `${first.body}-${match.type}-${second.body}`,
        firstBody: first.body,
        secondBody: second.body,
        type: match.type,
        exactAngle: Number(distance.toFixed(2)),
        orb: Number(match.orb.toFixed(2)),
      });
    }
  }

  return aspects.sort((first, second) => first.orb - second.orb);
}

export function calculateNatalChart(birthData: AstrologyBirthDataPayload): NatalChart {
  const date = new Date(birthData.timeResolution.utcISO);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid birth date");

  const ascendantLongitudeValue = ascendantLongitude(
    date,
    birthData.location.latitude,
    birthData.location.longitude,
  );
  const positions = addHouses(
    bodies.map(({ body, astronomyBody }) => positionFor(body, astronomyBody, date)),
    ascendantLongitudeValue,
  );

  return {
    calculatedAtISO: date.toISOString(),
    timezone: birthData.timezone,
    locationLabel: birthData.location.label,
    houseSystem: "whole-sign",
    ascendant: {
      longitude: Number(ascendantLongitudeValue.toFixed(2)),
      sign: zodiacFromLongitude(ascendantLongitudeValue),
      degreesInSign: Number((ascendantLongitudeValue % 30).toFixed(2)),
    },
    positions,
    aspects: calculateAspects(positions),
    limitations: [
      "O primeiro mapa usa casas de signo inteiro, com os mesmos 12 setores para todas as pessoas.",
      "A leitura é simbólica: ela amplia reflexão e contexto, mas não determina acontecimentos ou escolhas.",
    ],
  };
}
