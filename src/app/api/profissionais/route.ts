import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import {
  buildProfileSummary,
  clampMarketplaceLimit,
  normalizeAvailability,
  normalizeHandle,
  normalizePricingModel,
  PROFESSIONAL_MARKETPLACE_SEED,
  ProfessionalMarketplaceFilters,
  type ProfessionalOfferDraft,
  type ProfessionalProfileDraft,
  type PublicProfessionalOffer,
  type PublicProfessionalProfile,
  trimText,
  toBool,
  toNumberOrNull,
  toStringList,
  applyMarketplaceFilters,
} from "@/lib/professionals/catalog";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function unavailableMarketplace() {
  return {
    ok: false as const,
    error: "Professional marketplace is temporarily unavailable.",
    professionals: [] as PublicProfessionalProfile[],
    total: 0,
    source: "unavailable" as const,
  };
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function mapOffer(offer: Record<string, unknown>): PublicProfessionalOffer {
  return {
    id: trimText(offer.id, 80),
    title: trimText(offer.title, 120),
    description: trimText(offer.description, 700),
    category: trimText(offer.category, 80),
    pricingModel: normalizePricingModel(offer.pricing_model),
    priceCents: toNumberOrNull(offer.price_cents),
    socialPriceCents: toNumberOrNull(offer.social_price_cents),
    currency: trimText(offer.currency, 8) || "BRL",
    durationMinutes: toNumberOrNull(offer.duration_minutes),
    acceptsFree: toBool(offer.accepts_free),
    acceptsSocial: toBool(offer.accepts_social),
    status:
      offer.status === "published" || offer.status === "paused"
        ? offer.status
        : "draft",
    sortOrder: Number.isFinite(Number(offer.sort_order))
      ? Number(offer.sort_order)
      : 100,
  };
}

function mapProfile(
  profile: Record<string, unknown>,
  offers: PublicProfessionalOffer[]
): PublicProfessionalProfile {
  const mapped = {
    id: trimText(profile.id, 80),
    userId: trimText(profile.user_id, 80),
    handle: normalizeHandle(profile.handle),
    displayName: trimText(profile.display_name, 120),
    headline: trimText(profile.headline, 160),
    bio: trimText(profile.bio, 1200),
    city: trimText(profile.city, 120),
    country: trimText(profile.country, 80),
    avatarUrl: trimText(profile.avatar_url, 500),
    specialties: toStringList(profile.specialties, 8),
    languages: toStringList(profile.languages, 8),
    modalities: toStringList(profile.modalities, 6),
    availability: normalizeAvailability(profile.availability),
    isPublished: toBool(profile.is_published),
    isVerified: toBool(profile.is_verified),
    responseTime: trimText(profile.response_time, 80),
    createdAt: trimText(profile.created_at, 80),
    updatedAt: trimText(profile.updated_at, 80),
    offers,
    offerCount: offers.length,
    pricingSignals: {
      paid: false,
      social: false,
      free: false,
    },
    priceSummary: "",
  };

  return buildProfileSummary(mapped);
}

function normalizeFilters(url: URL): ProfessionalMarketplaceFilters {
  return {
    query: url.searchParams.get("query") ?? undefined,
    specialty: url.searchParams.get("specialty") ?? undefined,
    access: url.searchParams.get("access") ?? undefined,
    availability: url.searchParams.get("availability") ?? undefined,
    limit: clampMarketplaceLimit(url.searchParams.get("limit"), 12),
  };
}

async function readPublicMarketplace(filters: ProfessionalMarketplaceFilters) {
  if (!hasSupabaseConfig()) {
    if (isProductionRuntime()) return unavailableMarketplace();
    return {
      ok: true as const,
      professionals: applyMarketplaceFilters(PROFESSIONAL_MARKETPLACE_SEED, filters).slice(
        0,
        filters.limit ?? 12
      ),
      total: PROFESSIONAL_MARKETPLACE_SEED.length,
      source: "seed" as const,
    };
  }

  const supabase = getSupabaseAdmin();
  const [{ data: profiles, error: profileError }, { data: offers, error: offerError }] =
    await Promise.all([
      supabase
        .from("professional_profiles")
        .select(
          "id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at"
        )
        .eq("is_published", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("professional_offers")
        .select(
          "id, profile_id, title, description, category, pricing_model, price_cents, social_price_cents, currency, duration_minutes, accepts_free, accepts_social, status, sort_order"
        )
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
    ]);

  if (profileError || offerError || !profiles) {
    if (isProductionRuntime()) return unavailableMarketplace();
    return {
      ok: true as const,
      professionals: applyMarketplaceFilters(PROFESSIONAL_MARKETPLACE_SEED, filters).slice(
        0,
        filters.limit ?? 12
      ),
      total: PROFESSIONAL_MARKETPLACE_SEED.length,
      source: "seed" as const,
    };
  }

  const offerGroups = new Map<string, PublicProfessionalOffer[]>();
  for (const offer of offers ?? []) {
    const record = asRecord(offer);
    if (!record) continue;
    const profileId = trimText(record.profile_id, 80);
    const nextOffer = mapOffer(record);
    const current = offerGroups.get(profileId) ?? [];
    current.push(nextOffer);
    offerGroups.set(profileId, current);
  }

  const professionals = (profiles ?? [])
    .map((profile) => {
      const record = asRecord(profile);
      if (!record) return null;
      const offerList = (offerGroups.get(trimText(record.id, 80)) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      if (!offerList.length) return null;
      return mapProfile(record, offerList);
    })
    .filter(Boolean) as PublicProfessionalProfile[];

  const filtered = applyMarketplaceFilters(professionals, filters).slice(
    0,
    filters.limit ?? 12
  );

  return {
    ok: true as const,
    professionals: filtered,
    total: professionals.length,
    source: "database" as const,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = normalizeFilters(url);
  const result = await readPublicMarketplace(filters);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

type MarketplaceManageBody = {
  profile?: unknown;
  offers?: unknown;
};

function normalizeProfileDraft(value: unknown): ProfessionalProfileDraft {
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
    // Verification is a staff-controlled state. It is intentionally ignored
    // by the write path below and retained only for legacy draft shape parity.
    isVerified: toBool(record?.isVerified),
    responseTime: trimText(record?.responseTime, 80),
  };
}

function normalizeOfferDraft(value: unknown): ProfessionalOfferDraft {
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

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return jsonError("Supabase is not configured", 503);
  }

  const parsed = await readJsonBody<MarketplaceManageBody>(request);
  if (!parsed.ok) return parsed.response;

  const profile = normalizeProfileDraft(parsed.body.profile);
  if (!profile.handle || !profile.displayName || !profile.headline || !profile.bio) {
    return jsonError("Missing professional profile fields", 400);
  }

  const offers = Array.isArray(parsed.body.offers)
    ? parsed.body.offers.map(normalizeOfferDraft).filter((item) => item.title && item.description)
    : [];

  const supabase = getSupabaseAdmin();
  await ensureSupabaseProfile(auth.user.id);

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("professional_profiles")
    .select("id, is_verified")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileLookupError) {
    return jsonError(profileLookupError.message, 500);
  }

  const profilePayload = {
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
    // A professional may edit their public profile, never self-verify it.
    is_verified: existingProfile?.is_verified ?? false,
    response_time: profile.responseTime || null,
  };

  const { data: savedProfile, error: saveProfileError } = existingProfile?.id
    ? await supabase
        .from("professional_profiles")
        .update(profilePayload)
        .eq("id", existingProfile.id)
        .select(
          "id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at"
        )
        .single()
    : await supabase
        .from("professional_profiles")
        .insert(profilePayload)
        .select(
          "id, user_id, handle, display_name, headline, bio, city, country, avatar_url, specialties, languages, modalities, availability, is_published, is_verified, response_time, created_at, updated_at"
        )
        .single();

  if (saveProfileError || !savedProfile) {
    return jsonError(saveProfileError?.message ?? "Could not save professional profile", 500);
  }

  const { error: deleteError } = await supabase
    .from("professional_offers")
    .delete()
    .eq("profile_id", savedProfile.id);
  if (deleteError) {
    return jsonError(deleteError.message, 500);
  }

  if (offers.length) {
    const offerPayload = offers.map((offer) => ({
      profile_id: savedProfile.id,
      title: offer.title,
      description: offer.description,
      category: offer.category,
      pricing_model: offer.pricingModel,
      price_cents: offer.priceCents,
      social_price_cents: offer.socialPriceCents,
      currency: offer.currency || "BRL",
      duration_minutes: offer.durationMinutes,
      accepts_free: offer.acceptsFree,
      accepts_social: offer.acceptsSocial,
      status: offer.status,
      sort_order: offer.sortOrder,
    }));

    const { error: offerInsertError } = await supabase
      .from("professional_offers")
      .insert(offerPayload);

    if (offerInsertError) {
      return jsonError(offerInsertError.message, 500);
    }
  }

  return NextResponse.json({
    ok: true,
    profile: savedProfile,
  });
}
