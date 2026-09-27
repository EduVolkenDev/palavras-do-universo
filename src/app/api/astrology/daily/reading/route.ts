import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { isIanaTimezone, readAstrologyBirthData } from "@/lib/astrology/birth-data";
import { hasCircleAstrologyAccess } from "@/lib/astrology/server-access";
import { calculateNatalChart } from "@/lib/astrology/natal-chart";
import { calculateDailySky } from "@/lib/astrology/daily-sky";
import { generateDailyReadingAI } from "@/lib/astrology/daily-reading-ai";
import { getOrGenerateDailyReading } from "@/lib/astrology/daily-reading-service";
import { createDailyReadingStore } from "@/lib/astrology/daily-reading-store";
import type { DailyReadingInput } from "@/lib/astrology/daily-reading";

export const maxDuration = 45;
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ code: "ASTROLOGY_DAILY_READING_UNAVAILABLE" }, { status: 503, headers });
  const parsed = await readJsonBody<{ locale?: unknown; timezone?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  if (parsed.body?.locale !== "pt-BR" && parsed.body?.locale !== "en") {
    return NextResponse.json({ code: "INVALID_LOCALE" }, { status: 400, headers });
  }
  try {
    // Check before touching the private cache, including for a previous subscriber.
    if (!await hasCircleAstrologyAccess(auth.user)) {
      return NextResponse.json({ code: "CIRCLE_REQUIRED" }, { status: 403, headers });
    }
    const supabase = getSupabaseAdmin();
    const birth = await readAstrologyBirthData(supabase, auth.user.id);
    if (!birth) return NextResponse.json({ code: "ASTROLOGY_BIRTH_DATA_REQUIRED" }, { status: 409, headers });
    const timezone = new Intl.DateTimeFormat("en-US", {
      timeZone: isIanaTimezone(parsed.body.timezone) ? parsed.body.timezone : birth.timezone,
    }).resolvedOptions().timeZone;
    const chart = calculateNatalChart(birth);
    const input: DailyReadingInput = {
      userId: auth.user.id,
      locale: parsed.body.locale,
      chart,
      sky: calculateDailySky(chart.positions, new Date(), timezone, true),
    };
    const result = await getOrGenerateDailyReading(input, {
      store: createDailyReadingStore(supabase, input),
      generate: generateDailyReadingAI,
      onFailure: () => console.warn("Lume daily astrology generation did not complete; no fallback was saved as AI"),
    });
    if (!await hasCircleAstrologyAccess(auth.user)) {
      return NextResponse.json({ code: "CIRCLE_REQUIRED" }, { status: 403, headers });
    }
    return NextResponse.json(result, {
      status: result.status === "pending" ? 202 : 200,
      headers: { ...headers, ...(result.status !== "ready" ? { "Retry-After": String(result.retryAfterSeconds) } : {}) },
    });
  } catch {
    // No provider response, birth data or tokens in public errors or logs.
    console.error("Lume daily astrology storage is unavailable");
    return NextResponse.json({ code: "ASTROLOGY_DAILY_READING_UNAVAILABLE" }, { status: 503, headers });
  }
}
