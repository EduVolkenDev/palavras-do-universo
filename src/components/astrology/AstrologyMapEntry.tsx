"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/I18nProvider";
import { buildLoginPath } from "@/lib/auth/redirect";
import { recordSiteEvent } from "@/lib/client/siteEvents";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { formatProductPrice } from "@/lib/product/pricing";
import { useProductCurrency } from "@/lib/product/useProductCurrency";

export function AstrologyMapEntry({ mapPath }: { mapPath: string }) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const { currency } = useProductCurrency(locale);
  const price = formatProductPrice("mapa_astral", currency);
  const tracked = useRef(false);
  const createAccountHref = buildLoginPath(mapPath, { lang: locale });

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    recordSiteEvent({
      eventType: "marketing.landing_view",
      productKey: "mapa_astral",
      context: { campaign: "conteudo_astrologia_4_semanas", destination: "astrology_map_entry" },
    });
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#171225] text-[#fff7e8]">
      <section className="relative isolate overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_38%,rgba(112,73,165,0.38),transparent_35%),radial-gradient(circle_at_25%_80%,rgba(244,213,141,0.12),transparent_34%)]" aria-hidden="true" />
        <div className="mx-auto max-w-7xl">
          <Link href="/astrologia" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d9c49f] transition hover:text-white">
            ← {isEnglish ? "Astrology" : "Astrologia"}
          </Link>

          <div className="mt-9 grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <div className="relative z-10 max-w-2xl py-8 lg:py-12">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]"><Sparkles size={15} aria-hidden="true" /> {isEnglish ? "Your birth chart, in human language" : "Seu mapa astral, em linguagem humana"}</p>
              <h1 className="brand-serif mt-5 text-5xl font-semibold leading-[0.98] sm:text-7xl">{isEnglish ? "A map for the way you are becoming." : "Um mapa para o jeito como você está se tornando."}</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#d8ccc0]">{isEnglish ? "Explore what the planets, signs, houses, and aspects can symbolize in your life—without treating astrology as a fixed destiny." : "Descubra o que planetas, signos, casas e aspectos podem simbolizar na sua vida — sem tratar a astrologia como um destino fixo."}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={createAccountHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-6 py-3 text-sm font-semibold text-[#241b18] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffe3a3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4d58d]">
                  {isEnglish ? "Start with the free layer" : "Começar pela camada gratuita"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <span className="text-xs leading-5 text-[#c8bdb5]">{isEnglish ? "A free account is only needed when you choose to prepare your personal map." : "A conta gratuita só é necessária quando você decidir preparar seu mapa pessoal."}</span>
              </div>
              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-[#d8ccc0]">
                <LockKeyhole className="mt-0.5 shrink-0 text-[#f5d896]" size={17} aria-hidden="true" />
                <p>{isEnglish ? "You can understand the experience before creating an account. Birth details are requested only when you choose to personalize your chart." : "Você pode entender a experiência antes de criar uma conta. Os dados de nascimento só são solicitados quando você decide personalizar o mapa."}</p>
              </div>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[42rem]">
              <div className="pointer-events-none absolute inset-[8%] rounded-full bg-[#8b5cc5]/20 blur-3xl" aria-hidden="true" />
              <Image src={PDU_ASSETS.astrology.orbitalMap} alt={isEnglish ? "An illustrated orbital map representing the birth chart experience." : "Ilustração de um mapa orbital que representa a experiência do mapa astral."} fill priority sizes="(max-width: 1024px) 100vw, 48rem" className="object-contain drop-shadow-[0_0_48px_rgba(244,213,141,0.2)]" />
              <div className="absolute bottom-[8%] left-1/2 w-[min(88%,27rem)] -translate-x-1/2 rounded-[24px] border border-[#f4d58d]/25 bg-[#1b1528]/90 p-5 shadow-[0_24px_70px_rgba(8,5,14,0.42)] backdrop-blur-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">{isEnglish ? "Start with what is open" : "Comece pelo que já está aberto"}</p>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#f4eadc] sm:grid-cols-2">
                  <li className="flex items-start gap-2"><Check size={17} className="mt-1 shrink-0 text-[#f5d896]" aria-hidden="true" />{isEnglish ? "Understand each planetary symbol" : "Entenda cada símbolo planetário"}</li>
                  <li className="flex items-start gap-2"><Check size={17} className="mt-1 shrink-0 text-[#f5d896]" aria-hidden="true" />{isEnglish ? "See how the chart is read in layers" : "Veja como o mapa é lido por camadas"}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f0e5] px-4 py-14 text-[#241b18] sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "No pressure to buy" : "Sem pressão para comprar"}</p>
            <h2 className="brand-serif mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{isEnglish ? "Begin for free. Go deeper only if it feels right." : "Comece de graça. Aprofunde só se fizer sentido para você."}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f615a]">{isEnglish ? "Your first layer introduces the chart and its symbols. The complete map adds personalized planets, houses, aspects, and interpretations, for a one-time payment." : "A primeira camada apresenta o mapa e seus símbolos. O mapa completo acrescenta planetas, casas, aspectos e interpretações personalizadas, em um pagamento único."}</p>
          </div>
          <div className="rounded-[24px] border border-[#d8c3a6] bg-[#fffaf2] p-6 shadow-[0_16px_42px_rgba(80,57,34,0.08)] lg:min-w-64">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">{isEnglish ? "Complete birth chart" : "Mapa Astral Completo"}</p>
            <p className="brand-serif mt-2 text-4xl font-semibold">{price}</p>
            <p className="mt-1 text-xs leading-5 text-[#6f615a]">{isEnglish ? "One-time payment · revisit anytime" : "Pagamento único · consulte quando quiser"}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
