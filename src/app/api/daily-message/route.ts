import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getDailyMessage, getDailyVisitorKey } from "@/lib/daily/message";
import {
  getZonedDay,
  normalizeTimeZone,
  secondsUntilNextZonedMidnight,
} from "@/lib/daily/time";
import { localizeDailyMessage } from "@/lib/i18n/oracle";
import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VISITOR_SEED_COOKIE_NAME = "pdu_daily_seed";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map(asString).filter(Boolean).slice(0, 3)
    : [];
}

async function getDailyPersonalization(userId: string) {
  if (!hasSupabaseConfig()) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, favorite_themes, emotional_phase, reading_profile")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  const profile = isRecord(data.reading_profile) ? data.reading_profile : {};
  const displayName = asString(profile.displayName) || asString(data.display_name);
  const focusAreas = asStringList(profile.focusAreas).length
    ? asStringList(profile.focusAreas)
    : asStringList(data.favorite_themes);
  const currentPhase =
    asString(profile.currentPhase) || asString(data.emotional_phase);
  const desiredShift = asString(profile.desiredShift);
  const guidanceTone = asString(profile.guidanceTone);

  if (!displayName && !focusAreas.length && !currentPhase && !desiredShift) {
    return null;
  }

  return { currentPhase, desiredShift, displayName, focusAreas, guidanceTone };
}

function personalizeDailyMessage<T extends { message: string; advice: string; reflection: string }>(
  daily: T,
  profile: Awaited<ReturnType<typeof getDailyPersonalization>>,
  locale: string
) {
  if (!profile) return daily;

  const isEnglish = locale.startsWith("en");
  const namePrefix = profile.displayName
    ? isEnglish
      ? `${profile.displayName}, `
      : `${profile.displayName}, `
    : "";
  const phase = profile.currentPhase || profile.focusAreas[0] || "";
  const shift = profile.desiredShift || "";

  return {
    ...daily,
    message: phase
      ? isEnglish
        ? `${namePrefix}today's message meets your current phase: ${phase}. ${daily.message}`
        : `${namePrefix}a mensagem de hoje conversa com a sua fase atual: ${phase}. ${daily.message}`
      : daily.message,
    advice: shift
      ? isEnglish
        ? `${daily.advice} Keep your desired shift in view: ${shift}.`
        : `${daily.advice} Mantenha no centro a mudança que você busca: ${shift}.`
      : daily.advice,
    reflection: profile.focusAreas.length
      ? isEnglish
        ? `${daily.reflection} How does this appear in ${profile.focusAreas.join(", ")}?`
        : `${daily.reflection} Como isso aparece em ${profile.focusAreas.join(", ")}?`
      : daily.reflection,
  };
}

export async function GET(req: NextRequest) {
  const timeZone = normalizeTimeZone(req.nextUrl.searchParams.get("tz"));
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt-BR";
  const authenticatedUser = await getAuthenticatedUser();
  const userId = authenticatedUser?.id ?? req.nextUrl.searchParams.get("userId")?.trim();
  const visitorSeed =
    userId
      ? getDailyVisitorKey(userId)
      : req.cookies.get(VISITOR_SEED_COOKIE_NAME)?.value || randomUUID();
  const day = getZonedDay(timeZone);
  const baseDaily = localizeDailyMessage(
    getDailyMessage({
      dateKey: day.key,
      timeZone: day.timeZone,
      visitorKey: visitorSeed,
    }),
    locale
  );
  const daily = personalizeDailyMessage(
    baseDaily,
    authenticatedUser ? await getDailyPersonalization(authenticatedUser.id) : null,
    locale
  );

  const response = NextResponse.json({
    ok: true,
    daily,
    today: day,
    expiresInSeconds: secondsUntilNextZonedMidnight(day),
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");

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
