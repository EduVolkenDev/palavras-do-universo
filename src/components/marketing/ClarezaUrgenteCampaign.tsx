"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Compass, Sparkles } from "lucide-react";
import { recordSiteEvent } from "@/lib/client/siteEvents";
import type { Locale } from "@/lib/i18n/config";
import type { ProductCurrency } from "@/lib/product/pricing";

type CampaignCopy = {
  navBack: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  primaryCta: string;
  secondaryCta: string;
  priceNote: string;
  trustLine: string;
  imageAlt: string;
  freeEyebrow: string;
  freeTitle: string;
  freeCopy: string;
  freeCta: string;
  stepsEyebrow: string;
  stepsTitle: string;
  steps: Array<{ number: string; title: string; copy: string }>;
  boundaryEyebrow: string;
  boundaryTitle: string;
  boundaryCopy: string;
  forYou: string;
  forYouItems: string[];
  notForYou: string;
  notForYouItems: string[];
  careEyebrow: string;
  careTitle: string;
  careCopy: string;
  careCta: string;
  faqEyebrow: string;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
  footerNote: string;
  footerTerms: string;
  footerPrivacy: string;
};

type Props = {
  copy: CampaignCopy;
  locale: Locale;
  currency: ProductCurrency;
  price: string;
};

const CAMPAIGN = "clareza-urgente";

function readAttribution() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value.slice(0, 120);
  }

  return attribution;
}

function trackCampaignEvent(eventType: string, destination: string) {
  recordSiteEvent({
    eventType,
    productKey: destination === "checkout" ? "clareza_urgente" : null,
    context: {
      campaign: CAMPAIGN,
      destination,
      attribution: readAttribution(),
    },
  });
}

