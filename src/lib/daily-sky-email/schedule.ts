export function londonDay(now: Date) {
  if (Number.isNaN(now.getTime())) throw new Error("Invalid date");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const value = (name: string) => parts.find((part) => part.type === name)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, hour: Number(value("hour")) };
}

export function inMorningWindow(now: Date) {
  const day = londonDay(now);
  return { ...day, due: day.hour >= 8 && day.hour <= 10 };
}
