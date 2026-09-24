"use client";

import { ArrowRight, BookOpen, Clock3, MoonStar, Orbit, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/I18nProvider";
import { recordSiteEvent } from "@/lib/client/siteEvents";
import { appendMarketingAttribution, type MarketingAttribution } from "@/lib/marketing/attribution";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { formatProductPrice } from "@/lib/product/pricing";
import { useProductCurrency } from "@/lib/product/useProductCurrency";

const experiences = [
  {
    key: "sky",
    asset: PDU_ASSETS.astrology.mySky,
    icon: MoonStar,
    eyebrowPt: "HOJE",
    eyebrowEn: "TODAY",
    titlePt: "Meu Céu Hoje",
    titleEn: "My Sky Today",
    textPt: "Uma leitura do clima emocional do dia, conectada ao seu mapa e ao momento que você está vivendo.",
    textEn: "A reading of the emotional weather of the day, connected to your chart and the moment you are living.",
  },
  {
    key: "pulse",
    asset: PDU_ASSETS.astrology.pulse,
    icon: Orbit,
    eyebrowPt: "ATMOSFERA",
    eyebrowEn: "ATMOSPHERE",
    titlePt: "Pulso Cósmico",
    titleEn: "Cosmic Pulse",
    textPt: "Um sinal simples para perceber onde a sua energia está pedindo presença, direção ou descanso.",
    textEn: "A clear signal for noticing where your energy is asking for presence, direction, or rest.",
  },
  {
    key: "map",
    asset: PDU_ASSETS.astrology.myMap,
    icon: Sparkles,
    eyebrowPt: "BASE PESSOAL",
    eyebrowEn: "PERSONAL FOUNDATION",
    titlePt: "Meu Mapa",
    titleEn: "My Map",
    textPt: "Planetas, signos, casas e aspectos explicados em uma linguagem que você consegue acompanhar.",
    textEn: "Planets, signs, houses, and aspects explained in a language you can actually follow.",
  },
  {
    key: "time",
    asset: PDU_ASSETS.astrology.myTime,
    icon: Clock3,
    eyebrowPt: "RITMO",
    eyebrowEn: "RHYTHM",
    titlePt: "Meu Tempo",
    titleEn: "My Time",
    textPt: "Uma forma mais sensível de entender fases, transições e os diferentes ritmos da sua jornada.",
    textEn: "A gentler way to understand phases, transitions, and the different rhythms of your journey.",
  },
];

export function AstrologyOverview({ attribution = {} }: { attribution?: MarketingAttribution }) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const { currency } = useProductCurrency(locale);
  const fullPrice = formatProductPrice("mapa_astral", currency);
  const circlePrice = formatProductPrice("circulo_do_universo", currency);
  const mapQuery = new URLSearchParams({ product: "mapa_astral", currency });
  appendMarketingAttribution(mapQuery, attribution);
  const mapHref = `/astrologia/mapa?${mapQuery.toString()}`;
  const landingTracked = useRef(false);

  useEffect(() => {
    if (landingTracked.current) return;
    landingTracked.current = true;
    recordSiteEvent({
      eventType: "marketing.landing_view",
      productKey: "mapa_astral",
      context: { campaign: "conteudo_astrologia_4_semanas", destination: "astrology_landing", attribution },
    });
  }, [attribution]);

  function trackMapEntry(destination: string) {
    recordSiteEvent({
      eventType: "marketing.cta_click",
      productKey: "mapa_astral",
      context: { campaign: "conteudo_astrologia_4_semanas", destination, attribution },
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#171225] text-[#fff7e8]">
      <section className="relative px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <Image src={PDU_ASSETS.astrology.skyAtmosphere} alt="" fill sizes="100vw" className="pointer-events-none object-cover opacity-45" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,37,0.6),#171225_70%,#f7f0e5_100%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d9c49f] transition hover:text-white">
            ← {isEnglish ? "Palavras do Universo" : "Palavras do Universo"}
          </Link>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]"><Sparkles size={15} /> {isEnglish ? "The astrology of Palavras do Universo" : "A astrologia do Palavras do Universo"}</p>
              <h1 className="brand-serif mt-5 text-5xl font-semibold leading-[0.96] sm:text-7xl">{isEnglish ? "Your sky is more than a map." : "O seu céu é muito mais do que um mapa."}</h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#d8ccc0]">{isEnglish ? "Discover your Sun, Moon, and rising sign in the free first layer. If you want to go deeper, unlock the complete birth chart with planets, houses, aspects, and personalized explanations." : "Descubra Sol, Lua e Ascendente na primeira camada gratuita. Se quiser aprofundar, desbloqueie o mapa astral completo com planetas, casas, aspectos e explicações personalizadas."}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={mapHref} onClick={() => trackMapEntry("hero_free_layer")} className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffe3a3]">
                  {isEnglish ? "Open my free first layer" : "Abrir minha primeira camada grátis"}
                  <ArrowRight size={16} />
                </Link>
                <span className="text-xs leading-5 text-[#c8bdb5]">{isEnglish ? "Create a free account. You only pay if you choose to unlock the complete map." : "Crie uma conta grátis. Você só paga se escolher liberar o mapa completo."}</span>
              </div>
              <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#f4d58d]/25 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">{isEnglish ? "Complete birth chart" : "Mapa Astral Completo"}</p>
                  <p className="brand-serif mt-2 text-3xl font-semibold text-white">{fullPrice}</p>
                  <p className="mt-1 text-xs leading-5 text-[#c8bdb5]">{isEnglish ? "One-time payment. Yours to revisit." : "Pagamento único. Seu para rever quando quiser."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#110d1e]/55 p-4 backdrop-blur-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#d9c49f]">{isEnglish ? "Included in the Circle" : "Também incluído no Círculo"}</p>
                  <p className="brand-serif mt-2 text-3xl font-semibold text-white">{circlePrice}<span className="ml-1 text-sm font-normal text-[#c8bdb5]">/{isEnglish ? "month" : "mês"}</span></p>
                  <p className="mt-1 text-xs leading-5 text-[#c8bdb5]">{isEnglish ? "For continued readings and your symbolic history." : "Para leituras contínuas e seu histórico simbólico."}</p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[28rem] overflow-hidden rounded-[36px] border border-[#f4d58d]/25 bg-[#110d1e]/70 p-5 shadow-[0_32px_100px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:min-h-[36rem] sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(244,213,141,0.2),transparent_28%),linear-gradient(135deg,rgba(38,24,64,0.28),rgba(11,8,20,0.8))]" />
              <div className="relative flex min-h-[26rem] items-center justify-center sm:min-h-[34rem]">
                <span className="absolute left-0 top-0 rounded-full border border-[#f4d58d]/30 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">{isEnglish ? "A universe in motion" : "Um universo em movimento"}</span>
                <div className="relative h-[23rem] w-[23rem] sm:h-[31rem] sm:w-[31rem]">
                  <Image src={PDU_ASSETS.astrology.orbitalMap} alt="" fill priority sizes="(max-width: 640px) 23rem, 31rem" className="object-contain opacity-95 drop-shadow-[0_0_48px_rgba(244,213,141,0.28)]" />
                  <div className="absolute inset-[21%] animate-[spin_34s_linear_infinite] rounded-full border border-[#f4d58d]/30" aria-hidden="true" />
                </div>
                <div className="absolute bottom-0 right-0 max-w-[17rem] rounded-2xl border border-white/10 bg-[#0d0a17]/80 p-4 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">{isEnglish ? "Not fixed destiny" : "Não é destino fixo"}</p>
                  <p className="mt-2 text-sm leading-6 text-[#d8ccc0]">{isEnglish ? "A symbolic language for more context, presence, and choice." : "Uma linguagem simbólica para mais contexto, presença e escolha."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experiencias" className="relative bg-[#f7f0e5] px-4 py-16 text-[#241b18] sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "A complete astrology experience" : "Uma experiência completa de astrologia"}</p>
            <h2 className="brand-serif mt-4 text-4xl font-semibold leading-tight sm:text-6xl">{isEnglish ? "Choose the layer that meets you today." : "Escolha a camada que encontra você hoje."}</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6f615a]">{isEnglish ? "You do not need to know astrology before entering. Each layer explains what it means, why it matters, and how it can become a practical reflection." : "Você não precisa conhecer astrologia antes de entrar. Cada camada explica o que significa, por que importa e como pode se tornar uma reflexão prática."}</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {experiences.map((experience) => {
              const Icon = experience.icon;
              return (
                <Link key={experience.key} href={mapHref} onClick={() => trackMapEntry(`experience_${experience.key}`)} className="group relative min-h-[18rem] overflow-hidden rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(80,57,34,0.07)] transition duration-500 hover:-translate-y-1 hover:border-[#b69256] hover:shadow-[0_26px_65px_rgba(80,57,34,0.14)] sm:p-8">
                  <div className="absolute -right-8 -top-10 h-72 w-72 opacity-75 transition duration-500 group-hover:scale-110 group-hover:opacity-100"><Image src={experience.asset} alt="" fill sizes="18rem" className="object-contain" /></div>
                  <div className="relative z-10 max-w-[62%]">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-[#caa96c]/60 bg-[#f8efe2] text-[#8a6b3f]"><Icon size={19} /></span>
                    <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#9a7b4b]">{isEnglish ? experience.eyebrowEn : experience.eyebrowPt}</p>
                    <h3 className="brand-serif mt-3 text-3xl font-semibold sm:text-4xl">{isEnglish ? experience.titleEn : experience.titlePt}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6f615a]">{isEnglish ? experience.textEn : experience.textPt}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#8a6b3f]">{isEnglish ? "Open experience" : "Abrir experiência"} <ArrowRight size={15} /></span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 overflow-hidden rounded-[32px] bg-[#241b18] p-6 text-[#fff7e8] sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:p-10">
            <div className="relative min-h-[15rem] overflow-hidden rounded-2xl bg-[#171225]"><Image src={PDU_ASSETS.astrology.moonPortal} alt="" fill sizes="(max-width: 1024px) 100vw, 28rem" className="object-cover opacity-90 transition duration-700 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#0d0a17]/80 via-transparent to-transparent" /></div>
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]"><BookOpen size={15} /> {isEnglish ? "The next layer" : "A próxima camada"}</p>
              <h3 className="brand-serif mt-4 text-3xl font-semibold sm:text-4xl">{isEnglish ? "When your sky meets your symbols." : "Quando o seu céu encontra os seus símbolos."}</h3>
              <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">{isEnglish ? "Your Tarot readings can converse with the movements of your chart — as correspondence, never as fixed destiny. With time, Lume and your symbolic memory make the experience more personal." : "As suas leituras de Tarot podem conversar com os movimentos do seu mapa — como correspondência, nunca como destino fixo. Com o tempo, Lume e a sua memória simbólica tornam a experiência mais pessoal."}</p>
              <Link href={mapHref} onClick={() => trackMapEntry("closing_cta")} className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/45 px-5 py-3 text-sm font-semibold text-[#fff7e8] transition hover:bg-white/10">{isEnglish ? "Start my sky" : "Começar pelo meu céu"} <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
