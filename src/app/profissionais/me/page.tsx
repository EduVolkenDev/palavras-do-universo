"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  normalizeAvailability,
  normalizeHandle,
  normalizePricingModel,
  trimText,
  toBool,
  toNumberOrNull,
  toStringList,
  type ProfessionalAvailability,
  type ProfessionalOfferStatus,
  type ProfessionalPricingModel,
} from "@/lib/professionals/catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ApiProfile = {
  handle?: string | null;
  display_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  specialties?: unknown;
  languages?: unknown;
  modalities?: unknown;
  availability?: string | null;
  is_published?: boolean | null;
  is_verified?: boolean | null;
  response_time?: string | null;
};

type ApiOffer = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  pricing_model?: string | null;
  price_cents?: number | string | null;
  social_price_cents?: number | string | null;
  currency?: string | null;
  duration_minutes?: number | string | null;
  accepts_free?: boolean | null;
  accepts_social?: boolean | null;
  status?: string | null;
  sort_order?: number | string | null;
};

type MeResponse =
  | { ok: true; profile: ApiProfile | null; offers: ApiOffer[] }
  | { error: string };

type ProfileDraft = {
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  city: string;
  country: string;
  avatarUrl: string;
  specialties: string;
  languages: string;
  modalities: string;
  availability: ProfessionalAvailability;
  isPublished: boolean;
  isVerified: boolean;
  responseTime: string;
};

type OfferDraft = {
  id?: string;
  title: string;
  description: string;
  category: string;
  pricingModel: ProfessionalPricingModel;
  priceCents: string;
  socialPriceCents: string;
  currency: string;
  durationMinutes: string;
  acceptsFree: boolean;
  acceptsSocial: boolean;
  status: ProfessionalOfferStatus;
  sortOrder: string;
};

const EMPTY_PROFILE: ProfileDraft = {
  handle: "",
  displayName: "",
  headline: "",
  bio: "",
  city: "",
  country: "",
  avatarUrl: "",
  specialties: "",
  languages: "",
  modalities: "",
  availability: "available",
  isPublished: false,
  isVerified: false,
  responseTime: "",
};

const EMPTY_OFFER: OfferDraft = {
  title: "",
  description: "",
  category: "",
  pricingModel: "quote",
  priceCents: "",
  socialPriceCents: "",
  currency: "BRL",
  durationMinutes: "",
  acceptsFree: false,
  acceptsSocial: false,
  status: "draft",
  sortOrder: "100",
};

function profileFromApi(value: ApiProfile | null | undefined): ProfileDraft {
  if (!value) return EMPTY_PROFILE;
  return {
    handle: trimText(value.handle, 80),
    displayName: trimText(value.display_name, 120),
    headline: trimText(value.headline, 160),
    bio: trimText(value.bio, 2000),
    city: trimText(value.city, 120),
    country: trimText(value.country, 80),
    avatarUrl: trimText(value.avatar_url, 500),
    specialties: toStringList(value.specialties, 8).join(", "),
    languages: toStringList(value.languages, 8).join(", "),
    modalities: toStringList(value.modalities, 6).join(", "),
    availability: normalizeAvailability(value.availability),
    isPublished: toBool(value.is_published),
    isVerified: toBool(value.is_verified),
    responseTime: trimText(value.response_time, 80),
  };
}

function offerFromApi(value: ApiOffer): OfferDraft {
  return {
    id: value.id ? trimText(value.id, 80) : undefined,
    title: trimText(value.title, 120),
    description: trimText(value.description, 1200),
    category: trimText(value.category, 80),
    pricingModel: normalizePricingModel(value.pricing_model),
    priceCents: value.price_cents === null || value.price_cents === undefined ? "" : String(value.price_cents),
    socialPriceCents:
      value.social_price_cents === null || value.social_price_cents === undefined
        ? ""
        : String(value.social_price_cents),
    currency: trimText(value.currency, 8) || "BRL",
    durationMinutes:
      value.duration_minutes === null || value.duration_minutes === undefined
        ? ""
        : String(value.duration_minutes),
    acceptsFree: toBool(value.accepts_free),
    acceptsSocial: toBool(value.accepts_social),
    status:
      value.status === "published" || value.status === "paused" ? value.status : "draft",
    sortOrder:
      value.sort_order === null || value.sort_order === undefined ? "100" : String(value.sort_order),
  };
}