export default function ClarezaUrgenteCampaign({
  copy,
  locale,
  currency,
  price,
}: Props) {
  const freeHref = "/?campaign=clareza-urgente#leitura";
  const checkoutHref = `/?product=clareza_urgente&currency=${encodeURIComponent(
    currency
  )}&resume=checkout#produtos`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0911] text-[#f7efdc] selection:bg-[#f2cb76] selection:text-[#1a1420]">
      <header className="border-b border-white/10 bg-[#0a0911]/90 px-5 py-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            onClick={() => trackCampaignEvent("marketing.cta_click", "portal")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f7efdc] transition hover:border-[#f2cb76]/70 hover:text-[#f2cb76] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2cb76]"
          >
            <span aria-hidden="true">←</span>
            {copy.navBack}
          </Link>
          <span className="hidden text-right text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#c7b78f] sm:block">
            {copy.navLabel}
          </span>
        </div>
      </header>

      <section className="relative isolate border-b border-white/10 px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(242,203,118,0.16),transparent_30%),radial-gradient(circle_at_90%_35%,rgba(92,72,207,0.24),transparent_35%),linear-gradient(135deg,#0a0911_15%,#17132b_60%,#0a0911_100%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.8fr)] lg:gap-20">
          <div className="max-w-2xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.32em] text-[#f2cb76]">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-2xl font-serif text-[clamp(3.45rem,8vw,7.5rem)] leading-[0.86] tracking-[-0.06em] text-[#fff3d2]">
              {copy.title}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#d9d0c1] sm:text-xl sm:leading-9">
              {copy.lead}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={checkoutHref}
                onClick={() => trackCampaignEvent("marketing.cta_click", "checkout")}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#f2cb76] px-7 text-sm font-bold text-[#211722] shadow-[0_14px_50px_rgba(242,203,118,0.2)] transition hover:-translate-y-0.5 hover:bg-[#ffe19b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2cb76]"
              >
                {copy.primaryCta}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href={freeHref}
                onClick={() => trackCampaignEvent("marketing.cta_click", "free_reading")}
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#f2cb76]/50 px-7 text-sm font-semibold text-[#fff3d2] transition hover:border-[#f2cb76] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2cb76]"
              >
                {copy.secondaryCta}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#b8af9f]">
              <span className="font-semibold text-[#f2cb76]">{price}</span>
              <span>{copy.priceNote}</span>
            </div>
            <p className="mt-5 max-w-lg text-xs leading-6 text-[#9b9388]">{copy.trustLine}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -inset-7 -z-10 rounded-full bg-[#6456e8]/20 blur-3xl" />
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-[#f2cb76]/35 bg-[#151329] shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:rounded-[2.75rem]">
              <Image
                src="/assets/clareza-urgente.webp"
                alt={copy.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 48vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(10,9,17,0.04),transparent_45%,rgba(10,9,17,0.44))]" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-[#0c0b13]/72 p-4 backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
                <div className="flex items-center gap-3 text-sm font-semibold text-[#fff3d2]">
                  <Sparkles size={17} className="text-[#f2cb76]" aria-hidden="true" />
                  {copy.eyebrow}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#f7efdc] px-5 py-16 text-[#241923] sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8f7146]">{copy.stepsEyebrow}</p>
            <h2 className="mt-5 max-w-lg font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              {copy.stepsTitle}
            </h2>
          </div>
          <div className="grid divide-y divide-[#241923]/15 border-y border-[#241923]/15">
            {copy.steps.map((step) => (
              <div key={step.number} className="grid gap-4 py-7 sm:grid-cols-[5rem_1fr] sm:gap-8">
                <span className="font-mono text-sm font-semibold tracking-[0.2em] text-[#9e7b46]">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-base leading-7 text-[#655a52]">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[2rem] border border-[#f2cb76]/30 bg-[radial-gradient(circle_at_85%_10%,rgba(242,203,118,0.15),transparent_34%),rgba(255,255,255,0.035)] p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f2cb76]">{copy.freeEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl leading-[0.98] tracking-[-0.04em] text-[#fff3d2] sm:text-5xl">
              {copy.freeTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#c8c0b4]">{copy.freeCopy}</p>
          </div>
          <Link
            href={freeHref}
            onClick={() => trackCampaignEvent("marketing.cta_click", "free_reading")}
            className="inline-flex min-h-13 shrink-0 items-center justify-center gap-3 rounded-full bg-[#f7efdc] px-6 text-sm font-bold text-[#241923] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2cb76]"
          >
            {copy.freeCta}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f2cb76]">{copy.boundaryEyebrow}</p>
            <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#fff3d2] sm:text-6xl">
              {copy.boundaryTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c8c0b4]">{copy.boundaryCopy}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[#f2cb76]/35 bg-[#151329]/80 p-7 sm:p-9">
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-[#f2cb76]">{copy.forYou}</h3>
              <ul className="mt-6 space-y-4">
                {copy.forYouItems.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-7 text-[#eee4d1]">
                    <Check size={19} className="mt-1 shrink-0 text-[#8ff0ce]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-7 sm:p-9">
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8c0b4]">{copy.notForYou}</h3>
              <ul className="mt-6 space-y-4">
                {copy.notForYouItems.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-7 text-[#c8c0b4]">
                    <span className="mt-1 text-[#f2cb76]" aria-hidden="true">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#16132a] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[2rem] border border-[#8ff0ce]/25 bg-[radial-gradient(circle_at_10%_0%,rgba(143,240,206,0.12),transparent_34%),rgba(255,255,255,0.03)] p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#8ff0ce]">
              <Compass size={17} aria-hidden="true" />
              {copy.careEyebrow}
            </div>
            <h2 className="mt-4 font-serif text-4xl leading-[0.98] tracking-[-0.04em] text-[#fff3d2] sm:text-5xl">
              {copy.careTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#c8c0b4]">{copy.careCopy}</p>
          </div>
          <Link
            href="/profissionais"
            onClick={() => trackCampaignEvent("marketing.cta_click", "professionals")}
            className="inline-flex min-h-13 shrink-0 items-center justify-center gap-3 rounded-full border border-[#8ff0ce]/45 px-6 text-sm font-semibold text-[#e8fff7] transition hover:border-[#8ff0ce] hover:bg-[#8ff0ce]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8ff0ce]"
          >
            {copy.careCta}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="bg-[#f7efdc] px-5 py-16 text-[#241923] sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8f7146]">{copy.faqEyebrow}</p>
            <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">{copy.faqTitle}</h2>
          </div>
          <div className="divide-y divide-[#241923]/15 border-y border-[#241923]/15">
            {copy.faq.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8f7146]">
                  {item.question}
                  <ChevronDown size={20} className="shrink-0 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="max-w-2xl pr-8 pt-4 text-base leading-7 text-[#655a52]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0a0911] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-[#9b9388] sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.footerNote}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Links legais">
            <Link className="transition hover:text-[#f2cb76]" href="/termos">{copy.footerTerms}</Link>
            <Link className="transition hover:text-[#f2cb76]" href="/privacidade">{copy.footerPrivacy}</Link>
            <Link className="transition hover:text-[#f2cb76]" href={locale === "en" ? "/?lang=en" : "/"}>Palavras do Universo</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
