import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  buildProfileSummary,
  getOfferPriceLabel,
  PROFESSIONAL_MARKETPLACE_SEED,
  normalizeAvailability,
  normalizeHandle,
  normalizePricingModel,
  type PublicProfessionalOffer,
  type PublicProfessionalProfile,
  toBool,
  toNumberOrNull,
  toStringList,
  trimText,
} from "@/lib/professionals/catalog";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type PageParams = {
  params: Promise<{ handle: string }>;
};

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
  return buildProfileSummary({
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
    pricingSignals: { paid: false, social: false, free: false },
    priceSummary: "",
  });
}

function seedProfile(handle: string) {
  const found = PROFESSIONAL_MARKETPLACE_SEED.find(
    (profile) => profile.handle === normalizeHandle(handle)
  );
  return found ? buildProfileSummary(found) : null;
}

async function loadProfile(handle: string) {
  const normalizedHandle = normalizeHandle(handle);

  if (!hasSupabaseConfig()) {
    return seedProfile(normalizedHandle);
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
    return seedProfile(normalizedHandle);
  }

  const { data: offers } = await supabase
    .from("professional_offers")
    .select(
      "id, profile_id, title, description, category, pricing_model, price_cents, social_price_cents, currency, duration_minutes, accepts_free, accepts_social, status, sort_order"
    )
    .eq("profile_id", profile.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const mappedOffers = (offers ?? [])
    .map((offer) => {
      const record = asRecord(offer);
      return record ? mapOffer(record) : null;
    })
    .filter(Boolean) as PublicProfessionalOffer[];

  return mapProfile(asRecord(profile) ?? {}, mappedOffers);
}

export function generateStaticParams() {
  return PROFESSIONAL_MARKETPLACE_SEED.map((profile) => ({
    handle: profile.handle,
  }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { handle } = await params;
  const profile = await loadProfile(handle);

  if (!profile) {
    return {
      title: "Profissional não encontrado | Palavras do Universo",
      description: "O perfil solicitado não está disponível.",
    };
  }

  return {
    title: `${profile.displayName} | Palavras do Universo`,
    description: profile.headline || profile.bio.slice(0, 160),
  };
}

export default async function ProfessionalProfilePage({ params }: PageParams) {
  const { handle } = await params;
  const profile = await loadProfile(handle);

  if (!profile) {
    notFound();
  }

  const location = [profile.city, profile.country].filter(Boolean).join(" · ") || "Online";
  const topOffer = profile.offers[0] ?? null;

  return (
    <main className="pdu-professional-page min-h-screen overflow-x-clip bg-[#07070c] text-[#fff7e8]">
      <section className="pdu-professional-hero px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(244,213,141,0.14),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(167,215,197,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/22 bg-white/[0.05] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
                <Sparkles size={14} />
                Perfil profissional
              </span>
              {profile.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#a7d7c5]/18 bg-[#a7d7c5]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a7d7c5]">
                  <BadgeCheck size={13} />
                  Verificado
                </span>
              ) : null}
            </div>

            <div className="max-w-3xl">
              <h1 className="brand-serif text-5xl font-semibold leading-[0.93] tracking-[-0.06em] text-[#fff7e8] sm:text-6xl">
                {profile.displayName}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#d6c9be]">
                {profile.headline}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/profissionais"
                className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
              >
                Voltar ao marketplace
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/entrar?next=/profissionais"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
              >
                Entrar para briefings
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  <UserRound size={13} />
                  Local
                </span>
                <strong className="mt-2 block text-lg text-[#fff7e8]">{location}</strong>
              </article>
              <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  <CalendarRange size={13} />
                  Resposta
                </span>
                <strong className="mt-2 block text-lg text-[#fff7e8]">
                  {profile.responseTime || "Em breve"}
                </strong>
              </article>
              <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  <ShieldCheck size={13} />
                  Faixa
                </span>
                <strong className="mt-2 block text-lg text-[#fff7e8]">{profile.priceSummary}</strong>
              </article>
            </div>
          </div>

          <aside className="pdu-professional-portrait">
            <div className="pdu-professional-portrait__glow" aria-hidden="true" />
            <div className="pdu-professional-portrait__frame">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-5xl font-semibold text-[#f5d896]">
                  {profile.displayName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="pdu-professional-card mt-4">
              <div className="pdu-professional-card__topline">
                <span>Marketplace de cuidado</span>
                <span>{profile.offerCount} oferta{profile.offerCount === 1 ? "" : "s"}</span>
              </div>
              <p className="pdu-professional-card__headline">{profile.headline}</p>
              <div className="pdu-professional-card__signals">
                <span>
                  <Heart size={12} />
                  {profile.pricingSignals.free ? "Tem atendimento gratuito" : "Atendimento pago ou social"}
                </span>
                <span>
                  <BadgeCheck size={12} />
                  {profile.pricingSignals.social ? "Valor social disponível" : "Sem valor social"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="pdu-professional-section">
            <div className="pdu-professional-section__head">
              <div>
                <p className="pdu-professional-kicker">Sobre o atendimento</p>
                <h2 className="brand-serif">Presença, clareza e faixa de acesso explícita.</h2>
              </div>
              <span className="pdu-professional-badge">
                <Star size={12} />
                Premium
              </span>
            </div>

            <p className="pdu-professional-copy">{profile.bio}</p>

            <div className="pdu-professional-tags" aria-label="Especialidades e modalidades">
              {profile.specialties.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {profile.languages.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {profile.modalities.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="pdu-professional-grid">
              <div className="pdu-professional-stat">
                <span>Publicação</span>
                <strong>{profile.isPublished ? "Visível" : "Pendente"}</strong>
              </div>
              <div className="pdu-professional-stat">
                <span>Agenda</span>
                <strong>{profile.availability === "available" ? "Aberta" : profile.availability === "limited" ? "Limitada" : "Fechada"}</strong>
              </div>
              <div className="pdu-professional-stat">
                <span>Identidade</span>
                <strong>{profile.isVerified ? "Verificada" : "Em validação"}</strong>
              </div>
            </div>
          </article>

          <article className="pdu-professional-section">
            <div className="pdu-professional-section__head">
              <div>
                <p className="pdu-professional-kicker">Ofertas</p>
                <h2 className="brand-serif">Opções que deixam a escolha clara.</h2>
              </div>
              {topOffer ? (
                <span className="pdu-professional-badge pdu-professional-badge--soft">
                  {getOfferPriceLabel(topOffer)}
                </span>
              ) : null}
            </div>

            <div className="pdu-professional-offers">
              {profile.offers.map((offer, index) => (
                <article
                  key={offer.id}
                  className="pdu-professional-offer"
                  style={{ "--pdu-offer-index": index } as CSSProperties}
                >
                  <div className="pdu-professional-offer__head">
                    <div>
                      <p>{offer.category}</p>
                      <h3>{offer.title}</h3>
                    </div>
                    <strong>{getOfferPriceLabel(offer)}</strong>
                  </div>
                  <p>{offer.description}</p>
                  <div className="pdu-professional-offer__meta">
                    <span>{offer.durationMinutes ? `${offer.durationMinutes} min` : "Sessão aberta"}</span>
                    <span>{offer.pricingModel === "free" ? "Gratuito" : offer.pricingModel === "social" ? "Social" : "Profissional"}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {[
            {
              title: "Acesso social",
              text: "Quando existe valor social, ele fica visível na página sem ruído nem ambiguidade.",
            },
            {
              title: "Atendimento gratuito",
              text: "Se houver vaga solidária, ela aparece como escolha explícita e não como detalhe escondido.",
            },
            {
              title: "Contato privado",
              text: "A jornada termina em briefing privado, com a conversa certa no lugar certo.",
            },
          ].map((item) => (
            <article key={item.title} className="pdu-professional-mini">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
