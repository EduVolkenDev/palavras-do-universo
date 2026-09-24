import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAstrologyBirthTime, type BirthTimeDisambiguation, type ServerBirthTimeResolution } from "./time-resolution";

export const ASTROLOGY_BIRTH_CALCULATION_VERSION = "birth-time-iana-v1";

export type BirthPrecision = "exact" | "approximate" | "unknown";
type DaylightSavingStatus = "active" | "inactive" | "unknown";

export interface AstrologyBirthDataPayload {
  localDate: string;
  localTime: string;
  timeInputMode: "local-clock";
  timezone: string;
  location: {
    label: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    elevationMeters?: number | null;
  };
  precision: BirthPrecision;
  timeResolution: {
    status: "resolved";
    inputMode: "local-clock";
    localDate: string;
    localTime: string;
    timezone: string;
    utcISO: string;
    utcOffsetMinutes: number;
    utcOffsetLabel: string;
    daylightSaving: DaylightSavingStatus;
    disambiguation: BirthTimeDisambiguation | null;
    candidateOffsetsMinutes: number[];
    source: "iana-timezone-rules";
  };
}

interface BirthRow {
  user_id: string;
  local_date: string;
  local_time: string;
  time_input_mode: "local-clock";
  timezone: string;
  location_label: string;
  country_code: string;
  latitude: number | string;
  longitude: number | string;
  elevation_meters: number | string | null;
  precision: BirthPrecision;
  time_resolution: AstrologyBirthDataPayload["timeResolution"];
  calculation_version: string;
  consent_granted_at: string;
  created_at: string;
  updated_at: string;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isLocalTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isIanaTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 3 || value.length > 80 || value.includes(" ")) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function isUtcISO(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && value.endsWith("Z");
}

