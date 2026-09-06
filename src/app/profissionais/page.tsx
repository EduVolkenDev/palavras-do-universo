"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  Heart,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { buildLoginPath } from "@/lib/auth/redirect";
import {
  getOfferPriceLabel,
  type PublicProfessionalProfile,
} from "@/lib/professionals/catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useI18n } from "@/components/I18nProvider";
import { PduAssetStory } from "@/components/PduAssetStory";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";

type MarketplaceResponse =
  | {
      ok: true;
      professionals: PublicProfessionalProfile[];
      total: number;
      source: "database" | "seed";
    }
  | {
      ok: false;
      error: string;
      professionals: PublicProfessionalProfile[];
      total: number;
      source: "unavailable";
    };

type InquiryDraft = {
  clientName: string;
  replyEmail: string;
  subject: string;
  brief: string;
  budget: string;
  timeline: string;
};

const EMPTY_INQUIRY: InquiryDraft = {
  clientName: "",
  replyEmail: "",
  subject: "",
  brief: "",
  budget: "",
  timeline: "",
};

const ACCESS_OPTIONS = [
  { id: "all", label: "Todos", value: "" },
  { id: "paid", label: "Preço cheio", value: "paid" },
  { id: "social", label: "Valor social", value: "social" },
  { id: "free", label: "Gratuito", value: "free" },
] as const;

const AVAILABILITY_OPTIONS = [
  { id: "any", label: "Disponibilidade", value: "" },
  { id: "available", label: "Aberto", value: "available" },
  { id: "limited", label: "Poucas vagas", value: "limited" },
  { id: "closed", label: "Fechado", value: "closed" },
] as const;

