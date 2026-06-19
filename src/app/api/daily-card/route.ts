import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  getZonedDay,
  normalizeTimeZone,
  secondsUntilNextZonedMidnight,
} from "@/lib/daily/time";
import { CARDS } from "@/lib/tarot/cards";
import { getDateOrdinal, hashSeed, pickSeeded } from "@/lib/daily/seed";
import {
  getCardEnglishName,
  localizeTarotCard,
} from "@/lib/i18n/oracle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE_NAME = "pdu_daily_opening";
const VISITOR_SEED_COOKIE_NAME = "pdu_daily_seed";

type DailyOpeningCookie = {
  date_key: string;
  opening_key: string;
  card_key: string;
  reversed: boolean;
  time_zone?: string;
};

function encodeOpening(opening: DailyOpeningCookie) {
  return Buffer.from(JSON.stringify(opening), "utf8").toString("base64url");
}

function decodeOpening(value?: string) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<DailyOpeningCookie>;

    if (
      typeof parsed.date_key !== "string" ||
      typeof parsed.opening_key !== "string" ||
      typeof parsed.card_key !== "string" ||
      typeof parsed.reversed !== "boolean"
    ) {
      return null;
    }

    return parsed as DailyOpeningCookie;
  } catch {
    return null;
  }
}

function createOpening(dateKey: string, visitorSeed: string): DailyOpeningCookie {
  const ordinal = getDateOrdinal(dateKey);
  const visitorHash = hashSeed(visitorSeed);
  const card = CARDS[(visitorHash + ordinal * 31) % CARDS.length];
  const reversed = hashSeed(`${visitorSeed}:${dateKey}:orientation`) % 4 === 0;

  return {
    date_key: dateKey,
    opening_key: `${dateKey}:${card.key}:${reversed ? "r" : "u"}:${visitorHash}`,
    card_key: card.key,
    reversed,
  };
}

function buildDailyPayload(
  opening: DailyOpeningCookie,
  todayLabel: string,
  timeZone: string,
  locale: string
) {
  const sourceCard =
    CARDS.find((item) => item.key === opening.card_key) ?? CARDS[0];
  const card = localizeTarotCard(sourceCard, locale);
  const meaning = opening.reversed ? card.reversed : card.upright;
  const seed = hashSeed(
    `${opening.date_key}:${card.key}:${opening.reversed ? "r" : "u"}`
  );
  const keyword = card.keywords[0];
  const isEnglish = locale.startsWith("en");
  const counsel = isEnglish
    ? `Choose one small action that turns ${keyword} into practice before the day ends.`
    : pickSeeded(
    [
      `Escolha uma ação pequena que transforme ${keyword} em prática antes do fim do dia.`,
      `Observe onde ${keyword} já está presente e dê força ao gesto mais honesto.`,
      `Evite buscar uma resposta maior antes de experimentar um movimento guiado por ${keyword}.`,
      `Use ${keyword} como critério para decidir o que merece sua energia nas próximas horas.`,
      `Proteja espaço para ${keyword}; o restante pode esperar uma resposta mais madura.`,
    ],
    seed,
    "counsel"
      );
  const reflectionPrompt = isEnglish
    ? `What changes when you view this moment through the lens of ${keyword}?`
    : pickSeeded(
    [
      `Onde ${keyword} conversa com algo que você já vinha sentindo?`,
      `O que muda quando você olha para este momento pela lente de ${keyword}?`,
      `Que escolha recente pede mais ${keyword} e menos reação automática?`,
      `Como ${keyword} poderia aparecer de forma concreta no seu dia?`,
      `O que esta carta revela sobre sua relação atual com ${keyword}?`,
    ],
    seed,
    "reflection"
      );
  const ritual = isEnglish
    ? `Write one sentence beginning with “today I practice ${keyword} when...” and complete it without editing yourself.`
    : pickSeeded(
    [
      `Escreva uma frase começando com “hoje eu pratico ${keyword} quando...” e complete sem se corrigir.`,
      `Respire por um minuto repetindo mentalmente “${keyword}” e anote a primeira ação que surgir.`,
      `Escolha um objeto para representar ${keyword} e deixe-o visível até o fim do dia.`,
      `Antes de dormir, registre onde ${keyword} apareceu e o que ele ensinou.`,
      `Faça uma pausa de cinco minutos e transforme ${keyword} em um compromisso simples para hoje.`,
    ],
    seed,
    "ritual"
      );

  return {
    today: {
      key: opening.date_key,
      label: todayLabel,
      timeZone,
    },
    openingKey: opening.opening_key,
    card: {
      key: card.key,
      name: isEnglish ? getCardEnglishName(card.key, card.name) : card.name,
      reversed: opening.reversed,
      assetPath: card.assetPath,
      keywords: card.keywords,
    },
    reading: {
      keyword,
      meaning,
      counsel,
      reflection_prompt: reflectionPrompt,
      ritual,
    },
    daily_context: {
      source: "carta_do_dia" as const,
      suggested_focus: isEnglish
        ? `act with ${card.keywords[0]} in the coming hours`
        : `agir com ${card.keywords[0]} nas próximas horas`,
      energy: isEnglish
        ? opening.reversed
          ? "review"
          : "presence"
        : opening.reversed
          ? "revisão"
          : "presença",
    },
  };
}

export function GET(req: NextRequest) {
  const timeZone = normalizeTimeZone(req.nextUrl.searchParams.get("tz"));
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt-BR";
  const today = getZonedDay(timeZone);
  const todayLabel =
    locale.startsWith("en")
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: today.timeZone,
          day: "2-digit",
          month: "long",
          year: "numeric",
          weekday: "long",
        }).format(new Date())
      : today.label;
  const visitorSeed =
    req.cookies.get(VISITOR_SEED_COOKIE_NAME)?.value ?? randomUUID();
  const current = decodeOpening(req.cookies.get(COOKIE_NAME)?.value);
  const opening =
    current &&
    current.date_key === today.key &&
    current.time_zone === today.timeZone
      ? current
      : createOpening(today.key, visitorSeed);
  opening.time_zone = today.timeZone;

  const response = NextResponse.json({
    ok: true,
    daily: buildDailyPayload(opening, todayLabel, today.timeZone, locale),
    expiresAt: locale.startsWith("en")
      ? `midnight in ${today.timeZone}`
      : `meia-noite em ${today.timeZone}`,
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: encodeOpening(opening),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: secondsUntilNextZonedMidnight(today),
  });
  response.cookies.set({
    name: VISITOR_SEED_COOKIE_NAME,
    value: visitorSeed,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
