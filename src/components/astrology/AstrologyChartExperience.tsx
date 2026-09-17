"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronDown,
  CircleHelp,
  Compass,
  Lock,
  LockKeyhole,
  Layers3,
  MoonStar,
  Orbit,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { buildLoginPath } from "@/lib/auth/redirect";
import { useI18n } from "@/components/I18nProvider";
import { formatProductPrice } from "@/lib/product/pricing";
import { useProductCurrency } from "@/lib/product/useProductCurrency";
import {
  ASTROLOGY_FULL_PRODUCT_KEY,
  type NatalAspectType,
} from "@/lib/astrology/natal-chart";
import {
  getAspectInterpretation,
  getAscendantInterpretation,
  getBodyInterpretation,
  getHouseInterpretation,
  getSignInterpretation,
  type AstrologyLocale,
} from "@/lib/astrology/interpretations";
import { PDU_ASSETS } from "@/lib/pdu-assets";

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

type AstrologySelection = NatalBody | "Ascendant";

type Chart = {
  locationLabel: string;
  houseSystem: "whole-sign";
  ascendant: { sign: ZodiacSign; degreesInSign: number };
  positions: Position[];
  aspects: Array<{
    firstBody: NatalBody;
    secondBody: NatalBody;
    type: NatalAspectType;
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

function formatPlacement(sign: ZodiacSign, degreesInSign: number, locale: AstrologyLocale) {
  return `${degreesInSign.toFixed(1)}° ${getSignInterpretation(sign, locale).label}`;
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
  const [activeSection, setActiveSection] = useState<"overview" | "planets" | "houses" | "aspects">("overview");
  const [expandedBody, setExpandedBody] = useState<AstrologySelection | null>("Moon");
  const [expandedHouse, setExpandedHouse] = useState<number | null>(1);
  const [expandedAspect, setExpandedAspect] = useState<string | null>(null);

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
        window.location.assign(buildLoginPath("/astrologia/mapa"));
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

  const astrologyLocale: AstrologyLocale = isEnglish ? "en" : "pt-BR";
  const ascendantLabel = getSignInterpretation(chart.ascendant.sign, astrologyLocale).label;
  const personalizedBodies = accessLevel === "full" ? fullBodies : coreBodies;
  const ascendantIndex = zodiacSigns.indexOf(chart.ascendant.sign);
  const expandedPlacement = expandedBody === "Ascendant"
    ? { sign: chart.ascendant.sign, degreesInSign: chart.ascendant.degreesInSign, house: 1 }
    : expandedBody && personalizedBodies.includes(expandedBody)
      ? positionMap.get(expandedBody)
      : undefined;

  return (
    <main className="min-h-screen bg-[#f7f0e5] text-[#241b18]">
      <section className="relative overflow-hidden bg-[#1f172a] px-4 pb-16 pt-8 text-[#fff7e8] sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#7049a5]/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-56 left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#f4d58d]/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/astrologia" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d9c49f] hover:text-white">
              <ChevronLeft size={15} />
              {isEnglish ? "Astrology" : "Astrologia"}
            </Link>
            <Link href="/meu-universo" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a99c98] transition hover:text-white">
              {isEnglish ? "My Universe" : "Meu Universo"}
            </Link>
          </div>
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
          <CoreCard body="Sun" icon={<Sun size={20} />} eyebrow={isEnglish ? "Sun sign" : "Signo solar"} title={getBodyInterpretation("Sun", astrologyLocale).label} placement={positionMap.get("Sun")} locale={astrologyLocale} expanded={expandedBody === "Sun"} onSelect={() => setExpandedBody("Sun")} />
          <CoreCard body="Moon" icon={<MoonStar size={20} />} eyebrow={isEnglish ? "Moon sign" : "Signo lunar"} title={getBodyInterpretation("Moon", astrologyLocale).label} placement={positionMap.get("Moon")} locale={astrologyLocale} expanded={expandedBody === "Moon"} onSelect={() => setExpandedBody("Moon")} />
          <CoreCard body="Ascendant" icon={<Sparkles size={20} />} eyebrow={isEnglish ? "Rising sign" : "Ascendente"} title={ascendantLabel} placement={{ sign: chart.ascendant.sign, degreesInSign: chart.ascendant.degreesInSign, house: 1 }} locale={astrologyLocale} expanded={expandedBody === "Ascendant"} onSelect={() => setExpandedBody("Ascendant")} />
        </div>

        {expandedBody && expandedPlacement ? <PlacementDetail body={expandedBody} position={expandedPlacement} locale={astrologyLocale} /> : null}

        <section className="relative mt-12 overflow-hidden rounded-[32px] bg-[#241b18] p-6 text-[#fff7e8] shadow-[0_30px_80px_rgba(36,27,24,0.16)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#7049a5]/35 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]"><BookOpen size={15} /> {isEnglish ? "How to read a placement" : "Como ler um posicionamento"}</p>
              <h2 className="brand-serif mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">{isEnglish ? "Planet, sign, house: three pieces of the same sentence." : "Planeta, signo, casa: três partes da mesma frase."}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d8ccc0]">{isEnglish ? "A planet tells us what part of life is speaking. The sign shows how it speaks. The house points to where you meet that theme in your lived experience. None of them works alone." : "O planeta mostra qual parte da vida está falando. O signo mostra como ela fala. A casa aponta onde você encontra esse tema na experiência vivida. Nenhuma dessas partes funciona sozinha."}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <ReadingKey icon={<Orbit size={17} />} title={isEnglish ? "What" : "O quê"} text={isEnglish ? "The planet" : "O planeta"} />
                <ReadingKey icon={<Sparkles size={17} />} title={isEnglish ? "How" : "Como"} text={isEnglish ? "The sign" : "O signo"} />
                <ReadingKey icon={<Compass size={17} />} title={isEnglish ? "Where" : "Onde"} text={isEnglish ? "The house" : "A casa"} />
              </div>
            </div>
            <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
              <Image src={PDU_ASSETS.astrology.orbitalMap} alt="" fill sizes="18rem" className="object-contain opacity-90 drop-shadow-[0_0_42px_rgba(244,213,141,0.28)]" />
              <div className="absolute inset-[22%] rounded-full border border-[#f4d58d]/45" aria-hidden="true" />
            </div>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "Read your sky in layers" : "Leia o seu céu por camadas"}</p>
            <h2 className="brand-serif mt-3 text-4xl font-semibold sm:text-5xl">{accessLevel === "full" ? (isEnglish ? "The whole sky, in conversation." : "O céu inteiro em conversa.") : (isEnglish ? "Start with meaning, then go deeper." : "Comece pelo significado, depois aprofunde.")}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f615a]">{isEnglish ? "Tap any layer. The basic language stays open to you; personalized placements reveal how the symbol lives in your own chart." : "Abra qualquer camada. A linguagem básica continua disponível para você; os posicionamentos personalizados revelam como o símbolo vive no seu próprio mapa."}</p>
          </div>
          <span className="rounded-full border border-[#caa96c]/50 bg-[#fffaf2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">{accessLevel === "full" ? (isEnglish ? "Complete map" : "Mapa completo") : (isEnglish ? "Free first layer" : "Primeira camada gratuita")}</span>
        </div>

        <nav className="mt-8 grid gap-2 rounded-[24px] border border-[#d8c3a6] bg-[#fffaf2] p-2 sm:grid-cols-4" aria-label={isEnglish ? "Map layers" : "Camadas do mapa"} role="tablist">
          {[
            { id: "overview" as const, icon: <Layers3 size={16} />, label: isEnglish ? "Overview" : "Visão geral" },
            { id: "planets" as const, icon: <Orbit size={16} />, label: isEnglish ? "Planets" : "Planetas" },
            { id: "houses" as const, icon: <Compass size={16} />, label: isEnglish ? "Houses" : "Casas" },
            { id: "aspects" as const, icon: <CircleHelp size={16} />, label: isEnglish ? "Aspects" : "Aspectos" },
          ].map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeSection === tab.id} onClick={() => setActiveSection(tab.id)} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeSection === tab.id ? "bg-[#241b18] text-[#fff7e8] shadow-[0_12px_24px_rgba(36,27,24,0.14)]" : "text-[#6f615a] hover:bg-[#f4eadc]"}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {activeSection === "overview" ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "Your first layer" : "A sua primeira camada"}</p>
              <h3 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "The Big Three are a beginning, not a summary." : "Os três pilares são um começo, não um resumo."}</h3>
              <p className="mt-4 text-sm leading-7 text-[#6f615a]">{isEnglish ? "Sun, Moon, and rising sign answer three different questions: who you are becoming, what you need to feel at home, and how you meet the world. Tap the cards above to read each one in your own chart." : "Sol, Lua e Ascendente respondem a três perguntas diferentes: quem você está se tornando, do que precisa para se sentir em casa e como encontra o mundo. Toque nos cards acima para ler cada um dentro do seu mapa."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniLesson title={isEnglish ? "Sun" : "Sol"} text={isEnglish ? "identity and direction" : "identidade e direção"} />
                <MiniLesson title={isEnglish ? "Moon" : "Lua"} text={isEnglish ? "care and belonging" : "cuidado e pertencimento"} />
                <MiniLesson title={isEnglish ? "Rising" : "Ascendente"} text={isEnglish ? "presence and entry" : "presença e entrada"} />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[30px] bg-[#e8dccb] p-6 sm:p-8">
              <Image src={PDU_ASSETS.astrology.myMap} alt="" fill sizes="(max-width: 1024px) 100vw, 30rem" className="object-cover opacity-35" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5134]">{isEnglish ? "A personal map is a conversation" : "Um mapa pessoal é uma conversa"}</p>
                <h3 className="brand-serif mt-3 text-3xl font-semibold text-[#241b18]">{isEnglish ? "There is no isolated placement." : "Não existe posicionamento isolado."}</h3>
                <p className="mt-4 text-sm leading-7 text-[#4f4035]">{isEnglish ? "Your Moon in Taurus is not the same sentence as another person’s Moon in Taurus. The house, aspects, life context, and your own history change the way the symbol becomes yours." : "A sua Lua em Touro não é a mesma frase que a Lua em Touro de outra pessoa. A casa, os aspectos, o contexto de vida e a sua própria história mudam a maneira como o símbolo se torna seu."}</p>
                <button type="button" onClick={() => setActiveSection("planets")} className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#8a6b3f]/40 bg-[#fffaf2]/75 px-4 py-2.5 text-sm font-semibold text-[#6f5134] transition hover:bg-[#fffaf2]">{isEnglish ? "Explore all planets" : "Explorar todos os planetas"} <ArrowRight size={16} /></button>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "planets" ? (
          <PlanetLibrary chart={chart} positionMap={positionMap} personalizedBodies={personalizedBodies} locale={astrologyLocale} expandedBody={expandedBody} onSelect={setExpandedBody} />
        ) : null}

        {activeSection === "houses" ? (
          <HouseLibrary ascendantIndex={ascendantIndex} accessLevel={accessLevel} locale={astrologyLocale} expandedHouse={expandedHouse} onSelect={setExpandedHouse} />
        ) : null}

        {activeSection === "aspects" ? (
          <AspectLibrary chart={chart} accessLevel={accessLevel} locale={astrologyLocale} expandedAspect={expandedAspect} onSelect={setExpandedAspect} />
        ) : null}

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

        {checkoutError ? <p className="mt-5 text-center text-sm text-[#9a3c37]" role="alert">{checkoutError}</p> : null}
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-6 text-[#8a7667]">{isEnglish ? "Astrology is offered as a symbolic language for reflection and entertainment. It does not determine events, replace professional care, or remove your freedom of choice." : "A astrologia é oferecida como linguagem simbólica para reflexão e entretenimento. Ela não determina acontecimentos, substitui cuidados profissionais nem retira sua liberdade de escolha."}</p>
      </section>
    </main>
  );
}

