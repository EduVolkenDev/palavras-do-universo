"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Compass,
  Heart,
  Layers3,
  LockKeyhole,
  MoonStar,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getProductCardPrice,
  productCards,
} from "@/lib/product/catalog";
import type { ProductCurrency } from "@/lib/product/pricing";
import { useProductCurrency } from "@/lib/product/useProductCurrency";
import { ProductCurrencySwitch } from "@/components/ProductCurrencySwitch";
import { useI18n } from "@/components/I18nProvider";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PduAssetStory } from "@/components/PduAssetStory";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";

type SpreadKind = {
  productKey: string;
  icon: LucideIcon;
  visual: string;
  layer: string;
};

const spreadKinds: SpreadKind[] = [
  { productKey: "carta_do_dia", icon: Sparkles, visual: PDU_ASSETS.spreads.cardOfTheDayMobile, layer: "Grátis" },
  { productKey: "caminho_3_cartas", icon: Layers3, visual: PDU_ASSETS.spreads.threeCardPathMobile, layer: "Avulsa" },
  { productKey: "sinais_do_amor", icon: Heart, visual: PDU_ASSETS.spreads.loveSignalsMobile, layer: "Avulsa" },
  { productKey: "clareza_urgente", icon: Compass, visual: PDU_ASSETS.spreads.urgentClarityMobile, layer: "Avulsa" },
  { productKey: "tirada_diamante", icon: Sparkles, visual: PDU_ASSETS.spreads.diamondMobile, layer: "Avulsa + Círculo" },
  { productKey: "passaro_voando", icon: Compass, visual: PDU_ASSETS.spreads.flyingBirdMobile, layer: "Avulsa + Círculo" },
  { productKey: "a_chave", icon: LockKeyhole, visual: PDU_ASSETS.spreads.keyMobile, layer: "Avulsa + Círculo" },
  { productKey: "o_espelho", icon: Heart, visual: PDU_ASSETS.spreads.mirrorMobile, layer: "Avulsa + Círculo" },
  { productKey: "cruz_celta", icon: Layers3, visual: PDU_ASSETS.spreads.celticCrossMobile, layer: "Avulsa + Círculo" },
  { productKey: "relacionar", icon: Heart, visual: PDU_ASSETS.spreads.relationshipMobile, layer: "Avulsa + Círculo" },
  { productKey: "o_paradoxo", icon: MoonStar, visual: PDU_ASSETS.spreads.paradoxMobile, layer: "Avulsa + Círculo" },
  { productKey: "energia_da_semana", icon: CalendarDays, visual: PDU_ASSETS.spreads.weekEnergyMobile, layer: "Avulsa + Círculo" },
  { productKey: "mapa_do_momento", icon: MoonStar, visual: PDU_ASSETS.spreads.momentMapMobile, layer: "Avulsa + Círculo" },
];

function productHref(productKey: string, currency: ProductCurrency) {
  const product = productCards.find((item) => item.productKey === productKey);
  if (productKey === "carta_do_dia") return "/carta-do-dia";
  if (product?.href) {
    const separator = product.href.includes("?") ? "&" : "?";
    return `${product.href}${separator}currency=${encodeURIComponent(currency)}`;
  }
  return `/?product=${encodeURIComponent(productKey)}&currency=${encodeURIComponent(
    currency
  )}#leitura`;
}

