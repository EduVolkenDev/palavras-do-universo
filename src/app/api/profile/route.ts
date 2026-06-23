import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";

const MAX_ITEMS = 6;
const MAX_TEXT = 280;

type ProfileBody = {
  displayName?: unknown;
  focusAreas?: unknown;
  currentPhase?: unknown;
  guidanceTone?: unknown;
  desiredShift?: unknown;
  boundaries?: unknown;
  contextNote?: unknown;
};

function trimText(value: unknown, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => trimText(item, 64))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

function normalizeProfile(body: ProfileBody) {
  const profile = {
    displayName: trimText(body.displayName, 80),
    focusAreas: stringList(body.focusAreas),
    currentPhase: trimText(body.currentPhase, 120),
    guidanceTone: trimText(body.guidanceTone, 120),
    desiredShift: trimText(body.desiredShift, 140),
    boundaries: stringList(body.boundaries),
    contextNote: trimText(body.contextNote, 500),
    completedAt: new Date().toISOString(),
    version: "pdu-reading-profile-v1",
  };

  const score =
    (profile.displayName ? 1 : 0) +
    profile.focusAreas.length +
    (profile.currentPhase ? 1 : 0) +
    (profile.guidanceTone ? 1 : 0) +
    (profile.desiredShift ? 1 : 0);

  return { profile, complete: score >= 4 };
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, profile: null });
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

  return NextResponse.json({ ok: true, profile: data ?? null });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const parsed = await readJsonBody<ProfileBody>(request);
  if (!parsed.ok) return parsed.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { profile, complete } = normalizeProfile(parsed.body ?? {});
  await ensureSupabaseProfile(auth.user.id);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: profile.displayName || null,
      favorite_themes: profile.focusAreas,
      emotional_phase: profile.currentPhase || null,
      onboarding_status: complete ? "complete" : "started",
      reading_profile: profile,
      profile_completed_at: complete ? profile.completedAt : null,
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

  return NextResponse.json({ ok: true, profile: data });
}