export default function ProfessionalsMarketplacePage() {
  const { t } = useI18n();
  const [professionals, setProfessionals] = useState<PublicProfessionalProfile[]>([]);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [access, setAccess] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHandle, setSelectedHandle] = useState("");
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryNotice, setInquiryNotice] = useState("");
  const [inquiryDraft, setInquiryDraft] = useState<InquiryDraft>(EMPTY_INQUIRY);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/profissionais?limit=24", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as MarketplaceResponse | null;
        if (!response.ok || !data || !("professionals" in data)) {
          throw new Error((data && "error" in data && data.error) || "Não foi possível carregar o marketplace.");
        }
        setProfessionals(data.professionals);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Não foi possível carregar o marketplace.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const filteredProfessionals = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return professionals.filter((profile) => {
      const haystack = [
        profile.displayName,
        profile.headline,
        profile.bio,
        profile.city,
        profile.country,
        ...profile.specialties,
        ...profile.languages,
        ...profile.modalities,
        ...profile.offers.map((offer) => `${offer.title} ${offer.description} ${offer.category}`),
      ]
        .join(" ")
        .toLowerCase();

      if (needle && !haystack.includes(needle)) return false;
      if (specialty && !profile.specialties.some((item) => item.toLowerCase().includes(specialty.toLowerCase()))) {
        return false;
      }
      if (access) {
        if (access === "paid" && !profile.pricingSignals.paid) return false;
        if (access === "social" && !profile.pricingSignals.social) return false;
        if (access === "free" && !profile.pricingSignals.free) return false;
      }
      if (availability && profile.availability !== availability) return false;
      return true;
    });
  }, [access, availability, professionals, query, specialty]);

  const selectedProfessional = useMemo(
    () => filteredProfessionals.find((profile) => profile.handle === selectedHandle) ?? null,
    [filteredProfessionals, selectedHandle]
  );

  const specialties = useMemo(() => {
    const set = new Set<string>();
    professionals.forEach((profile) => profile.specialties.forEach((item) => set.add(item)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [professionals]);

  useEffect(() => {
    if (!selectedProfessional) return;
    const firstOffer = selectedProfessional.offers[0];
    setInquiryDraft((current) => ({
      ...current,
      subject: current.subject || firstOffer?.title || selectedProfessional.displayName,
    }));
  }, [selectedProfessional]);

  function openInquiry(profile: PublicProfessionalProfile) {
    setSelectedHandle(profile.handle);
    const offer = profile.offers[0];
    setInquiryDraft({
      clientName: "",
      replyEmail: window.localStorage.getItem("volynx_user_email") || "",
      subject: offer?.title || profile.displayName,
      brief: "",
      budget: "",
      timeline: "",
    });
    setInquiryNotice("");
    setInquiryOpen(true);
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProfessional?.offers.length) return;

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = buildLoginPath("/profissionais");
        return;
      }
    }

    setInquirySubmitting(true);
    setInquiryNotice("Enviando briefing privado...");

    try {
      const response = await fetch("/api/profissionais/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: selectedProfessional.offers[0].id,
          clientName: inquiryDraft.clientName.trim() || "Pessoa interessada",
          replyEmail: inquiryDraft.replyEmail.trim(),
          subject: inquiryDraft.subject.trim(),
          brief: inquiryDraft.brief.trim(),
          budget: inquiryDraft.budget.trim(),
          timeline: inquiryDraft.timeline.trim(),
          accessPreference: "private",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (response.status === 401) {
        window.location.href = buildLoginPath("/profissionais");
        return;
      }
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Não foi possível enviar o briefing.");
      }

      setInquiryNotice("Briefing enviado. O profissional pode responder em privado.");
      setInquiryDraft((current) => ({ ...current, brief: "" }));
    } catch (caught) {
      setInquiryNotice(caught instanceof Error ? caught.message : "Não foi possível enviar o briefing.");
    } finally {
      setInquirySubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#07070c] text-[#fff7e8]">
      <section className="relative overflow-hidden border-b border-white/8 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,213,141,0.14),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(167,215,197,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/22 bg-white/[0.05] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
              <Sparkles size={14} />
              {t("Marketplace de cuidado")}
            </p>
            <h1 className="brand-serif text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#fff7e8] sm:text-6xl">
              {t("Conecte pessoas a profissionais que respeitam acesso, preço social e atendimento gratuito.")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d6c9be]">
              {t("Aqui, cada profissional publica sua presença, define sua faixa de acesso e recebe briefings privados. O sistema organiza descoberta, clareza de oferta e contato sem expor ninguém em público.")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#busca"
                className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
              >
                {t("Explorar agora")}
                <ArrowRight size={16} />
              </a>
              <Link
                href="/profissionais/me"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
              >
                {t("Sou profissional")}
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
              >
                {t("Voltar à home")}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 text-xs text-[#cfc4b9]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <BadgeCheck size={14} className="text-[#a7d7c5]" />
                {t("Perfil público")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <ShieldCheck size={14} className="text-[#a7d7c5]" />
                {t("Briefing privado")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <Heart size={14} className="text-[#a7d7c5]" />
                {t("Valor social e gratuito")}
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Descobrir",
                text: "Busca por especialidade, idioma e disponibilidade.",
                icon: Search,
              },
              {
                title: "Entender",
                text: "Preço cheio, social ou gratuito ficam visíveis.",
                icon: UserRound,
              },
              {
                title: "Conectar",
                text: "Briefing privado com contexto e retorno claro.",
                icon: CalendarRange,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
                  style={{ transform: `translateY(${index * 12}px)` }}
                >
                  <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#f4d58d]/18 bg-[#f4d58d]/10 text-[#f5d896]">
                    <Icon size={18} />
                  </span>
                  <h2 className="text-lg font-semibold text-[#fff7e8]">{t(step.title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#cfc4b9]">{t(step.text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <PduAssetStory {...PDU_ASSET_STORIES.professionals} />

      <section id="busca" className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:grid-cols-[1.35fr_0.65fr_0.65fr_0.65fr]">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
              {t("Buscar")}
              <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-[#fff7e8]">
                <Search size={16} className="text-[#a7d7c5]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("Tarot, terapia, energia, amor...")}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#8d837b]"
                />
              </div>
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
              {t("Especialidade")}
              <select
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#fff7e8] outline-none"
              >
                <option value="">{t("Todas")}</option>
                {specialties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
              {t("Acesso")}
              <select
                value={access}
                onChange={(event) => setAccess(event.target.value)}
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#fff7e8] outline-none"
              >
                {ACCESS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
              {t("Disponibilidade")}
              <select
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#fff7e8] outline-none"
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-[20px] border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                {t("Profissionais disponíveis")}
              </p>
              <h2 className="brand-serif mt-2 text-3xl font-semibold text-[#fff7e8]">
                {t("Descoberta pública com política de acesso explícita.")}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#cfc4b9]">
              {t("O catálogo abaixo lista perfis publicados e serviços com faixa de preço visível. Se quiser publicar o seu, a API de gestão já está pronta para ser ligada ao painel.")}
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <p className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-6 text-sm text-[#cfc4b9]">
                {t("Carregando marketplace...")}
              </p>
            ) : filteredProfessionals.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {filteredProfessionals.map((profile) => (
                  <article
                    key={profile.handle}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[24px] border border-[#f4d58d]/16 bg-[#0f0f17]">
                        {profile.avatarUrl ? (
                          <Image
                            src={profile.avatarUrl}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xl font-semibold text-[#f5d896]">
                            {profile.displayName
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="brand-serif text-2xl font-semibold text-[#fff7e8]">
                            {profile.displayName}
                          </h3>
                          {profile.isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#a7d7c5]/18 bg-[#a7d7c5]/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#a7d7c5]">
                              <BadgeCheck size={12} />
                              {t("Verificado")}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[#d6c9be]">{t(profile.headline)}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#cfc4b9]">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                            <ShieldCheck size={12} className="text-[#a7d7c5]" />
                            {t(profile.priceSummary)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                            <UserRound size={12} className="text-[#a7d7c5]" />
                            {profile.city || profile.country ? [profile.city, profile.country].filter(Boolean).join(" · ") : t("Online")}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                            <CalendarRange size={12} className="text-[#a7d7c5]" />
                            {profile.responseTime ? t(profile.responseTime) : t("Resposta em breve")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[#cfc4b9]">{t(profile.bio)}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.specialties.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#fff7e8]"
                        >
                          {t(item)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {profile.offers.slice(0, 2).map((offer) => (
                        <article
                          key={offer.id}
                          className="rounded-[20px] border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                                {t(offer.category)}
                              </p>
                              <h4 className="mt-1 font-semibold text-[#fff7e8]">
                                {t(offer.title)}
                              </h4>
                            </div>
                            <strong className="text-sm text-[#fff7e8]">{t(getOfferPriceLabel(offer))}</strong>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#cfc4b9]">{t(offer.description)}</p>
                        </article>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <a
                        href={`/profissionais/${profile.handle}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45 hover:bg-white/[0.07]"
                      >
                        {t("Ver perfil")}
                      </a>
                      <button
                        type="button"
                        onClick={() => openInquiry(profile)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-4 py-2.5 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
                      >
                        {t("Enviar briefing")}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-8 text-center">
                <h3 className="brand-serif text-2xl font-semibold text-[#fff7e8]">
                  {t("O primeiro círculo está sendo formado.")}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#cfc4b9]">
                  {t("Ainda não há profissionais publicados para estes filtros. Perfis só aparecem depois de configurar oferta, disponibilidade e forma de acesso.")}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/profissionais/me"
                    className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-4 py-2.5 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
                  >
                    {t("Publicar meu perfil profissional")}
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSpecialty("");
                      setAccess("");
                      setAvailability("");
                    }}
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] hover:border-[#f4d58d]/45"
                  >
                    {t("Limpar filtros")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {[
            {
              title: "Valor social explícito",
              text: "Cada profissional define quando abre uma faixa mais acessível para ampliar o alcance do cuidado.",
            },
            {
              title: "Atendimento gratuito opcional",
              text: "Quem quiser pode oferecer vagas sem cobrança, sem perder clareza comercial ou ética.",
            },
            {
              title: "Briefing privado",
              text: "O primeiro contato não acontece em público. A conexão começa com contexto e respeito.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"
            >
              <h3 className="text-lg font-semibold text-[#fff7e8]">{t(item.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-[#cfc4b9]">{t(item.text)}</p>
            </article>
          ))}
        </div>
      </section>

      <dialog
        open={inquiryOpen}
        className="fixed inset-0 z-50 m-auto w-[min(92vw,760px)] rounded-[28px] border border-white/10 bg-[#0b0a12] p-0 text-[#fff7e8] shadow-[0_36px_120px_rgba(0,0,0,0.5)] backdrop:bg-black/65"
      >
        <form
          method="dialog"
          className="absolute right-4 top-4"
        >
          <button
            type="submit"
            onClick={() => setInquiryOpen(false)}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-[#cfc4b9]"
          >
            {t("Fechar")}
          </button>
        </form>
        <form onSubmit={submitInquiry} className="grid gap-5 p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
              {t("Briefing privado")}
            </p>
            <h2 className="brand-serif mt-2 text-3xl font-semibold text-[#fff7e8]">
              {selectedProfessional?.displayName || t("Enviar briefing")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#cfc4b9]">
              {t("O briefing entra no painel do profissional e o contato continua privado entre as partes.")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              {t("Seu nome")}
              <input
                required
                value={inquiryDraft.clientName}
                onChange={(event) =>
                  setInquiryDraft((current) => ({ ...current, clientName: event.target.value }))
                }
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                placeholder={t("Como você quer ser chamado")}
              />
            </label>
            <label className="grid gap-2 text-sm">
              {t("Seu e-mail")}
              <input
                required
                type="email"
                value={inquiryDraft.replyEmail}
                onChange={(event) =>
                  setInquiryDraft((current) => ({ ...current, replyEmail: event.target.value }))
                }
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                placeholder={t("voce@exemplo.com")}
              />
            </label>
            <label className="grid gap-2 text-sm">
              {t("Assunto")}
              <input
                required
                value={inquiryDraft.subject}
                onChange={(event) =>
                  setInquiryDraft((current) => ({ ...current, subject: event.target.value }))
                }
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none md:col-span-2"
                placeholder={t("O que você precisa")}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            {t("Briefing")}
            <textarea
              required
              value={inquiryDraft.brief}
              onChange={(event) =>
                setInquiryDraft((current) => ({ ...current, brief: event.target.value }))
              }
              rows={6}
              className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
              placeholder={t("Conte o contexto, o que você busca e o que precisa evitar")}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              {t("Orçamento")}
              <input
                value={inquiryDraft.budget}
                onChange={(event) =>
                  setInquiryDraft((current) => ({ ...current, budget: event.target.value }))
                }
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                placeholder={t("R$ 80 - R$ 150")}
              />
            </label>
            <label className="grid gap-2 text-sm">
              {t("Prazo")}
              <input
                value={inquiryDraft.timeline}
                onChange={(event) =>
                  setInquiryDraft((current) => ({ ...current, timeline: event.target.value }))
                }
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
                placeholder={t("Nesta semana")}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={inquirySubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inquirySubmitting ? t("Enviando...") : t("Enviar briefing")}
              <ArrowRight size={16} />
            </button>
            <p className="text-sm text-[#cfc4b9]">{inquiryNotice}</p>
          </div>
        </form>
      </dialog>
    </main>
  );
}
