type LocalCivilInput = {
  localDate: string;
  localTime: string;
  timezone: string;
  disambiguation?: BirthTimeDisambiguation;
};

export type BirthTimeDisambiguation = "earlier" | "later";

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export type ServerBirthTimeResolution = {
  status: "resolved" | "ambiguous" | "nonexistent" | "invalid";
  inputMode: "local-clock";
  localDate: string;
  localTime: string;
  timezone: string;
  utcISO: string | null;
  utcOffsetMinutes: number | null;
  utcOffsetLabel: string | null;
  daylightSaving: "active" | "inactive" | "unknown";
  disambiguation: BirthTimeDisambiguation | null;
  candidateOffsetsMinutes: number[];
  source: "iana-timezone-rules" | "unknown";
};

const dateTimeParts = new Set(["year", "month", "day", "hour", "minute", "second"]);

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatOffsetLabel(offsetMinutes: number) {
  if (offsetMinutes === 0) return "UTC±00:00";
  const sign = offsetMinutes > 0 ? "+" : "−";
  const absolute = Math.abs(offsetMinutes);
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

function parseOffset(value: string) {
  const match = value.match(/^GMT(?:([+-])(\d{1,2})(?::?(\d{2}))?)?$/);
  if (!match) return null;

  const [, sign, hours, minutes = "00"] = match;
  if (!sign) return 0;
  const total = Number(hours) * 60 + Number(minutes);
  return sign === "+" ? total : -total;
}

function getFormatter(timezone: string, timeZoneName: "longOffset" | "shortOffset" = "longOffset") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName,
  });
}

function partsForInstant(instant: Date, timezone: string): LocalParts {
  const parts = Object.fromEntries(getFormatter(timezone).formatToParts(instant).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function offsetForInstant(instant: Date, timezone: string) {
  const value = getFormatter(timezone).formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "";
  return parseOffset(value);
}

function parseLocalInput(input: LocalCivilInput): LocalParts | null {
  const dateMatch = input.localDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = input.localTime.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const calendarCheck = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    calendarCheck.getUTCHours() !== hour ||
    calendarCheck.getUTCMinutes() !== minute
  ) return null;

  return { year, month, day, hour, minute, second: 0 };
}

function sameLocalTime(first: LocalParts, second: LocalParts) {
  return Object.keys(first).every((key) => {
    if (!dateTimeParts.has(key)) return true;
    return first[key as keyof LocalParts] === second[key as keyof LocalParts];
  });
}

function localPartsAsUTC(parts: LocalParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function offsetsAroundYear(parts: LocalParts, timezone: string) {
  const offsets = new Set<number>();
  for (const sampleYear of [parts.year - 1, parts.year, parts.year + 1]) {
    for (const month of [0, 1, 3, 5, 7, 9, 11]) {
      const offset = offsetForInstant(new Date(Date.UTC(sampleYear, month, 15, 12, 0, 0)), timezone);
      if (offset !== null) offsets.add(offset);
    }
  }
  return offsets;
}

function daylightSavingStatus(parts: LocalParts, timezone: string, currentOffset: number) {
  const offsets = [...offsetsAroundYear(parts, timezone)].sort((first, second) => first - second);
  if (offsets.length === 1) return "inactive" as const;
  if (offsets.length !== 2 || offsets[1] - offsets[0] > 120) return "unknown" as const;
  return currentOffset === offsets[1] ? "active" as const : "inactive" as const;
}

function baseResolution(
  input: LocalCivilInput,
  status: ServerBirthTimeResolution["status"],
  candidateOffsetsMinutes: number[] = [],
  disambiguation: BirthTimeDisambiguation | null = null,
): ServerBirthTimeResolution {
  return {
    status,
    inputMode: "local-clock",
    localDate: input.localDate,
    localTime: input.localTime,
    timezone: input.timezone,
    utcISO: null,
    utcOffsetMinutes: null,
    utcOffsetLabel: null,
    daylightSaving: "unknown",
    disambiguation,
    candidateOffsetsMinutes,
    source: "unknown",
  };
}

export function resolveAstrologyBirthTime(input: LocalCivilInput): ServerBirthTimeResolution {
  let parts: LocalParts | null;
  try {
    parts = parseLocalInput(input);
    getFormatter(input.timezone);
  } catch {
    return baseResolution(input, "invalid");
  }

  if (!parts) return baseResolution(input, "invalid");

  const localAsUTC = localPartsAsUTC(parts);
  const possibleOffsets = offsetsAroundYear(parts, input.timezone);
  const initialOffset = offsetForInstant(new Date(localAsUTC), input.timezone);
  if (initialOffset !== null) possibleOffsets.add(initialOffset);

  const matches = [...possibleOffsets]
    .map((offsetMinutes) => {
      const utcDate = new Date(localAsUTC - offsetMinutes * 60_000);
      return { utcDate, offsetMinutes };
    })
    .filter(({ utcDate }) => sameLocalTime(parts, partsForInstant(utcDate, input.timezone)));

  matches.sort((first, second) => first.utcDate.getTime() - second.utcDate.getTime());
  const candidateOffsetsMinutes = matches.map(({ offsetMinutes }) => offsetMinutes);

  if (matches.length > 1 && !input.disambiguation) {
    return baseResolution(input, "ambiguous", candidateOffsetsMinutes);
  }
  if (matches.length === 0) {
    return baseResolution(input, "nonexistent");
  }

  const selectedMatch = matches.length > 1 && input.disambiguation === "later" ? matches[matches.length - 1] : matches[0];
  const { utcDate, offsetMinutes } = selectedMatch;
  return {
    ...baseResolution(input, "resolved", candidateOffsetsMinutes, input.disambiguation ?? null),
    utcISO: utcDate.toISOString(),
    utcOffsetMinutes: offsetMinutes,
    utcOffsetLabel: formatOffsetLabel(offsetMinutes),
    daylightSaving: daylightSavingStatus(parts, input.timezone, offsetMinutes),
    source: "iana-timezone-rules",
  };
}