function serializeList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseCents(value: string) {
  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

function getLoginHref() {
  const params = new URLSearchParams();
  const lang = new URLSearchParams(window.location.search).get("lang");
  const localeSuffix = lang === "en" || lang === "pt-BR" ? `?lang=${lang}` : "";
  params.set("next", `/profissionais/me${localeSuffix}`);
  if (lang === "en" || lang === "pt-BR") params.set("lang", lang);
  return `/entrar?${params.toString()}`;
}

export default function ProfessionalManagerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<ProfileDraft>(EMPTY_PROFILE);
  const [offers, setOffers] = useState<OfferDraft[]>([]);
  const [loadedHandle, setLoadedHandle] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            window.location.href = getLoginHref();
            return;
          }
        }

        const response = await fetch("/api/profissionais/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as MeResponse | null;

        if (response.status === 401) {
          window.location.href = getLoginHref();
          return;
        }

        if (!response.ok || !data || !("ok" in data) || !data.ok) {
          throw new Error((data && "error" in data && data.error) || "Não foi possível carregar seu perfil.");
        }

        setProfile(profileFromApi(data.profile));
        setOffers(data.offers.map(offerFromApi));
        setLoadedHandle(data.profile?.handle ? normalizeHandle(data.profile.handle) : "");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível carregar seu perfil.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const previewPath = useMemo(() => {
    const handle = normalizeHandle(profile.handle);
    return handle ? `/profissionais/${handle}` : "";
  }, [profile.handle]);

  const completeness = useMemo(() => {
    return [
      profile.handle,
      profile.displayName,
      profile.headline,
      profile.bio,
      profile.specialties,
      offers.length ? "offers" : "",
    ].filter(Boolean).length;
  }, [offers.length, profile.bio, profile.displayName, profile.handle, profile.headline, profile.specialties]);

  function updateOffer(index: number, patch: Partial<OfferDraft>) {
    setOffers((current) => current.map((offer, itemIndex) => (itemIndex === index ? { ...offer, ...patch } : offer)));
  }

  function addOffer() {
    setOffers((current) => [...current, { ...EMPTY_OFFER, sortOrder: String((current.length + 1) * 10) }]);
  }

  function removeOffer(index: number) {
    setOffers((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        profile: {
          ...profile,
          handle: normalizeHandle(profile.handle),
          specialties: serializeList(profile.specialties),
          languages: serializeList(profile.languages),
          modalities: serializeList(profile.modalities),
        },
        offers: offers
          .map((offer) => ({
            ...offer,
            pricingModel: normalizePricingModel(offer.pricingModel),
            priceCents: parseCents(offer.priceCents),
            socialPriceCents: parseCents(offer.socialPriceCents),
            durationMinutes: toNumberOrNull(offer.durationMinutes),
            sortOrder: Number.isFinite(Number(offer.sortOrder)) ? Number(offer.sortOrder) : 100,
          }))
          .filter((offer) => offer.title.trim() || offer.description.trim()),
      };

      if (!payload.profile.handle || !payload.profile.displayName || !payload.profile.headline || !payload.profile.bio) {
        throw new Error("Preencha o nome público, título e bio antes de salvar.");
      }

      const response = await fetch("/api/profissionais/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (response.status === 401) {
        window.location.href = getLoginHref();
        return;
      }
      if (!response.ok || !data || data.ok !== true) {
        throw new Error((data && "error" in data && data.error) || "Não foi possível salvar seu perfil.");
      }

      const refresh = await fetch("/api/profissionais/me", { cache: "no-store" });
      const refreshData = (await refresh.json().catch(() => null)) as MeResponse | null;
      if (!refresh.ok || !refreshData || !("ok" in refreshData) || !refreshData.ok) {
        throw new Error("Perfil salvo, mas não foi possível recarregar os dados.");
      }

      setProfile(profileFromApi(refreshData.profile));
      setOffers(refreshData.offers.map(offerFromApi));
      setLoadedHandle(refreshData.profile?.handle ? normalizeHandle(refreshData.profile.handle) : "");
      setNotice("Perfil salvo com segurança.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  const publishedPreview = profile.isPublished && previewPath;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#07070c] text-[#fff7e8]">
      <section className="relative overflow-hidden border-b border-white/8 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,213,141,0.14),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(167,215,197,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.88fr] lg:items-start">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/22 bg-white/[0.05] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
              <Sparkles size={14} />
              Gestão do profissional
            </p>
            <h1 className="brand-serif text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#fff7e8] sm:text-6xl">
              Cadastre e publique seu perfil com controle fino de acesso.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d6c9be]">
              Apresente seu trabalho, suas formas de atendimento e as faixas de acesso que deseja oferecer. Você controla quando o perfil entra no ar.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/profissionais"
                className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
              >
                Ver marketplace
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/meu-universo"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
              >
                Voltar ao Meu Universo
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-xs text-[#cfc4b9]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <BadgeCheck size={14} className="text-[#a7d7c5]" />
                Perfil público
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <ShieldCheck size={14} className="text-[#a7d7c5]" />
                Ofertas sempre sincronizadas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <CalendarRange size={14} className="text-[#a7d7c5]" />
                Briefings privados
              </span>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#f4d58d]/18 bg-[#f4d58d]/10 text-[#f5d896]">
                <UserRound size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  Checklist de publicação
                </p>
                <h2 className="brand-serif mt-2 text-2xl font-semibold text-[#fff7e8]">
                  {profile.displayName || "Perfil ainda não calibrado"}
                </h2>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-[#cfc4b9]">
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <span>Handle público</span>
                <strong className="text-[#fff7e8]">{normalizeHandle(profile.handle) || "defina um nome curto"}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <span>Completude</span>
                <strong className="text-[#fff7e8]">{completeness}/6</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <span>Status público</span>
                <strong className="text-[#fff7e8]">{profile.isPublished ? "Publicado" : "Rascunho"}</strong>
              </div>
            </div>

            <p className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-[#cfc4b9]">
              {loading
                ? "Carregando seu perfil e suas ofertas com segurança..."
                : "Salve para atualizar o perfil público e manter suas ofertas em sincronia."}
            </p>

            {publishedPreview ? (
              <Link
                href={previewPath}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
              >
                Abrir perfil público
                <ArrowRight size={16} />
              </Link>
            ) : (
              <p className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-[#cfc4b9]">
                Quando marcar como publicado e salvar, o perfil pode ser acessado por <code>/profissionais/{normalizeHandle(profile.handle) || "handle"}</code>.
              </p>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={saveProfile} className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.05fr]">
          <section className="grid gap-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  Dados públicos
                </p>
                <h2 className="brand-serif mt-2 text-3xl font-semibold text-[#fff7e8]">
                  Como você aparece no marketplace
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#cfc4b9]">
                <CheckCircle2 size={14} className="text-[#a7d7c5]" />
                Mudanças só entram no ar ao salvar
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Nome público
                <input
                  required
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, displayName: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Ex. Marina Luz"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Handle
                <input
                  required
                  value={profile.handle}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, handle: normalizeHandle(event.target.value) }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="marina-luz"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                Headline
                <input
                  required
                  value={profile.headline}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, headline: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Tarot terapêutico com clareza emocional"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                Bio
                <textarea
                  required
                  value={profile.bio}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, bio: event.target.value }))
                  }
                  rows={6}
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Conte como você atende e o que a pessoa pode esperar."
                />
              </label>
              <label className="grid gap-2 text-sm">
                Cidade
                <input
                  value={profile.city}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, city: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm">
                País
                <input
                  value={profile.country}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, country: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Imagem de avatar
                <input
                  value={profile.avatarUrl}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, avatarUrl: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="https://..."
                />
              </label>
              <label className="grid gap-2 text-sm">
                Tempo de resposta
                <input
                  value={profile.responseTime}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, responseTime: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Resposta em até 24h"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm">
                Especialidades
                <input
                  value={profile.specialties}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, specialties: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Tarot, terapia, vínculos"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Idiomas
                <input
                  value={profile.languages}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, languages: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Português, English"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Modalidades
                <input
                  value={profile.modalities}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, modalities: event.target.value }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                  placeholder="Online, Presencial"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm">
                Disponibilidade
                <select
                  value={profile.availability}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      availability: normalizeAvailability(event.target.value),
                    }))
                  }
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                >
                  <option value="available">Aberto</option>
                  <option value="limited">Poucas vagas</option>
                  <option value="closed">Fechado</option>
                </select>
              </label>
              <label className="flex items-end gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={profile.isPublished}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, isPublished: event.target.checked }))
                  }
                />
                Publicar no marketplace
              </label>
              <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <BadgeCheck
                  size={16}
                  className={profile.isVerified ? "text-[#a7d7c5]" : "text-[#8d837b]"}
                />
                {profile.isVerified
                  ? "Verificado pela plataforma"
                  : "Verificação pendente"}
              </div>
            </div>

            {error ? (
              <p className="rounded-[20px] border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {notice ? (
              <p className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100">
                {notice}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {loading ? "Carregando..." : saving ? "Salvando..." : "Salvar perfil"}
              </button>
              {loadedHandle ? (
                <Link
                  href={`/profissionais/${loadedHandle}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
                >
                  Ver perfil atual
                  <ArrowRight size={16} />
                </Link>
              ) : null}
            </div>
          </section>

          <section className="grid gap-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  Ofertas
                </p>
                <h2 className="brand-serif mt-2 text-3xl font-semibold text-[#fff7e8]">
                  Serviços, faixas sociais e vagas gratuitas
                </h2>
              </div>
              <button
                type="button"
                onClick={addOffer}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
              >
                <Plus size={16} />
                Nova oferta
              </button>
            </div>

            <div className="grid gap-4">
              {offers.length ? (
                offers.map((offer, index) => (
                  <article
                    key={offer.id ?? `${index}-${offer.title}`}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#cfc4b9]">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                          Oferta {index + 1}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                          ID {offer.id || "novo"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOffer(index)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/8 px-3 py-1.5 text-sm text-rose-100 hover:bg-rose-500/12"
                      >
                        <Trash2 size={14} />
                        Remover
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">
                        Título
                        <input
                          value={offer.title}
                          onChange={(event) => updateOffer(index, { title: event.target.value })}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Categoria
                        <input
                          value={offer.category}
                          onChange={(event) => updateOffer(index, { category: event.target.value })}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        />
                      </label>
                      <label className="grid gap-2 text-sm md:col-span-2">
                        Descrição
                        <textarea
                          value={offer.description}
                          onChange={(event) => updateOffer(index, { description: event.target.value })}
                          rows={4}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <label className="grid gap-2 text-sm">
                        Modelo
                        <select
                          value={offer.pricingModel}
                          onChange={(event) =>
                            updateOffer(index, {
                              pricingModel: normalizePricingModel(event.target.value),
                            })
                          }
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        >
                          <option value="quote">Sob consulta</option>
                          <option value="fixed">Preço cheio</option>
                          <option value="social">Valor social</option>
                          <option value="free">Gratuito</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm">
                        Preço cheio
                        <input
                          value={offer.priceCents}
                          onChange={(event) => updateOffer(index, { priceCents: event.target.value })}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                          placeholder="79,90"
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Preço social
                        <input
                          value={offer.socialPriceCents}
                          onChange={(event) =>
                            updateOffer(index, { socialPriceCents: event.target.value })
                          }
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                          placeholder="39,90"
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Duração
                        <input
                          value={offer.durationMinutes}
                          onChange={(event) => updateOffer(index, { durationMinutes: event.target.value })}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                          placeholder="50"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <label className="grid gap-2 text-sm">
                        Moeda
                        <input
                          value={offer.currency}
                          onChange={(event) => updateOffer(index, { currency: event.target.value })}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Ordem
                        <input
                          value={offer.sortOrder}
                          onChange={(event) => updateOffer(index, { sortOrder: event.target.value })}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        />
                      </label>
                      <label className="flex items-end gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={offer.acceptsSocial}
                          onChange={(event) =>
                            updateOffer(index, { acceptsSocial: event.target.checked })
                          }
                        />
                        Aceita social
                      </label>
                      <label className="flex items-end gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={offer.acceptsFree}
                          onChange={(event) => updateOffer(index, { acceptsFree: event.target.checked })}
                        />
                        Aceita gratuito
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm">
                        Status
                        <select
                          value={offer.status}
                          onChange={(event) =>
                            updateOffer(index, {
                              status:
                                event.target.value === "published" || event.target.value === "paused"
                                  ? event.target.value
                                  : "draft",
                            })
                          }
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                        >
                          <option value="draft">Rascunho</option>
                          <option value="published">Publicado</option>
                          <option value="paused">Pausado</option>
                        </select>
                      </label>
                      <p className="flex items-end rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-[#cfc4b9]">
                        Ao salvar, esta lista se torna a versão pública das suas ofertas. Itens removidos deixam de aparecer no perfil.
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-[#cfc4b9]">
                  Nenhuma oferta ainda. Adicione uma se quiser aparecer com preço cheio, valor social ou vaga gratuita.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addOffer}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
              >
                <Plus size={16} />
                Adicionar oferta
              </button>
              <p className="max-w-xl text-sm leading-6 text-[#cfc4b9]">
                Defina com clareza quando a oferta está publicada, pausada, com valor social ou disponível gratuitamente.
              </p>
            </div>
          </section>
        </div>
      </form>
    </main>
  );
}
