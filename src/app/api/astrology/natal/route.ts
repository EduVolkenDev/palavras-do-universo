import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { calculateNatalChart, ASTROLOGY_FULL_PRODUCT_KEY } from "@/lib/astrology/natal-chart";
import { chartForAstrologyAccess } from "@/lib/astrology/chart-access";
import { hasFullAstrologyAccess } from "@/lib/astrology/server-access";
import { readAstrologyBirthData } from "@/lib/astrology/birth-data";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured", code: "SUPABASE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  try {
    await ensureSupabaseProfile(auth.user.id, auth.user.email);
    const birthData = await readAstrologyBirthData(getSupabaseAdmin(), auth.user.id);
    if (!birthData) {
      return NextResponse.json(
        { error: "Birth data is required before calculating the chart", code: "ASTROLOGY_BIRTH_DATA_REQUIRED" },
        { status: 409, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const fullAccess = await hasFullAstrologyAccess(auth.user);

    const chart = calculateNatalChart(birthData);
    const visibleChart = chartForAstrologyAccess(chart, fullAccess);

    return NextResponse.json({
      ok: true,
      chart: visibleChart,
      access: {
        level: fullAccess ? "full" : "preview",
        productKey: ASTROLOGY_FULL_PRODUCT_KEY,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to calculate astrology chart", error);
    return NextResponse.json(
      { error: "Astrology chart is unavailable", code: "ASTROLOGY_CHART_UNAVAILABLE" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
