import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  formatZonedDayLabel,
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
  const seed = hashSeed(
    `${opening.date_key}:${card.key}:${opening.reversed ? "r" : "u"}`
  );
  const keyword = card.keywords[0];
  const isEnglish = locale.startsWith("en");
  const baseMeaning = opening.reversed ? card.reversed : card.upright;
  const meaning = isEnglish
    ? pickSeeded(
    [
      `${card.name} does not arrive today as a fixed verdict; it turns ${keyword} into a lens for the next hours.`,
      `Through ${card.name}, today's signal is ${keyword}: notice where this theme asks for one honest adjustment.`,
      `${card.name} frames the day through ${keyword}. Read it as context for choice, not as a prediction.`,
      `The message of ${card.name} is active today when ${keyword} becomes practical, visible, and kind to your pace.`,
      `${baseMeaning} Today, translate that into one concrete way of practicing ${keyword}.`,
    ],
    seed,
    "meaning"
      )
    : pickSeeded(
    [
      `${card.name} não chega hoje como sentença fixa; transforma ${keyword} em lente para as próximas horas.`,
      `Por meio de ${card.name}, o sinal do dia é ${keyword}: observe onde esse tema pede um ajuste honesto.`,
      `${card.name} enquadra o dia pela energia de ${keyword}. Leia como contexto para escolher, não como previsão.`,
      `A mensagem de ${card.name} ganha força quando ${keyword} vira prática visível e respeita seu ritmo.`,
      `${baseMeaning} Hoje, traduza isso em uma forma concreta de praticar ${keyword}.`,
    ],
    seed,
    "meaning"
      );
  const counsel = pickSeeded(
    isEnglish
      ? [
      `Choose one small action that turns ${keyword} into practice before the day ends.`,
          `Notice where the theme of ${keyword} is already present and give strength to the most honest gesture.`,
          `Avoid seeking a bigger answer before trying one movement guided by this card.`,
          `Use the theme of ${keyword} as a criterion for what deserves your energy in the next hours.`,
          `Protect space for this signal; the rest can wait for a more mature response.`,
        ]
      : [
          `Escolha uma ação pequena que transforme ${keyword} em prática antes do fim do dia.`,
          `Observe onde o tema de ${keyword} já está presente e dê força ao gesto mais honesto.`,
          `Evite buscar uma resposta maior antes de experimentar um movimento guiado por esta carta.`,
          `Use o tema de ${keyword} como critério para decidir o que merece sua energia nas próximas horas.`,
          `Proteja espaço para esse sinal; o restante pode esperar uma resposta mais madura.`,
        ],
    seed,
    "counsel"
  );
  const reflectionPrompt = pickSeeded(
    isEnglish
      ? [
          `Where does ${keyword} speak to something you had already been feeling?`,
          `What changes when you view this moment through the lens of ${keyword}?`,
          `Which recent choice asks for more ${keyword} and less automatic reaction?`,
          `How could ${keyword} appear concretely in your day?`,
          `What does this card reveal about your current relationship with ${keyword}?`,
        ]
      : [
          `Onde ${keyword} conversa com algo que você já vinha sentindo?`,
          `O que muda quando você olha para este momento pela lente de ${keyword}?`,
          `Que escolha recente pede mais ${keyword} e menos reação automática?`,
          `Como ${keyword} poderia aparecer de forma concreta no seu dia?`,
          `O que esta carta revela sobre sua relação atual com ${keyword}?`,
        ],
    seed,
    "reflection"
  );
  const ritual = pickSeeded(
    isEnglish
      ? [
          `Write one sentence beginning with “today this card asks me to...” and complete it without editing yourself.`,
          `Breathe for one minute with the theme of ${keyword} in mind, then write the first action that appears.`,
          `Choose one object to represent ${keyword} and keep it visible until the end of the day.`,
          `Before sleeping, record where ${keyword} appeared and what it taught you.`,
          `Take a five-minute pause and turn this signal into one simple commitment for today.`,
        ]
      : [
          `Escreva uma frase começando com “hoje esta carta me pede...” e complete sem se corrigir.`,
          `Respire por um minuto com o tema de ${keyword} em mente e anote a primeira ação que surgir.`,
          `Escolha um objeto para representar ${keyword} e deixe-o visível até o fim do dia.`,
          `Antes de dormir, registre onde ${keyword} apareceu e o que ele ensinou.`,
          `Faça uma pausa de cinco minutos e transforme esse sinal em um compromisso simples para hoje.`,
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
  const todayLabel = formatZonedDayLabel(today, locale);
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
  response.headers.set("Cache-Control", "no-store, max-age=0");

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