export function validateAstrologyBirthData(value: unknown): { ok: true; data: AstrologyBirthDataPayload } | { ok: false; errors: string[] } {
  if (typeof value !== "object" || value === null) return { ok: false, errors: ["birthData must be an object"] };
  const body = value as Partial<AstrologyBirthDataPayload>;
  const location = body.location;
  const resolution = body.timeResolution;
  const errors: string[] = [];
  let canonicalResolution: ServerBirthTimeResolution | null = null;

  if (!isIsoDate(body.localDate)) errors.push("localDate is invalid");
  if (!isLocalTime(body.localTime)) errors.push("localTime is invalid");
  if (body.timeInputMode !== "local-clock") errors.push("timeInputMode is invalid");
  if (!isIanaTimezone(body.timezone)) errors.push("timezone is invalid");
  if (body.precision !== "exact" && body.precision !== "approximate" && body.precision !== "unknown") errors.push("precision is invalid");
  if (typeof location !== "object" || location === null) {
    errors.push("location is required");
  } else {
    if (typeof location.label !== "string" || location.label.trim().length < 2 || location.label.trim().length > 180) errors.push("location.label is invalid");
    if (typeof location.countryCode !== "string" || !/^[A-Z]{2}$/.test(location.countryCode)) errors.push("location.countryCode is invalid");
    if (!isFiniteNumber(location.latitude) || location.latitude < -90 || location.latitude > 90) errors.push("location.latitude is invalid");
    if (!isFiniteNumber(location.longitude) || location.longitude < -180 || location.longitude > 180) errors.push("location.longitude is invalid");
    if (location.elevationMeters !== undefined && location.elevationMeters !== null && (!isFiniteNumber(location.elevationMeters) || Math.abs(location.elevationMeters) > 10000)) errors.push("location.elevationMeters is invalid");
  }

  if (typeof resolution !== "object" || resolution === null) {
    errors.push("timeResolution is required");
  } else {
    if (resolution.status !== "resolved") errors.push("timeResolution must be resolved");
    if (resolution.inputMode !== "local-clock") errors.push("timeResolution.inputMode is invalid");
    if (resolution.localDate !== body.localDate || resolution.localTime !== body.localTime || resolution.timezone !== body.timezone) errors.push("timeResolution must match the reported local time");
    if (!isUtcISO(resolution.utcISO)) errors.push("timeResolution.utcISO is invalid");
    if (!Number.isInteger(resolution.utcOffsetMinutes) || resolution.utcOffsetMinutes < -1440 || resolution.utcOffsetMinutes > 1440) errors.push("timeResolution.utcOffsetMinutes is invalid");
    if (typeof resolution.utcOffsetLabel !== "string" || !/^UTC(?:±|[+−])\d{2}:\d{2}$/.test(resolution.utcOffsetLabel)) errors.push("timeResolution.utcOffsetLabel is invalid");
    if (!["active", "inactive", "unknown"].includes(resolution.daylightSaving)) errors.push("timeResolution.daylightSaving is invalid");
    if (resolution.disambiguation !== null && resolution.disambiguation !== "earlier" && resolution.disambiguation !== "later") errors.push("timeResolution.disambiguation is invalid");
    if (!Array.isArray(resolution.candidateOffsetsMinutes) || resolution.candidateOffsetsMinutes.some((offset) => !Number.isInteger(offset) || offset < -1440 || offset > 1440)) errors.push("timeResolution.candidateOffsetsMinutes is invalid");
    if (resolution.source !== "iana-timezone-rules") errors.push("timeResolution.source is invalid");
  }

  if (isIsoDate(body.localDate) && isLocalTime(body.localTime) && isIanaTimezone(body.timezone)) {
    const submittedDisambiguation: BirthTimeDisambiguation | undefined = typeof resolution === "object" && resolution !== null && (resolution.disambiguation === "earlier" || resolution.disambiguation === "later")
      ? resolution.disambiguation
      : undefined;
    canonicalResolution = resolveAstrologyBirthTime({
      localDate: body.localDate,
      localTime: body.localTime,
      timezone: body.timezone,
      disambiguation: submittedDisambiguation,
    });

    if (canonicalResolution.status !== "resolved") {
      errors.push(`birth time cannot be resolved: ${canonicalResolution.status}`);
    } else if (typeof resolution === "object" && resolution !== null) {
      const submittedResolution = resolution as Partial<ServerBirthTimeResolution>;
      const matchesCanonicalResolution = [
        submittedResolution.status === canonicalResolution.status,
        submittedResolution.inputMode === canonicalResolution.inputMode,
        submittedResolution.localDate === canonicalResolution.localDate,
        submittedResolution.localTime === canonicalResolution.localTime,
        submittedResolution.timezone === canonicalResolution.timezone,
        submittedResolution.utcISO === canonicalResolution.utcISO,
        submittedResolution.utcOffsetMinutes === canonicalResolution.utcOffsetMinutes,
        submittedResolution.utcOffsetLabel === canonicalResolution.utcOffsetLabel,
        submittedResolution.daylightSaving === canonicalResolution.daylightSaving,
        submittedResolution.disambiguation === canonicalResolution.disambiguation,
        JSON.stringify(submittedResolution.candidateOffsetsMinutes) === JSON.stringify(canonicalResolution.candidateOffsetsMinutes),
        submittedResolution.source === canonicalResolution.source,
      ].every(Boolean);

      if (!matchesCanonicalResolution) errors.push("timeResolution does not match the server IANA resolution");
    }
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      localDate: body.localDate as string,
      localTime: body.localTime as string,
      timeInputMode: "local-clock",
      timezone: body.timezone as string,
      location: {
        label: location!.label.trim(),
        countryCode: location!.countryCode,
        latitude: location!.latitude,
        longitude: location!.longitude,
        elevationMeters: location!.elevationMeters ?? null,
      },
      precision: body.precision as BirthPrecision,
      timeResolution: canonicalResolution as AstrologyBirthDataPayload["timeResolution"],
    },
  };
}

export function toAstrologyBirthData(row: BirthRow): AstrologyBirthDataPayload & { metadata: { calculationVersion: string; consentGrantedAt: string; createdAt: string; updatedAt: string } } {
  const timeResolution = {
    ...row.time_resolution,
    disambiguation: row.time_resolution.disambiguation ?? null,
    candidateOffsetsMinutes: Array.isArray(row.time_resolution.candidateOffsetsMinutes) && row.time_resolution.candidateOffsetsMinutes.length
      ? row.time_resolution.candidateOffsetsMinutes
      : [row.time_resolution.utcOffsetMinutes],
  };

  return {
    localDate: row.local_date,
    localTime: row.local_time.slice(0, 5),
    timeInputMode: row.time_input_mode,
    timezone: row.timezone,
    location: {
      label: row.location_label,
      countryCode: row.country_code,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      elevationMeters: row.elevation_meters === null ? null : Number(row.elevation_meters),
    },
    precision: row.precision,
    timeResolution,
    metadata: {
      calculationVersion: row.calculation_version,
      consentGrantedAt: row.consent_granted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export async function readAstrologyBirthData(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("astrology_birth_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toAstrologyBirthData(data as BirthRow) : null;
}
