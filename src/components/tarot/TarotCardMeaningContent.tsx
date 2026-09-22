"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { TAROT_CARD_CATALOG } from "@/lib/tarot/cardCatalog";
import { getLocalizedTarotCardPageData, getTarotCardGroup } from "@/lib/tarot/card-page";

export function TarotCardMeaningContent({ cardKey }: { cardKey: string }) {
  const { locale, t } = useI18n();
  const card = getLocalizedTarotCardPageData(cardKey, locale);
  if (!card) return null;
  const index = TAROT_CARD_CATALOG.findIndex((item) => item.key === card.key);
  const previous = index > 0 ? getLocalizedTarotCardPageData(TAROT_CARD_CATALOG[index - 1].key, locale) : null;
  const next = index < TAROT_CARD_CATALOG.length - 1 ? getLocalizedTarotCardPageData(TAROT_CARD_CATALOG[index + 1].key, locale) : null;

  return <main className="pdu-home min-h-screen text-[#f8efe2]">
    <article className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-20">
      <div className="pdu-veil" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <nav aria-label={t("Navegação estrutural")} className="flex flex-wrap items-center gap-2 text-sm text-[#cfc4b9]">
          <Link href="/" className="transition hover:text-[#fff7e8]">Portal</Link><span aria-hidden="true">/</span>
          <Link href="/significados/tarot" className="transition hover:text-[#fff7e8]">{t("Significados do tarot")}</Link><span aria-hidden="true">/</span><span className="text-[#f5d896]">{card.name}</span>
        </nav>
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-[#f4d58d]/25 bg-[#0d0b16] shadow-[0_28px_100px_rgba(0,0,0,0.35)]"><Image src={card.assetPath} alt={`${t("Carta")} ${card.name}`} width={700} height={980} priority className="h-auto w-full object-contain p-8" /></div>
          <div><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5d896]"><Sparkles size={15} /> {getTarotCardGroup(card, locale)}</p><h1 className="brand-serif mt-5 text-6xl font-semibold leading-[0.95] text-[#fff7e8] sm:text-8xl">{card.name}</h1><p className="mt-7 max-w-2xl text-xl leading-9 text-[#e2d6ca]">{card.detail.guide.core}</p><div className="mt-7 flex flex-wrap gap-2">{card.detail.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-[#d8ccc0]">{keyword}</span>)}</div></div>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {[["O que representa", card.detail.guide.core, "#f4d58d"], ["Quando aparece", card.detail.upright, "#a7d7c5"], ["Quando pede cuidado", card.detail.reversed, "#d2818b"]].map(([title, copy, color]) => <section key={title} className="rounded-[24px] border border-white/15 bg-white/[0.055] p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color }}>{t(title)}</p><p className="mt-4 text-base leading-7 text-[#eee1d3]">{copy}</p></section>)}
        </div>
        <section className="mt-5 rounded-[24px] border border-white/12 bg-white/[0.055] p-7 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">{t("Pergunta para levar")}</p><p className="brand-serif mt-4 max-w-4xl text-3xl leading-tight text-[#fff7e8] sm:text-4xl">{card.detail.guide.question}</p><p className="mt-5 max-w-3xl text-base leading-7 text-[#cfc4b9]">{t("O significado não é uma sentença sobre o seu futuro. Ele é um ponto de partida para reconhecer o que esta carta movimenta no seu momento e escolher o que fazer com mais presença.")}</p></section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/tiradas" className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-bold text-[#211913] transition hover:bg-[#fff0bd]">{t("Fazer uma leitura gratuita")} <ArrowRight size={16} /></Link><Link href="/baralho" className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-[#fff7e8]">{t("Consultar outras cartas")} <BookOpen size={16} /></Link></div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">{previous ? <Link href={`/significados/tarot/${previous.key}`} className="inline-flex items-center gap-2 text-sm text-[#cfc4b9]"><ArrowLeft size={16} /> {previous.name}</Link> : <span />}{next ? <Link href={`/significados/tarot/${next.key}`} className="inline-flex items-center gap-2 text-sm text-[#cfc4b9]">{next.name} <ArrowRight size={16} /></Link> : null}</div>
      </div>
    </article>
  </main>;
}
