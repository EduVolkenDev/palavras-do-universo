"use client";

import {
  ArrowRight,
  Check,
  ChevronLeft,
  Lock,
  MoonStar,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildLoginPath } from "@/lib/auth/redirect";
import { useI18n } from "@/components/I18nProvider";
import { formatProductPrice } from "@/lib/product/pricing";
import { useProductCurrency } from "@/lib/product/useProductCurrency";
import { ASTROLOGY_FULL_PRODUCT_KEY } from "@/lib/astrology/natal-chart";

type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

type NatalBody =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

type Position = {
  body: NatalBody;
  sign: ZodiacSign;
  degreesInSign: number;
  house: number;
};

type Chart = {
  locationLabel: string;
  houseSystem: "whole-sign";
  ascendant: { sign: ZodiacSign; degreesInSign: number };
  positions: Position[];
  aspects: Array<{
    firstBody: NatalBody;
    secondBody: NatalBody;
    type: string;
    orb: number;
  }>;
};

const zodiacSigns: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const coreBodies: NatalBody[] = ["Sun", "Moon"];
const fullBodies: NatalBody[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

const bodyCopy: Record<NatalBody, { pt: string; en: string; insightPt: string; insightEn: string }> = {
  Sun: { pt: "Sol", en: "Sun", insightPt: "identidade, vitalidade e direção", insightEn: "identity, vitality, and direction" },
  Moon: { pt: "Lua", en: "Moon", insightPt: "necessidades emocionais e sensação de pertencimento", insightEn: "emotional needs and belonging" },
  Mercury: { pt: "Mercúrio", en: "Mercury", insightPt: "pensamento, linguagem e trocas", insightEn: "thought, language, and exchange" },
  Venus: { pt: "Vênus", en: "Venus", insightPt: "afeto, prazer e valores", insightEn: "affection, pleasure, and values" },
  Mars: { pt: "Marte", en: "Mars", insightPt: "desejo, ação e coragem", insightEn: "desire, action, and courage" },
  Jupiter: { pt: "Júpiter", en: "Jupiter", insightPt: "expansão, confiança e sentido", insightEn: "expansion, trust, and meaning" },
  Saturn: { pt: "Saturno", en: "Saturn", insightPt: "limites, tempo e maturidade", insightEn: "limits, time, and maturity" },
  Uranus: { pt: "Urano", en: "Uranus", insightPt: "liberdade, ruptura e inovação", insightEn: "freedom, disruption, and innovation" },
  Neptune: { pt: "Netuno", en: "Neptune", insightPt: "imaginação, sensibilidade e transcendência", insightEn: "imagination, sensitivity, and transcendence" },
  Pluto: { pt: "Plutão", en: "Pluto", insightPt: "transformação, poder e renascimento", insightEn: "transformation, power, and rebirth" },
};

const signCopy: Record<ZodiacSign, { pt: string; en: string }> = {
  aries: { pt: "Áries", en: "Aries" },
  taurus: { pt: "Touro", en: "Taurus" },
  gemini: { pt: "Gêmeos", en: "Gemini" },
  cancer: { pt: "Câncer", en: "Cancer" },
  leo: { pt: "Leão", en: "Leo" },
  virgo: { pt: "Virgem", en: "Virgo" },
  libra: { pt: "Libra", en: "Libra" },
  scorpio: { pt: "Escorpião", en: "Scorpio" },
  sagittarius: { pt: "Sagitário", en: "Sagittarius" },
  capricorn: { pt: "Capricórnio", en: "Capricorn" },
  aquarius: { pt: "Aquário", en: "Aquarius" },
  pisces: { pt: "Peixes", en: "Pisces" },
};

function formatPlacement(sign: ZodiacSign, degreesInSign: number, isEnglish: boolean) {
  return `${degreesInSign.toFixed(1)}° ${signCopy[sign][isEnglish ? "en" : "pt"]}`;
}

export function AstrologyChartExperience() {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const { currency } = useProductCurrency(locale);
  const [chart, setChart] = useState<Chart | null>(null);
  const [accessLevel, setAccessLevel] = useState<"preview" | "full">("preview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/astrology/natal", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { chart?: Chart; access?: { level?: "preview" | "full" }; error?: string };
        if (!response.ok || !payload.chart) throw new Error(payload.error ?? "chart-unavailable");
        if (!active) return;
        setChart(payload.chart);
        setAccessLevel(payload.access?.level === "full" ? "full" : "preview");
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "chart-unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const positionMap = useMemo(
    () => new Map((chart?.positions ?? []).map((position) => [position.body, position])),
    [chart?.positions],
  );
  const fullPrice = formatProductPrice(ASTROLOGY_FULL_PRODUCT_KEY, currency);
  const circlePrice = formatProductPrice("circulo_do_universo", currency);

  async function startCheckout(productKey: string) {
    setCheckoutLoading(productKey);
    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey, locale, currency }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (response.status === 401) {
        window.location.assign(buildLoginPath("/astrologia"));
        return;
      }
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error ?? "checkout-unavailable");
      window.location.assign(payload.checkoutUrl);
    } catch (caught) {
      setCheckoutError(caught instanceof Error ? caught.message : "checkout-unavailable");
    } finally {
      setCheckoutLoading("");
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-[#6f615a]">{isEnglish ? "Opening your map…" : "Abrindo o seu mapa…"}</div>;
  }

  if (error || !chart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-sm text-[#8a6b3f]">{isEnglish ? "Your map could not be opened right now." : "Não foi possível abrir o seu mapa agora."}</p>
        <Link href="/meu-universo#preparar-meu-mapa" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8]">
          {isEnglish ? "Review my birth context" : "Revisar meu contexto de nascimento"}
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const ascendantLabel = signCopy[chart.ascendant.sign][isEnglish ? "en" : "pt"];
  const unlockedPositions = accessLevel === "full" ? fullBodies : coreBodies;
  const lockedPositions = fullBodies.filter((body) => !unlockedPositions.includes(body));
  const ascendantIndex = zodiacSigns.indexOf(chart.ascendant.sign);

  return (
    <main className="min-h-screen bg-[#f7f0e5] text-[#241b18]">
      <section className="relative overflow-hidden bg-[#1f172a] px-4 pb-16 pt-8 text-[#fff7e8] sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#7049a5]/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-56 left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#f4d58d]/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/meu-universo" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d9c49f] hover:text-white">
            <ChevronLeft size={15} />
            {isEnglish ? "My Universe" : "Meu Universo"}
          </Link>
          <div className="mt-12 grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]"><Sparkles size={15} /> {isEnglish ? "Your natal sky" : "O seu céu de nascimento"}</p>
              <h1 className="brand-serif mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] sm:text-7xl">{isEnglish ? "A map for the way you are becoming." : "Um mapa para o jeito como você está se tornando."}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#d8ccc0]">{isEnglish ? "Astrology here is a symbolic language for noticing patterns, needs, talents, and the timing of your choices." : "Aqui, a astrologia é uma linguagem simbólica para reconhecer padrões, necessidades, talentos e o tempo das suas escolhas."}</p>
            </div>
            <div className="rounded-[28px] border border-[#f4d58d]/25 bg-white/[0.07] p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9c49f]">{isEnglish ? "Birth place" : "Local de nascimento"}</p>
              <p className="mt-2 text-lg text-[#fff7e8]">{chart.locationLabel}</p>
              <p className="mt-3 text-xs leading-5 text-[#bfb5ad]">{isEnglish ? "Calculated from your local birth time and the historical time rule for that date." : "Calculado a partir da sua hora local de nascimento e da regra histórica daquele dia."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <CoreCard icon={<Sun size={20} />} eyebrow={isEnglish ? "Sun sign" : "Signo solar"} title={bodyLabel("Sun", isEnglish)} placement={positionMap.get("Sun")} isEnglish={isEnglish} />
          <CoreCard icon={<MoonStar size={20} />} eyebrow={isEnglish ? "Moon sign" : "Signo lunar"} title={bodyLabel("Moon", isEnglish)} placement={positionMap.get("Moon")} isEnglish={isEnglish} />
          <CoreCard icon={<Sparkles size={20} />} eyebrow={isEnglish ? "Rising sign" : "Ascendente"} title={ascendantLabel} placement={{ sign: chart.ascendant.sign, degreesInSign: chart.ascendant.degreesInSign, house: 1 }} isEnglish={isEnglish} />
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "Your first layer" : "A sua primeira camada"}</p>
            <h2 className="brand-serif mt-3 text-4xl font-semibold sm:text-5xl">{accessLevel === "full" ? (isEnglish ? "The whole sky, in conversation." : "O céu inteiro em conversa.") : (isEnglish ? "The beginning is already yours." : "O começo já é seu.")}</h2>
          </div>
          <span className="rounded-full border border-[#caa96c]/50 bg-[#fffaf2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">{accessLevel === "full" ? (isEnglish ? "Complete map" : "Mapa completo") : (isEnglish ? "Free preview" : "Prévia gratuita")}</span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unlockedPositions.slice(2).map((body) => {
            const position = positionMap.get(body);
            return position ? <PlanetCard key={body} body={body} position={position} isEnglish={isEnglish} /> : null;
          })}
          {accessLevel !== "full" ? lockedPositions.map((body) => <LockedPlanetCard key={body} body={body} isEnglish={isEnglish} />) : null}
        </div>

        {accessLevel !== "full" ? (
          <div className="mt-8 grid gap-6 overflow-hidden rounded-[30px] border border-[#caa96c]/40 bg-[#241b18] p-6 text-[#fff7e8] shadow-[0_30px_80px_rgba(36,27,24,0.18)] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]"><Lock size={14} /> {isEnglish ? "Continue your map" : "Continue o seu mapa"}</p>
              <h3 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "See every planet, house, aspect, and influence." : "Veja cada planeta, casa, aspecto e influência."}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d8ccc0]">{isEnglish ? `Unlock the complete interpretation for ${fullPrice}, or access it as part of the Circle for ${circlePrice} per month.` : `Desbloqueie a interpretação completa por ${fullPrice}, ou tenha acesso a ela dentro do Círculo por ${circlePrice} ao mês.`}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button type="button" onClick={() => void startCheckout(ASTROLOGY_FULL_PRODUCT_KEY)} disabled={Boolean(checkoutLoading)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] hover:bg-[#ffe3a3] disabled:opacity-60">{checkoutLoading === ASTROLOGY_FULL_PRODUCT_KEY ? (isEnglish ? "Opening…" : "Abrindo…") : (isEnglish ? "Unlock my full map" : "Desbloquear meu mapa") } <ArrowRight size={16} /></button>
              <button type="button" onClick={() => void startCheckout("circulo_do_universo")} disabled={Boolean(checkoutLoading)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f4d58d]/45 px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:bg-white/10">{isEnglish ? "Join the Circle" : "Entrar no Círculo"}</button>
            </div>
          </div>
        ) : null}

        {accessLevel === "full" ? (
          <>
            <section className="mt-14 rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "The twelve rooms" : "As doze casas"}</p>
              <h2 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "Where the sky becomes personal." : "Onde o céu se torna pessoal."}</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {zodiacSigns.map((sign, index) => {
                  const house = ((index - ascendantIndex + 12) % 12) + 1;
                  return <div key={sign} className="rounded-2xl border border-[#e6d8c3] bg-white/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7b4b]">{isEnglish ? `House ${house}` : `Casa ${house}`}</p><p className="mt-2 font-medium text-[#332720]">{signCopy[sign][isEnglish ? "en" : "pt"]}</p></div>;
                })}
              </div>
            </section>
            <section className="mt-8 rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "Conversations in the sky" : "Conversas no céu"}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {chart.aspects.slice(0, 8).map((aspect) => <div key={`${aspect.firstBody}-${aspect.type}-${aspect.secondBody}`} className="rounded-2xl border border-[#e6d8c3] bg-white/70 p-4"><p className="font-medium text-[#332720]">{bodyLabel(aspect.firstBody, isEnglish)} · {aspectWord(aspect.type, isEnglish)} · {bodyLabel(aspect.secondBody, isEnglish)}</p><p className="mt-1 text-xs text-[#8a7667]">{isEnglish ? `orb ${aspect.orb.toFixed(1)}°` : `orbe de ${aspect.orb.toFixed(1)}°`}</p></div>)}
              </div>
            </section>
          </>
        ) : null}

        {checkoutError ? <p className="mt-5 text-center text-sm text-[#9a3c37]" role="alert">{checkoutError}</p> : null}
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-6 text-[#8a7667]">{isEnglish ? "Astrology is offered as a symbolic language for reflection and entertainment. It does not determine events, replace professional care, or remove your freedom of choice." : "A astrologia é oferecida como linguagem simbólica para reflexão e entretenimento. Ela não determina acontecimentos, substitui cuidados profissionais nem retira sua liberdade de escolha."}</p>
      </section>
    </main>
  );
}

