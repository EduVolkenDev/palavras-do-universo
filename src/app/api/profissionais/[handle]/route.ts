import { NextResponse } from "next/server";
import {
  buildProfileSummary,
  normalizeHandle,
  PROFESSIONAL_MARKETPLACE_SEED,
  type PublicProfessionalOffer,
  trimText,
} from "@/lib/professionals/catalog";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function mapOffer(offer: Record<string, unknown>): PublicProfessionalOffer {
  return {
    id: trimText(offer.id, 80),
    title: trimText(offer.title, 120),
    description: trimText(offer.description, 700),
    category: trimText(offer.category, 80),
    pricingModel: (offer.pricing_model as PublicProfessionalOffer["pricingModel"]) || "quote",
    priceCents: typeof offer.price_cents === "number" ? offer.price_cents : null,
    socialPriceCents: typeof offer.social_price_cents === "number" ? offer.social_price_cents : null,
    currency: trimText(offer.currency, 8) || "BRL",
    durationMinutes: typeof offer.duration_minutes === "number" ? offer.duration_minutes : null,
    acceptsFree: Boolean(offer.accepts_free),
    acceptsSocial: Boolean(offer.accepts_social),
    status:
      offer.status === "published" || offer.status === "paused"
        ? offer.status
        : "draft",
    sortOrder: typeof offer.sort_order === "number" ? offer.sort_order : 100,
  };
}

function seedProfile(handle: string) {
  const found = PROFESSIONAL_MARKETPLACE_SEED.find(
    (profile) => profile.handle === normalizeHandle(handle)
  );
  return found ? buildProfileSummary(found) : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const normalizedHandle = normalizeHandle(handle);

  if (!hasSupabaseConfig()) {
    const seed = seedProfile(normalizedHandle);
    if (!seed) return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    return NextResponse.json({ ok: true, profile: seed, source: "seed" });
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select(
      "id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at"
    )
    .eq("handle", normalizedHandle)
    .eq("is_published", true)
    .maybeSingle();

  if (profileError || !profile) {
    const seed = seedProfile(normalizedHandle);
    if (!seed) return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    return NextResponse.json({ ok: true, profile: seed, source: "seed" });
  }

  const { data: offers } = await supabase
    .from("professional_offers")
    .select(
      "id, profile_id, title, description, category, pricing_model, price_cents, social_price_cents, currency, duration_minutes, accepts_free, accepts_social, status, sort_order"
    )
    .eq("profile_id", profile.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const mappedOffers = (offers ?? []).map((offer) => {
    const record = asRecord(offer);
    return record ? mapOffer(record) : null;
  }).filter(Boolean) as PublicProfessionalOffer[];

  const responseProfile = buildProfileSummary({
    id: String(profile.id),
    userId: String(profile.user_id),
    handle: String(profile.handle),
    displayName: String(profile.display_name),
    headline: String(profile.headline),
    bio: String(profile.bio),
    city: profile.city ? String(profile.city) : "",
    country: profile.country ? String(profile.country) : "",
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : "",
    specialties: Array.isArray(profile.specialties) ? profile.specialties.map(String) : [],
    languages: Array.isArray(profile.languages) ? profile.languages.map(String) : [],
    modalities: Array.isArray(profile.modalities) ? profile.modalities.map(String) : [],
    availability: profile.availability === "limited" || profile.availability === "closed" ? profile.availability : "available",
    isPublished: Boolean(profile.is_published),
    isVerified: Boolean(profile.is_verified),
    responseTime: profile.response_time ? String(profile.response_time) : "",
    createdAt: String(profile.created_at),
    updatedAt: String(profile.updated_at),
    offers: mappedOffers,
    offerCount: mappedOffers.length,
    pricingSignals: { paid: false, social: false, free: false },
    priceSummary: "",
  });

  return NextResponse.json({ ok: true, profile: responseProfile, source: "database" });
}