function bodyLabel(body: NatalBody, locale: AstrologyLocale) {
  return getBodyInterpretation(body, locale).label;
}

function aspectWord(type: NatalAspectType, locale: AstrologyLocale) {
  return getAspectInterpretation(type, locale).label;
}

function CoreCard({
  body,
  icon,
  eyebrow,
  title,
  placement,
  locale,
  expanded,
  onSelect,
}: {
  body: AstrologySelection;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  placement?: { sign: ZodiacSign; degreesInSign: number; house: number };
  locale: AstrologyLocale;
  expanded: boolean;
  onSelect: () => void;
}) {
  const copy = body === "Ascendant" ? getAscendantInterpretation(locale) : getBodyInterpretation(body, locale);
  return (
    <button type="button" onClick={onSelect} aria-expanded={expanded} className={`group relative overflow-hidden rounded-[26px] border p-6 text-left shadow-[0_18px_50px_rgba(80,57,34,0.07)] transition hover:-translate-y-1 ${expanded ? "border-[#8a6b3f] bg-[#fffaf2] ring-2 ring-[#f4d58d]/35" : "border-[#d8c3a6] bg-[#fffaf2]"}`}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f4d58d]/15 blur-2xl transition group-hover:scale-125" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#caa96c]/50 text-[#8a6b3f]">{icon}</span><span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a7b4b]">{eyebrow}</span></div>
      <h3 className="brand-serif relative mt-6 text-3xl font-semibold">{title}</h3>
      {placement ? <p className="relative mt-2 text-sm text-[#6f615a]">{formatPlacement(placement.sign, placement.degreesInSign, locale)} · {locale === "en" ? `house ${placement.house}` : `casa ${placement.house}`}</p> : null}
      <p className="relative mt-5 border-t border-[#e6d8c3] pt-4 text-sm leading-6 text-[#6f615a]">{copy.archetype}</p>
      <span className="relative mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">{expanded ? (locale === "en" ? "Reading open" : "Leitura aberta") : (locale === "en" ? "Open explanation" : "Abrir explicação")} <ChevronDown size={15} className={`transition ${expanded ? "rotate-180" : ""}`} /></span>
    </button>
  );
}

