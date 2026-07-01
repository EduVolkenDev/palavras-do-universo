import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import {
  normalizeAvailability,
  normalizeHandle,
  normalizePricingModel,
  trimText,
  toBool,
  toNumberOrNull,
  toStringList,
} from "@/lib/professionals/catalog";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

type MeBody = {
  profile?: unknown;
  offers?: unknown;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeProfileBody(value: unknown) {
  const record = asRecord(value);
  return {
    handle: normalizeHandle(record?.handle),
    displayName: trimText(record?.displayName, 120),
    headline: trimText(record?.headline, 160),
    bio: trimText(record?.bio, 2000),
    city: trimText(record?.city, 120),
    country: trimText(record?.country, 80),
    avatarUrl: trimText(record?.avatarUrl, 500),
    specialties: toStringList(record?.specialties, 8),
    languages: toStringList(record?.languages, 8),
    modalities: toStringList(record?.modalities, 6),
    availability: normalizeAvailability(record?.availability),
    isPublished: toBool(record?.isPublished),
    isVerified: toBool(record?.isVerified),
    responseTime: trimText(record?.responseTime, 80),
  };
}

function normalizeOfferBody(value: unknown) {
  const record = asRecord(value);
  return {
    id: record?.id ? trimText(record.id, 80) : undefined,
    title: trimText(record?.title, 120),
    description: trimText(record?.description, 1200),
    category: trimText(record?.category, 80),
    pricingModel: normalizePricingModel(record?.pricingModel),
    priceCents: toNumberOrNull(record?.priceCents),
    socialPriceCents: toNumberOrNull(record?.socialPriceCents),
    currency: trimText(record?.currency, 8) || "BRL",
    durationMinutes: toNumberOrNull(record?.durationMinutes),
    acceptsFree: toBool(record?.acceptsFree),
    acceptsSocial: toBool(record?.acceptsSocial),
    status:
      record?.status === "published" || record?.status === "paused"
        ? record.status
        : "draft",
    sortOrder: Number.isFinite(Number(record?.sortOrder))
      ? Number(record?.sortOrder)
      : 100,
  };
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, profile: null, offers: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select(
      "id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at"
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonError(profileError.message, 500);
  }

  const { data: offers, error: offerError } = profile
    ? await supabase
        .from("professional_offers")
        .select(
          "id, profile_id, title, description, category, pricing_model, price_cents, social_price_cents, currency, duration_minutes, accepts_free, accepts_social, status, sort_order"
        )
        .eq("profile_id", profile.id)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (offerError) {
    return jsonError(offerError.message, 500);
  }

  return NextResponse.json({ ok: true, profile, offers: offers ?? [] });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return jsonError("Supabase is not configured", 503);
  }

  const parsed = await readJsonBody<MeBody>(request);
  if (!parsed.ok) return parsed.response;

  const profile = normalizeProfileBody(parsed.body.profile);
  const offers = Array.isArray(parsed.body.offers)
    ? parsed.body.offers.map(normalizeOfferBody).filter((item) => item.title && item.description)
    : [];

  if (!profile.handle || !profile.displayName || !profile.headline || !profile.bio) {
    return jsonError("Missing professional profile fields", 400);
  }

  const supabase = getSupabaseAdmin();
  await ensureSupabaseProfile(auth.user.id);

  const { data: existingProfile, error: existingError } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingError) {
    return jsonError(existingError.message, 500);
  }

  const payload = {
    user_id: auth.user.id,
    handle: profile.handle,
    display_name: profile.displayName,
    headline: profile.headline,
    bio: profile.bio,
    city: profile.city || null,
    country: profile.country || null,
    avatar_url: profile.avatarUrl || null,
    specialties: profile.specialties,
    languages: profile.languages,
    modalities: profile.modalities,
    availability: profile.availability,
    is_published: profile.isPublished,
    is_verified: profile.isVerified,
    response_time: profile.responseTime || null,
  };

  const savedProfile = existingProfile?.id
    ? await supabase
        .from("professional_profiles")
        .update(payload)
        .eq("id", existingProfile.id)
        .select("id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at")
        .single()
    : await supabase
        .from("professional_profiles")
        .insert(payload)
        .select("id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at")
        .single();

  if (savedProfile.error || !savedProfile.data) {
    return jsonError(savedProfile.error?.message ?? "Could not save profile", 500);
  }

  const { error: deleteError } = await supabase
    .from("professional_offers")
    .delete()
    .eq("profile_id", savedProfile.data.id);
  if (deleteError) return jsonError(deleteError.message, 500);

  if (offers.length) {
    const { error: insertError } = await supabase.from("professional_offers").insert(
      offers.map((offer) => ({
        profile_id: savedProfile.data.id,
        title: offer.title,
        description: offer.description,
        category: offer.category,
        pricing_model: offer.pricingModel,
        price_cents: offer.priceCents,
        social_price_cents: offer.socialPriceCents,
        currency: offer.currency,
        duration_minutes: offer.durationMinutes,
        accepts_free: offer.acceptsFree,
        accepts_social: offer.acceptsSocial,
        status: offer.status,
        sort_order: offer.sortOrder,
      }))
    );

    if (insertError) return jsonError(insertError.message, 500);
  }

  return NextResponse.json({ ok: true, profile: savedProfile.data });
}
