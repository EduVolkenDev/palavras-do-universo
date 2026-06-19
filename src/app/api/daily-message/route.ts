import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getDailyMessage, getDailyVisitorKey } from "@/lib/daily/message";
import {
  getZonedDay,
  normalizeTimeZone,
  secondsUntilNextZonedMidnight,
} from "@/lib/daily/time";
import { localizeDailyMessage } from "@/lib/i18n/oracle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VISITOR_SEED_COOKIE_NAME = "pdu_daily_seed";

export function GET(req: NextRequest) {
  const timeZone = normalizeTimeZone(req.nextUrl.searchParams.get("tz"));
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt-BR";
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const visitorSeed =
    userId
      ? getDailyVisitorKey(userId)
      : req.cookies.get(VISITOR_SEED_COOKIE_NAME)?.value || randomUUID();
  const day = getZonedDay(timeZone);
  const daily = localizeDailyMessage(
    getDailyMessage({
      dateKey: day.key,
      timeZone: day.timeZone,
      visitorKey: visitorSeed,
    }),
    locale
  );

  const response = NextResponse.json({
    ok: true,
    daily,
    today: day,
    expiresInSeconds: secondsUntilNextZonedMidnight(day),
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