function bodyLabel(body: NatalBody, isEnglish: boolean) {
  return bodyCopy[body][isEnglish ? "en" : "pt"];
}

function aspectWord(type: string, isEnglish: boolean) {
  const words: Record<string, [string, string]> = { conjunction: ["conjunção", "conjunction"], sextile: ["sextil", "sextile"], square: ["quadratura", "square"], trine: ["trígono", "trine"], opposition: ["oposição", "opposition"] };
  return words[type]?.[isEnglish ? 1 : 0] ?? type;
}

function CoreCard({ icon, eyebrow, title, placement, isEnglish }: { icon: React.ReactNode; eyebrow: string; title: string; placement?: { sign: ZodiacSign; degreesInSign: number; house: number }; isEnglish: boolean }) {
  return <article className="rounded-[26px] border border-[#d8c3a6] bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(80,57,34,0.07)]"><div className="flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#caa96c]/50 text-[#8a6b3f]">{icon}</span><span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a7b4b]">{eyebrow}</span></div><h3 className="brand-serif mt-6 text-3xl font-semibold">{title}</h3>{placement ? <p className="mt-2 text-sm text-[#6f615a]">{formatPlacement(placement.sign, placement.degreesInSign, isEnglish)} · {isEnglish ? `house ${placement.house}` : `casa ${placement.house}`}</p> : null}<p className="mt-5 border-t border-[#e6d8c3] pt-4 text-sm leading-6 text-[#6f615a]">{isEnglish ? "A complete symbolic explanation is available in your full map." : "A explicação simbólica completa está disponível no seu mapa completo."}</p></article>;
}

