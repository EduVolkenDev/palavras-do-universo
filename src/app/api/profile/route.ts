import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";
import {
  createUserContext,
  getProfileCompletion,
  normalizeReadingProfile,
  toPersistedReadingProfile,
  type ReadingProfile,
} from "@/lib/personalization/reading-context";

type ProfileBody = Partial<ReadingProfile>;

function profileResponse(profile: unknown) {
  const userContext = createUserContext(profile, "remote");
  return {
    profile,
    userContext,
    personalizationSignals: userContext.personalizationSignals,
  };
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, ...profileResponse(null) });
  }

  await ensureSupabaseProfile(auth.user.id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "display_name, favorite_themes, emotional_phase, onboarding_status, reading_profile, profile_completed_at"
    )
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...profileResponse(data ?? null) });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const parsed = await readJsonBody<ProfileBody>(request);
  if (!parsed.ok) return parsed.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const profile = normalizeReadingProfile(parsed.body ?? {});
  const complete = getProfileCompletion(profile) >= 4;
  const persistedProfile = toPersistedReadingProfile(profile);
  await ensureSupabaseProfile(auth.user.id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: profile.displayName || null,
      favorite_themes: profile.focusAreas,
      emotional_phase: profile.currentPhase || null,
      onboarding_status: complete ? "complete" : "started",
      reading_profile: persistedProfile,
      profile_completed_at: complete ? persistedProfile.completedAt : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.user.id)
    .select(
      "display_name, favorite_themes, emotional_phase, onboarding_status, reading_profile, profile_completed_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...profileResponse(data) });
}
