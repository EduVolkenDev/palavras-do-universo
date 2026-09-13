import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import {
  ASTROLOGY_BIRTH_CALCULATION_VERSION,
  readAstrologyBirthData,
  validateAstrologyBirthData,
} from "@/lib/astrology/birth-data";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured", code: "SUPABASE_UNAVAILABLE" }, { status: 503 });

  await ensureSupabaseProfile(auth.user.id, auth.user.email);
  const birthData = await readAstrologyBirthData(getSupabaseAdmin(), auth.user.id);
  return NextResponse.json({ ok: true, birthData });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured", code: "SUPABASE_UNAVAILABLE" }, { status: 503 });

  const parsed = await readJsonBody<{ birthData?: unknown; consent?: { storeBirthData?: unknown } }>(request);
  if (!parsed.ok) return parsed.response;
  if (parsed.body?.consent?.storeBirthData !== true) {
    return NextResponse.json({ error: "Explicit consent is required", code: "BIRTH_DATA_CONSENT_REQUIRED" }, { status: 400 });
  }

  const validation = validateAstrologyBirthData(parsed.body?.birthData);
  if (!validation.ok) {
    return NextResponse.json({ error: "Invalid astrology birth data", code: "INVALID_ASTROLOGY_BIRTH_DATA", details: validation.errors }, { status: 400 });
  }

  await ensureSupabaseProfile(auth.user.id, auth.user.email);
  const birthData = validation.data;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("astrology_birth_profiles").upsert({
    user_id: auth.user.id,
    local_date: birthData.localDate,
    local_time: `${birthData.localTime}:00`,
    time_input_mode: birthData.timeInputMode,
    timezone: birthData.timezone,
    location_label: birthData.location.label,
    country_code: birthData.location.countryCode,
    latitude: birthData.location.latitude,
    longitude: birthData.location.longitude,
    elevation_meters: birthData.location.elevationMeters ?? null,
    precision: birthData.precision,
    time_resolution: birthData.timeResolution,
    calculation_version: ASTROLOGY_BIRTH_CALCULATION_VERSION,
    consent_granted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message, code: "ASTROLOGY_BIRTH_DATA_SAVE_FAILED" }, { status: 500 });
  return NextResponse.json({ ok: true, birthData: await readAstrologyBirthData(supabase, auth.user.id) });
}

export async function DELETE() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured", code: "SUPABASE_UNAVAILABLE" }, { status: 503 });

  const { error } = await getSupabaseAdmin().from("astrology_birth_profiles").delete().eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: error.message, code: "ASTROLOGY_BIRTH_DATA_DELETE_FAILED" }, { status: 500 });
  return NextResponse.json({ ok: true, birthData: null });
}