function PlanetCard({ body, position, isEnglish }: { body: NatalBody; position: Position; isEnglish: boolean }) {
  return <article className="rounded-[24px] border border-[#d8c3a6] bg-white/65 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a7b4b]">{bodyLabel(body, isEnglish)}</p><Check size={16} className="text-[#607464]" /></div><p className="brand-serif mt-4 text-2xl font-semibold">{formatPlacement(position.sign, position.degreesInSign, isEnglish)}</p><p className="mt-2 text-sm text-[#6f615a]">{isEnglish ? `House ${position.house}` : `Casa ${position.house}`}</p><p className="mt-4 border-t border-[#e6d8c3] pt-4 text-sm leading-6 text-[#6f615a]">{bodyCopy[body][isEnglish ? "insightEn" : "insightPt"]}</p></article>;
}

function LockedPlanetCard({ body, isEnglish }: { body: NatalBody; isEnglish: boolean }) {
  return <article className="relative overflow-hidden rounded-[24px] border border-[#d8c3a6] bg-[#eee4d5] p-5"><div className="blur-[2px]" aria-hidden="true"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a7b4b]">{bodyLabel(body, isEnglish)}</p><p className="brand-serif mt-4 text-2xl font-semibold">{isEnglish ? "Your placement" : "A sua posição"}</p><p className="mt-2 text-sm text-[#6f615a]">{isEnglish ? "Complete interpretation" : "Interpretação completa"}</p></div><div className="absolute inset-0 flex items-center justify-center bg-[#eee4d5]/70"><span className="inline-flex items-center gap-2 rounded-full border border-[#caa96c]/60 bg-[#fffaf2] px-3 py-2 text-xs font-semibold text-[#6f5134]"><Lock size={14} /> {isEnglish ? "Unlock" : "Desbloquear"}</span></div></article>;
}
