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
import { createUserContext, normalizeActiveReading } from "@/lib/personalization/reading-context";
import { buildJourneySnapshot } from "@/lib/personalization/journey";
import type { DailyReadingInput } from "@/lib/astrology/daily-reading";

export const maxDuration = 45;
const headers = { "Cache-Control": "private, no-store" };

async function readSharedUserContext(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const [{ data: profile, error: profileError }, { data: readings, error: readingsError }, { data: messages, error: messagesError }, { data: actions, error: actionsError }] = await Promise.all([
    supabase.from("profiles").select("display_name, favorite_themes, emotional_phase, reading_profile").eq("id", userId).maybeSingle(),
    supabase.from("readings").select("id, locale, theme, question, spread, interpretation, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    supabase.from("saved_messages").select("message_type, payload, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("impact_commitments").select("id, client_key, status, action_title, plan, reflection, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
  ]);

  if (profileError || readingsError || messagesError || actionsError) {
    console.warn("Astrology daily context loaded partially; continuing with the available context");
  }

  const profileContext = createUserContext(profile ?? null, "remote");
  const journey = buildJourneySnapshot(readings ?? [], messages ?? [], profileContext.readingProfile, actions ?? []);
  const latestReading = readings?.[0] as Record<string, unknown> | undefined;
  const activeReading = latestReading
    ? normalizeActiveReading({
      readingId: latestReading.id,
      locale: latestReading.locale,
      theme: latestReading.theme,
      question: latestReading.question,
      spreadCards: latestReading.spread,
      result: latestReading.interpretation,
      updatedAt: latestReading.created_at,
    }) ?? undefined
    : undefined;

  return createUserContext(profile ?? null, "remote", journey, undefined, activeReading);
}

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
    const userContext = await readSharedUserContext(supabase, auth.user.id);
    const timezone = new Intl.DateTimeFormat("en-US", {
      timeZone: isIanaTimezone(parsed.body.timezone) ? parsed.body.timezone : birth.timezone,
    }).resolvedOptions().timeZone;
    const chart = calculateNatalChart(birth);
    const input: DailyReadingInput = {
      userId: auth.user.id,
      locale: parsed.body.locale,
      chart,
      sky: calculateDailySky(chart.positions, new Date(), timezone, true),
      userContext,
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
