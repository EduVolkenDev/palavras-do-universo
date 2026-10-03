import type { ProductCurrency } from "@/lib/product/pricing";

export type EduReadingOffer = {
  id: "caminho-3-cartas" | "diamante" | "passaro-voando";
  title: string;
  cards: number;
  durationLabel: string;
  durationMinutes: number;
  priceCents: Record<ProductCurrency, number>;
  description: { pt: string; en: string };
};

// Valores e duração ficam aqui para que possam ser revisados sem alterar a jornada.
// Estes atendimentos humanos não usam os produtos digitais nem o checkout até os
// respectivos produtos Stripe e regras de agenda serem configurados.
export const EDU_READING_OFFERS: EduReadingOffer[] = [
  {
    id: "caminho-3-cartas",
    title: "Caminho das 3 Cartas",
    cards: 3,
    durationLabel: "40–50 min",
    durationMinutes: 50,
    priceCents: { BRL: 19900, GBP: 3500 },
    description: {
      pt: "Uma pergunta central, três perspectivas e um próximo passo possível.",
      en: "One central question, three perspectives, and one possible next step.",
    },
  },
  {
    id: "diamante",
    title: "O Diamante",
    cards: 5,
    durationLabel: "50–70 min",
    durationMinutes: 70,
    priceCents: { BRL: 29900, GBP: 5000 },
    description: {
      pt: "Uma leitura para olhar a questão por camadas e encontrar integração.",
      en: "A reading that looks at the question in layers and finds integration.",
    },
  },
  {
    id: "passaro-voando",
    title: "O Pássaro Voando",
    cards: 7,
    durationLabel: "70–80 min",
    durationMinutes: 80,
    priceCents: { BRL: 35000, GBP: 7000 },
    description: {
      pt: "Uma leitura ampla para transições, direção e movimento consciente.",
      en: "A wide reading for transitions, direction, and conscious movement.",
    },
  },
];

export const EDU_READING_AVAILABILITY = {
  timezone: "Europe/London",
  weekdays: [2, 4, 5] as const,
  startTime: "13:00",
  endTime: "19:00",
  bufferMinutes: 30,
  lookaheadDays: 42,
};

export type EduReadingAvailabilityDay = {
  dateKey: string;
  label: string;
  slots: string[];
};

export type EduReadingSlot = {
  dateKey: string;
  startTime: string;
  endTime: string;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDateKey(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.toISOString().slice(0, 10) === dateKey ? date : null;
}

export function getEduReadingOfferSlots(offerId: EduReadingOffer["id"]) {
  const offer = EDU_READING_OFFERS.find((item) => item.id === offerId);
  if (!offer) return [];

  const firstStart = timeToMinutes(EDU_READING_AVAILABILITY.startTime);
  const lastEnd = timeToMinutes(EDU_READING_AVAILABILITY.endTime);
  const slots: string[] = [];

  for (
    let start = firstStart;
    start + offer.durationMinutes <= lastEnd;
    start += offer.durationMinutes + EDU_READING_AVAILABILITY.bufferMinutes
  ) {
    slots.push(minutesToTime(start));
  }

  return slots;
}

export function getEduReadingSlot(
  offerId: EduReadingOffer["id"],
  dateKey: string,
  startTime: string
): EduReadingSlot | null {
  const offer = EDU_READING_OFFERS.find((item) => item.id === offerId);
  const date = parseDateKey(dateKey);
  if (!offer || !date || !/^\d{2}:\d{2}$/.test(startTime)) return null;

  const weekday = date.getUTCDay() as (typeof EDU_READING_AVAILABILITY.weekdays)[number];
  if (!EDU_READING_AVAILABILITY.weekdays.includes(weekday)) return null;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + offer.durationMinutes;
  const validStarts = getEduReadingOfferSlots(offerId);
  if (!validStarts.includes(startTime) || endMinutes > timeToMinutes(EDU_READING_AVAILABILITY.endTime)) {
    return null;
  }

  return {
    dateKey,
    startTime,
    endTime: minutesToTime(endMinutes),
  };
}

export function isEduReadingOfferId(value: unknown): value is EduReadingOffer["id"] {
  return EDU_READING_OFFERS.some((offer) => offer.id === value);
}

function londonToday(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EDU_READING_AVAILABILITY.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function getUpcomingEduReadingAvailability(
  offerId: EduReadingOffer["id"],
  locale: "pt-BR" | "en",
  now = new Date()
): EduReadingAvailabilityDay[] {
  const slots = getEduReadingOfferSlots(offerId);
  if (!slots.length) return [];

  const dateFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-BR", {
    timeZone: EDU_READING_AVAILABILITY.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const start = londonToday(now);
  const days: EduReadingAvailabilityDay[] = [];

  for (let offset = 0; offset < EDU_READING_AVAILABILITY.lookaheadDays && days.length < 4; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    const weekday = date.getUTCDay() as (typeof EDU_READING_AVAILABILITY.weekdays)[number];
    if (!EDU_READING_AVAILABILITY.weekdays.includes(weekday)) continue;

    days.push({
      dateKey: date.toISOString().slice(0, 10),
      label: dateFormatter.format(date).replace(/^./, (character) => character.toUpperCase()),
      slots,
    });
  }

  return days;
}