function PlacementDetail({ body, position, locale }: { body: AstrologySelection; position: { sign: ZodiacSign; degreesInSign: number; house: number }; locale: AstrologyLocale }) {
  const copy = body === "Ascendant" ? getAscendantInterpretation(locale) : getBodyInterpretation(body, locale);
  const sign = getSignInterpretation(position.sign, locale);
  return (
    <section className="mt-5 overflow-hidden rounded-[30px] border border-[#caa96c]/55 bg-[#fffaf2] shadow-[0_20px_55px_rgba(80,57,34,0.1)]" aria-live="polite">
      <div className="grid gap-0 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="relative min-h-[15rem] overflow-hidden bg-[#241b18] p-6 text-[#fff7e8] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(244,213,141,0.22),transparent_34%),linear-gradient(145deg,#241b18,#171225)]" />
          <Image src={body === "Moon" ? PDU_ASSETS.astrology.moonPortal : body === "Ascendant" ? PDU_ASSETS.astrology.myMap : PDU_ASSETS.astrology.mySky} alt="" fill sizes="(max-width: 1024px) 100vw, 28rem" className="object-contain opacity-70" />
          <div className="relative z-10 flex min-h-[13rem] flex-col justify-end">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]">{copy.label}</p>
            <p className="brand-serif mt-2 text-3xl font-semibold">{formatPlacement(position.sign, position.degreesInSign, locale)}</p>
            <p className="mt-2 text-sm text-[#d8ccc0]">{locale === "en" ? `House ${position.house}` : `Casa ${position.house}`} · {sign.element} · {sign.mode}</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{locale === "en" ? "What this means" : "O que isso significa"}</p>
          <h3 className="brand-serif mt-3 text-3xl font-semibold">{copy.label} {locale === "en" ? "in" : "em"} {sign.label}</h3>
          <p className="mt-4 text-base leading-8 text-[#4f4035]">{copy.explanation}</p>
          <p className="mt-4 text-sm leading-7 text-[#6f615a]">{locale === "en" ? "Through this sign:" : "Através deste signo:"} {sign.tone}. {sign.gifts}.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InsightBlock title={locale === "en" ? "In your life" : "Na sua vida"} text={`${copy.inLife} ${locale === "en" ? "This placement is also in" : "Este posicionamento também está na"} ${getHouseInterpretation(position.house, locale).area}.`} />
            <InsightBlock title={locale === "en" ? "A gentle attention" : "Uma atenção gentil"} text={sign.tension + "."} />
          </div>
          <div className="mt-6 rounded-2xl border border-[#d8c3a6] bg-[#f8efe2] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">{locale === "en" ? "A question to carry" : "Uma pergunta para levar"}</p>
            <p className="mt-2 text-sm leading-7 text-[#4f4035]">{copy.question}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReadingKey({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-[#f4d58d]/15 bg-white/[0.06] p-3"><span className="text-[#f5d896]">{icon}</span><p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d896]">{title}</p><p className="mt-1 text-sm text-[#d8ccc0]">{text}</p></div>;
}

function MiniLesson({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-[#e6d8c3] bg-white/60 p-4"><p className="font-semibold text-[#332720]">{title}</p><p className="mt-1 text-xs leading-5 text-[#8a7667]">{text}</p></div>;
}

function InsightBlock({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-[#e6d8c3] bg-white/60 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{title}</p><p className="mt-2 text-sm leading-6 text-[#6f615a]">{text}</p></div>;
}

function PlanetLibrary({ chart, positionMap, personalizedBodies, locale, expandedBody, onSelect }: { chart: Chart; positionMap: Map<NatalBody, Position>; personalizedBodies: NatalBody[]; locale: AstrologyLocale; expandedBody: AstrologySelection | null; onSelect: (body: NatalBody) => void }) {
  const isEnglish = locale === "en";
  return (
    <section className="mt-6 rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8" role="tabpanel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "The ten voices" : "As dez vozes"}</p><h3 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "What each planet is teaching you." : "O que cada planeta está ensinando."}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f615a]">{isEnglish ? "Every planet has an open meaning. If you have the full map, its sign, house, and personalized reading appear here too." : "Todo planeta tem um significado aberto. Se você tem o mapa completo, o signo, a casa e a leitura personalizada aparecem aqui também."}</p></div>
        <Orbit className="text-[#caa96c]" size={28} aria-hidden="true" />
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {fullBodies.map((body) => {
          const position = positionMap.get(body);
          const personalized = personalizedBodies.includes(body) && position;
          const copy = getBodyInterpretation(body, locale);
          const expanded = expandedBody === body;
          return <button key={body} type="button" onClick={() => onSelect(body)} aria-expanded={expanded} className={`text-left rounded-[24px] border p-5 transition hover:-translate-y-0.5 ${expanded ? "border-[#8a6b3f] bg-[#f8efe2]" : "border-[#e6d8c3] bg-white/65 hover:border-[#caa96c]"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a7b4b]">{copy.label}</p><h4 className="brand-serif mt-2 text-2xl font-semibold">{copy.archetype}</h4></div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#caa96c]/45 text-[#8a6b3f]">{personalized ? <Check size={16} /> : <LockKeyhole size={15} />}</span></div><p className="mt-4 text-sm leading-6 text-[#6f615a]">{copy.explanation}</p>{personalized && position ? <p className="mt-4 border-t border-[#e6d8c3] pt-4 text-sm font-semibold text-[#6f5134]">{formatPlacement(position.sign, position.degreesInSign, locale)} · {isEnglish ? `house ${position.house}` : `casa ${position.house}`}</p> : <p className="mt-4 border-t border-[#e6d8c3] pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">{isEnglish ? "Personal placement · available in full map" : "Posicionamento pessoal · disponível no mapa completo"}</p>}{expanded ? <div className="mt-4 rounded-2xl bg-[#fffaf2] p-4"><p className="text-sm leading-7 text-[#6f615a]">{copy.inLife}</p><p className="mt-3 text-sm font-medium leading-6 text-[#6f5134]">{copy.question}</p></div> : null}</button>;
        })}
      </div>
      {chart.positions.length < fullBodies.length ? <p className="mt-5 text-xs text-[#8a7667]">{isEnglish ? "Some astronomical objects may be unavailable for this calculation date." : "Alguns corpos astronômicos podem não estar disponíveis para esta data de cálculo."}</p> : null}
    </section>
  );
}

function HouseLibrary({ ascendantIndex, accessLevel, locale, expandedHouse, onSelect }: { ascendantIndex: number; accessLevel: "preview" | "full"; locale: AstrologyLocale; expandedHouse: number | null; onSelect: (house: number) => void }) {
  const isEnglish = locale === "en";
  return <section className="mt-6 rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8" role="tabpanel"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "The twelve rooms" : "As doze casas"}</p><h3 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "Where the sky becomes personal." : "Onde o céu se torna pessoal."}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f615a]">{isEnglish ? "Houses are areas of life, not personality labels. They show where a planet's story becomes concrete." : "Casas são áreas da vida, não rótulos de personalidade. Elas mostram onde a história de um planeta se torna concreta."}</p></div><div className="rounded-full border border-[#caa96c]/45 px-3 py-2 text-xs font-semibold text-[#8a6b3f]">{isEnglish ? "Whole-sign houses" : "Casas por signo inteiro"}</div></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 12 }, (_, index) => index + 1).map((house) => { const sign = zodiacSigns[(ascendantIndex + house - 1) % 12]; const copy = getHouseInterpretation(house, locale); const expanded = expandedHouse === house; return <button type="button" key={house} onClick={() => onSelect(house)} aria-expanded={expanded} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${expanded ? "border-[#8a6b3f] bg-[#f8efe2]" : "border-[#e6d8c3] bg-white/65 hover:border-[#caa96c]"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#9a7b4b]">{copy.label}</p><h4 className="mt-2 font-semibold text-[#332720]">{copy.area}</h4></div><ChevronDown size={16} className={`mt-1 text-[#8a6b3f] transition ${expanded ? "rotate-180" : ""}`} /></div><p className="mt-3 text-sm leading-6 text-[#6f615a]">{copy.explanation}</p><p className="mt-3 border-t border-[#e6d8c3] pt-3 text-xs font-semibold text-[#8a6b3f]">{accessLevel === "full" ? `${isEnglish ? "Your rising sign places" : "O seu ascendente coloca"} ${getSignInterpretation(sign, locale).label} ${isEnglish ? "here." : "aqui."}` : (isEnglish ? "Your personalized house story unlocks with the full map." : "A sua história personalizada da casa é desbloqueada com o mapa completo.")}</p>{expanded ? <p className="mt-3 rounded-xl bg-[#fffaf2] p-3 text-sm font-medium leading-6 text-[#6f5134]">{copy.question}</p> : null}</button>; })}</div><div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e6d8c3] bg-[#f8efe2] p-4 text-sm leading-6 text-[#6f615a]"><InfoIcon /> <p>{isEnglish ? "A house does not mean that an event is guaranteed. It is a symbolic lens for noticing where a theme may ask for attention." : "Uma casa não significa que um acontecimento esteja garantido. É uma lente simbólica para perceber onde um tema pode pedir atenção."}</p></div></section>;
}

function AspectLibrary({ chart, accessLevel, locale, expandedAspect, onSelect }: { chart: Chart; accessLevel: "preview" | "full"; locale: AstrologyLocale; expandedAspect: string | null; onSelect: (aspect: string | null) => void }) {
  const isEnglish = locale === "en";
  const aspectTypes: NatalAspectType[] = ["conjunction", "sextile", "square", "trine", "opposition"];
  return <section className="mt-6 rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8" role="tabpanel"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{isEnglish ? "Conversations in the sky" : "Conversas no céu"}</p><h3 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "Aspects describe the relationship between symbols." : "Aspectos descrevem a relação entre os símbolos."}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f615a]">{isEnglish ? "They do not make a planet good or bad. They show whether two parts of your experience flow, friction, or ask for integration." : "Eles não tornam um planeta bom ou ruim. Mostram se duas partes da sua experiência fluem, criam atrito ou pedem integração."}</p></div><CircleHelp className="text-[#caa96c]" size={28} aria-hidden="true" /></div><div className="mt-7 grid gap-3 md:grid-cols-2">{aspectTypes.map((type) => { const copy = getAspectInterpretation(type, locale); const expanded = expandedAspect === type; return <button type="button" key={type} onClick={() => onSelect(expanded ? null : type)} aria-expanded={expanded} className={`rounded-2xl border p-4 text-left transition ${expanded ? "border-[#8a6b3f] bg-[#f8efe2]" : "border-[#e6d8c3] bg-white/65 hover:border-[#caa96c]"}`}><div className="flex items-center justify-between gap-3"><p className="font-semibold text-[#332720]">{copy.label}</p><ChevronDown size={16} className={`text-[#8a6b3f] transition ${expanded ? "rotate-180" : ""}`} /></div><p className="mt-3 text-sm leading-6 text-[#6f615a]">{copy.explanation}</p>{expanded ? <div className="mt-3 rounded-xl bg-[#fffaf2] p-3"><p className="text-sm leading-6 text-[#6f615a]">{copy.experience}</p><p className="mt-2 text-sm font-medium leading-6 text-[#6f5134]">{copy.question}</p></div> : null}</button>; })}</div><div className="mt-6 rounded-[24px] bg-[#241b18] p-5 text-[#fff7e8] sm:p-6"><div className="flex items-start gap-3"><LockKeyhole className="mt-1 shrink-0 text-[#f5d896]" size={18} /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">{isEnglish ? "Your personal conversations" : "As suas conversas pessoais"}</p><p className="mt-2 text-sm leading-7 text-[#d8ccc0]">{accessLevel === "full" ? (chart.aspects.length ? (isEnglish ? "These are the active relationships we found in your chart:" : "Estas são as relações ativas que encontramos no seu mapa:") : (isEnglish ? "No close aspects were found in this calculation." : "Não encontramos aspectos próximos neste cálculo.")) : (isEnglish ? "The meaning of each aspect is open now. The planets that are speaking to each other in your own map become available with the complete map." : "O significado de cada aspecto está aberto agora. Os planetas que conversam no seu próprio mapa ficam disponíveis com o mapa completo.")}</p>{accessLevel === "full" && chart.aspects.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{chart.aspects.slice(0, 10).map((aspect) => <div key={`${aspect.firstBody}-${aspect.type}-${aspect.secondBody}`} className="rounded-xl border border-[#f4d58d]/20 bg-white/[0.06] p-3"><p className="text-sm font-semibold">{bodyLabel(aspect.firstBody, locale)} · {aspectWord(aspect.type, locale)} · {bodyLabel(aspect.secondBody, locale)}</p><p className="mt-1 text-xs text-[#bfb5ad]">{isEnglish ? `orb ${aspect.orb.toFixed(1)}°` : `orbe de ${aspect.orb.toFixed(1)}°`}</p></div>)}</div> : null}</div></div></div></section>;
}

function InfoIcon() {
  return <CircleHelp className="mt-0.5 shrink-0 text-[#8a6b3f]" size={17} aria-hidden="true" />;
}
