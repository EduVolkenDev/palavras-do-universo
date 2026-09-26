import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readAstrologyBirthData, isIanaTimezone } from "@/lib/astrology/birth-data";
import { calculateNatalChart } from "@/lib/astrology/natal-chart";
import { calculateDailySky } from "@/lib/astrology/daily-sky";
import { hasCircleAstrologyAccess } from "@/lib/astrology/server-access";
import { ensureSupabaseProfile, getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured", code: "SUPABASE_UNAVAILABLE" }, { status: 503 });
  }

  try {
    await ensureSupabaseProfile(auth.user.id, auth.user.email);
    const birthData = await readAstrologyBirthData(getSupabaseAdmin(), auth.user.id);
    if (!birthData) {
      return NextResponse.json({ error: "Birth data is required", code: "ASTROLOGY_BIRTH_DATA_REQUIRED" }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
    }

    const requestedTimezone = new URL(request.url).searchParams.get("timezone");
    const timezone = isIanaTimezone(requestedTimezone) ? requestedTimezone : birthData.timezone;
    const circleAccess = await hasCircleAstrologyAccess(auth.user);
    const natalPositions = circleAccess ? calculateNatalChart(birthData).positions : [];
    const sky = calculateDailySky(natalPositions, new Date(), timezone, circleAccess);
    return NextResponse.json({ ok: true, sky }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to calculate daily astrology sky", error);
    return NextResponse.json({ error: "Daily sky is unavailable", code: "ASTROLOGY_DAILY_UNAVAILABLE" }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
