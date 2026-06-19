export type ZonedDay = {
  day: number;
  key: string;
  label: string;
  month: number;
  timeZone: string;
  year: number;
};

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "long",
  });
}

function getParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function getOffsetMs(date: Date, timeZone: string) {
  const parts = getParts(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return localAsUtc - date.getTime();
}

function zonedMidnightUtcMs(params: {
  day: number;
  month: number;
  timeZone: string;
  year: number;
}) {
  let utcMs = Date.UTC(params.year, params.month - 1, params.day);

  for (let index = 0; index < 3; index += 1) {
    utcMs =
      Date.UTC(params.year, params.month - 1, params.day) -
      getOffsetMs(new Date(utcMs), params.timeZone);
  }

  return utcMs;
}

export function normalizeTimeZone(value?: string | null) {
  const candidate = value || "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return "UTC";
  }
}

export function getZonedDay(timeZoneInput?: string | null): ZonedDay {
  const timeZone = normalizeTimeZone(timeZoneInput);
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const day = Number(get("day"));
  const month = Number(get("month"));
  const year = Number(get("year"));
  const weekday = get("weekday");

  return {
    day,
    key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`,
    label: `${weekday}, ${String(day).padStart(2, "0")}/${String(
      month
    ).padStart(2, "0")}/${year}`,
    month,
    timeZone,
    year,
  };
}

export function secondsUntilNextZonedMidnight(day: ZonedDay) {
  const nextMidnightUtc = zonedMidnightUtcMs({
    day: day.day + 1,
    month: day.month,
    year: day.year,
    timeZone: day.timeZone,
  });

  return Math.max(60, Math.ceil((nextMidnightUtc - Date.now()) / 1000));
}