export default function TiradasPage() {
  const { locale, t } = useI18n();
  const { currency: productCurrency, setCurrency: setProductCurrency } =
    useProductCurrency(locale);

  return (
    <main className="pdu-tiradas-page min-h-screen overflow-hidden bg-[#0b0a10] text-[#fff7e8]">
      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f4d58d]/12 blur-3xl" />
        <div className="absolute right-[-10rem] top-48 h-96 w-96 rounded-full bg-[#a7d7c5]/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-[#f5d896]">
              <span className="grid h-10 w-10 place-items-center rounded-[8px] border border-[#f4d58d]/35 bg-[#f4d58d]/10">
                <Sparkles size={19} />
              </span>
              Palavras do Universo
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ProductCurrencySwitch
                currency={productCurrency}
                locale={locale}
                onChange={setProductCurrency}
                tone="dark"
              />
              <Link
                href="/meu-universo"
                className="hidden rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-[#efe2d2] hover:border-[#f4d58d]/50 sm:inline-flex"
              >
                {t("Meu Universo")}
              </Link>
            </div>
          </header>

          <div className="grid gap-12 pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
                {t("Tiradas e jogos")}
              </p>
              <h1 className="brand-serif mt-4 max-w-3xl text-5xl font-semibold leading-[0.95] sm:text-7xl">
                {t("Escolha a porta certa antes de pedir resposta.")}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#cfc4b9]">
                {t("Cada tirada tem arquitetura, ritmo e profundidade próprios: da pausa diária aos mapas amplos e experiências especiais do Círculo.")}
              </p>
            </div>

            <div className="rounded-[8px] border border-[#f4d58d]/24 bg-white/[0.055] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["1", "Grátis", "Uma leitura curta por dia."],
                  ["2", "Avulsa", "Uma pergunta específica."],
                  ["3", "Círculo", "Ritual contínuo com memória."],
                ].map(([number, title, text]) => (
                  <div key={number} className="rounded-[8px] border border-white/10 bg-black/18 p-4">
                    <span className="text-xs font-semibold text-[#f5d896]">0{number}</span>
                    <strong className="mt-3 block text-sm">{t(title)}</strong>
                    <p className="mt-2 text-xs leading-5 text-[#bfb5ad]">{t(text)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section
            aria-labelledby="free-readings-title"
            className="mt-12 overflow-hidden rounded-[28px] border border-[#a7d7c5]/28 bg-[linear-gradient(110deg,rgba(167,215,197,0.13),rgba(244,213,141,0.08)_48%,rgba(255,255,255,0.04))] p-5 shadow-[0_25px_90px_rgba(0,0,0,0.24)] sm:p-7 lg:mt-16 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:p-9"
          >
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#a7d7c5]/35 bg-[#a7d7c5]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5eadb]">
                  <Sparkles size={13} />
                  {t("Comece grátis")}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
                  {t("Uma leitura gratuita por dia")}
                </span>
              </div>
              <h2
                id="free-readings-title"
                className="brand-serif mt-5 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl"
              >
                {t("Comece grátis")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#d8ccc0]">
                {t("Uma leitura gratuita por dia")}. {t("Mensagem e Carta do Dia para criar o hábito sem compromisso.")}
              </p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[22rem] lg:grid-cols-1">
              <Link
                href="/#leitura"
                className="group inline-flex items-center justify-between rounded-[18px] border border-[#f4d58d]/28 bg-black/20 px-5 py-4 text-sm font-semibold text-[#fff7e8] transition hover:border-[#f4d58d]/65 hover:bg-black/30"
              >
                <span>
                  <span className="block text-xs uppercase tracking-[0.14em] text-[#f5d896]">{t("Mensagem diária")}</span>
                  <span className="mt-1 block">{t("Receber agora")}</span>
                </span>
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/carta-do-dia"
                className="group inline-flex items-center justify-between rounded-[18px] border border-[#a7d7c5]/28 bg-black/20 px-5 py-4 text-sm font-semibold text-[#fff7e8] transition hover:border-[#a7d7c5]/65 hover:bg-black/30"
              >
                <span>
                  <span className="block text-xs uppercase tracking-[0.14em] text-[#c5eadb]">{t("Carta do dia")}</span>
                  <span className="mt-1 block">{t("Tirar minha carta")}</span>
                </span>
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </section>

          <div className="pdu-tiradas-grid mt-20 grid gap-7 sm:gap-8 lg:mt-24">
            {spreadKinds.map((kind) => {
              const product = productCards.find(
                (item) => item.productKey === kind.productKey
              );
              if (!product) return null;

              const Icon = kind.icon;
              return (
                <Link
                  key={kind.productKey}
                  href={productHref(kind.productKey, productCurrency)}
                  className="pdu-tiradas-card group relative flex min-h-[34rem] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#15131d] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#f4d58d]/55 hover:bg-[#191621] sm:min-h-[38rem] sm:p-7 lg:p-8"
                >
                  <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[#f4d58d]/10 blur-3xl transition group-hover:bg-[#f4d58d]/18" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <span className="rounded-full border border-[#f4d58d]/24 bg-[#f4d58d]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
                      {t(kind.layer)}
                    </span>
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-[#f4d58d]/22 bg-black/24 text-[#f4d58d]">
                      <Icon size={18} strokeWidth={1.6} />
                    </span>
                  </div>
                  <div className="pdu-tiradas-card__visual relative z-10 mt-8 overflow-hidden rounded-[24px] border border-[#f4d58d]/18">
                    <span className="pdu-tiradas-card__halo" aria-hidden="true" />
                    <span className="pdu-tiradas-card__orbit" aria-hidden="true" />
                    <Image
                      src={kind.visual}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 92vw, (max-width: 1280px) 44vw, 520px"
                      className="pdu-tiradas-card__image object-contain p-2 opacity-95 transition duration-500 group-hover:scale-[1.035] group-hover:opacity-100 sm:p-3"
                    />
                  </div>
                  <div className="relative z-10 mt-8 flex flex-1 flex-col">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a7d7c5]">
                      {t(product.archetype)}
                    </p>
                    <h2 className="brand-serif mt-3 text-3xl font-semibold leading-tight">
                      {t(product.title)}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
                      {t(product.promise)}
                    </p>
                    <div className="mt-6 rounded-[8px] border border-white/10 bg-black/18 p-4 text-sm leading-6 text-[#cfc4b9]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="block text-[#fff7e8]">
                          {t("Entrega")}
                        </strong>
                        {getProductCardPrice(product, productCurrency) ? (
                          <span className="rounded-full bg-[#f4d58d]/12 px-3 py-1 text-xs font-semibold text-[#f5d896]">
                            {getProductCardPrice(product, productCurrency)}
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-2 block">{t(product.bestFor)}</span>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-[#f5d896]">
                      {t(product.cta)}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 text-xs font-semibold text-[#cfc4b9]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
              <ShieldCheck size={14} />
              {t("Sem fatalismo")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
              <LockKeyhole size={14} />
              {t("Jornada privada")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
              <BadgeCheck size={14} />
              {t("Clareza prática")}
            </span>
          </div>
        </div>
      </section>

      <PduAssetStory {...PDU_ASSET_STORIES.spreads} />
    </main>
  );
}
