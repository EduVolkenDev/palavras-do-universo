"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Lock,
  LockKeyhole,
  LoaderCircle,
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
  type NatalBody,
  type NatalChart,
  type NatalPosition,
  type ZodiacSign,
} from "@/lib/astrology/natal-chart";
import {
  getAspectInterpretation,
  getAscendantInterpretation,
  getBodyInterpretation,
  getHouseInterpretation,
  getSignInterpretation,
  type AstrologyLocale,
} from "@/lib/astrology/interpretations";
import {
  getBodyAspectReadings,
  getDegreeInterpretation,
  getPlacementInterpretation,
} from "@/lib/astrology/placement-interpretation";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { normalizeMarketingAttribution } from "@/lib/marketing/attribution";
import { recordSiteEvent } from "@/lib/client/siteEvents";
import styles from "./AstrologyChartExperience.module.css";

type AstrologySelection = NatalBody | "Ascendant";

type Chart = Pick<NatalChart, "locationLabel" | "timePrecision" | "houseSystem" | "ascendant" | "positions" | "aspects">;
type ChartLoadFailure = "birth-data-required" | "session-expired" | "unavailable";

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
  const [loadFailure, setLoadFailure] = useState<ChartLoadFailure | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [checkoutNoticeTone, setCheckoutNoticeTone] = useState<"info" | "success" | "warning">("info");
  const [checkoutRecoveryPending, setCheckoutRecoveryPending] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "planets" | "houses" | "aspects">("overview");
  const [expandedBody, setExpandedBody] = useState<AstrologySelection | null>("Moon");
  const [expandedHouse, setExpandedHouse] = useState<number | null>(1);
  const [expandedAspect, setExpandedAspect] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function openMap() {
      const params = new URLSearchParams(window.location.search);
      const checkoutState = params.get("checkout");
      const checkoutSessionId = params.get("session_id");

      if (checkoutState === "success") {
        setCheckoutRecoveryPending(true);
        if (checkoutSessionId) {
          setCheckoutNoticeTone("info");
          setCheckoutNotice(isEnglish ? "Confirming your payment and opening the complete map…" : "Confirmando seu pagamento e abrindo o mapa completo…");
          try {
            const confirmResponse = await fetch("/api/checkout/confirm", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: checkoutSessionId }),
              signal: controller.signal,
            });
            if (!confirmResponse.ok) throw new Error("checkout-confirmation-failed");
            recordSiteEvent({ eventType: "commerce.checkout_confirmed", productKey: params.get("product") ?? ASTROLOGY_FULL_PRODUCT_KEY, context: { surface: "astrology_map" } });
            setCheckoutRecoveryPending(false);
            setCheckoutNoticeTone("success");
            setCheckoutNotice(isEnglish ? "Payment confirmed. Your complete map is ready." : "Pagamento confirmado. Seu mapa completo está liberado.");
          } catch (caught) {
            if (!(caught instanceof DOMException && caught.name === "AbortError")) {
              setCheckoutNoticeTone("warning");
              setCheckoutNotice(isEnglish ? "Your payment returned successfully, but access is still being synchronized. Refresh in a moment; you will not be charged again." : "Seu pagamento voltou com sucesso, mas o acesso ainda está sendo sincronizado. Atualize em instantes; você não será cobrado novamente.");
            }
          }
        } else {
          setCheckoutNoticeTone("warning");
          setCheckoutNotice(isEnglish ? "We could not identify the payment session. Your map remains saved; contact support if access does not appear." : "Não foi possível identificar a sessão do pagamento. Seu mapa continua salvo; fale com o suporte se o acesso não aparecer.");
        }
      } else if (checkoutState === "cancelled") {
        setCheckoutRecoveryPending(false);
        setCheckoutNoticeTone("warning");
        setCheckoutNotice(isEnglish ? "Payment was not completed. Your map is still saved and you can continue whenever you want." : "O pagamento não foi concluído. Seu mapa continua salvo e você pode retomar quando quiser.");
      }

      if (checkoutState) {
        params.delete("checkout");
        params.delete("session_id");
        const cleanUrl = `${window.location.pathname}${params.size ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", cleanUrl);
      }

      try {
        const response = await fetch("/api/astrology/natal", { credentials: "include", cache: "no-store", signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { chart?: Chart; access?: { level?: "preview" | "full" }; code?: string } | null;
        if (!response.ok || !payload?.chart) {
          if (response.status === 401) throw new Error("session-expired");
          if (response.status === 409 && payload?.code === "ASTROLOGY_BIRTH_DATA_REQUIRED") throw new Error("birth-data-required");
          throw new Error("unavailable");
        }
        if (!active) return;
        setChart(payload.chart);
        setAccessLevel(payload.access?.level === "full" ? "full" : "preview");
      } catch (caught) {
        if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
        setLoadFailure(caught instanceof Error && ["birth-data-required", "session-expired"].includes(caught.message) ? caught.message as ChartLoadFailure : "unavailable");
      } finally {
        if (active) setLoading(false);
      }
    }

    void openMap();
    return () => {
      active = false;
      controller.abort();
    };
  }, [isEnglish]);

  const positionMap = useMemo(
    () => new Map((chart?.positions ?? []).map((position) => [position.body, position])),
    [chart?.positions],
  );
  const fullPrice = formatProductPrice(ASTROLOGY_FULL_PRODUCT_KEY, currency);
  const circlePrice = formatProductPrice("circulo_do_universo", currency);

  async function startCheckout(productKey: string) {
    if (checkoutRecoveryPending) return;
    setCheckoutLoading(productKey);
    setCheckoutError("");
    recordSiteEvent({
      eventType: "marketing.cta_click",
      productKey,
      context: {
        campaign: "conteudo_astrologia_4_semanas",
        destination: "checkout",
        attribution: normalizeMarketingAttribution(new URLSearchParams(window.location.search)),
      },
    });
    try {
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          locale,
          currency,
          attribution: normalizeMarketingAttribution(new URLSearchParams(window.location.search)),
          returnTo: `${window.location.pathname}${window.location.search}`,
        }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (response.status === 401) {
        window.location.assign(buildLoginPath(`${window.location.pathname}${window.location.search}`));
        return;
      }
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(isEnglish ? "We could not open secure checkout. Please try again in a moment." : "Não foi possível abrir o checkout seguro. Tente novamente em instantes.");
      }
      window.location.assign(payload.checkoutUrl);
    } catch (caught) {
      setCheckoutError(caught instanceof Error ? caught.message : (isEnglish ? "Checkout is temporarily unavailable." : "O checkout está temporariamente indisponível."));
    } finally {
      setCheckoutLoading("");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center text-[#6f615a]">
        <LoaderCircle className="animate-spin text-[#8a6b3f]" size={26} />
        <p className="mt-4 text-base font-semibold text-[#4f4035]">{checkoutNotice || (isEnglish ? "Opening your map…" : "Abrindo o seu mapa…")}</p>
        <p className="mt-2 text-sm">{isEnglish ? "Keep this page open while we prepare your experience." : "Mantenha esta página aberta enquanto preparamos sua experiência."}</p>
      </div>
    );
  }

  if (loadFailure || !chart) {
    const needsBirthData = loadFailure === "birth-data-required";
    const sessionExpired = loadFailure === "session-expired";
    const title = needsBirthData
      ? (isEnglish ? "Your map needs your birth context first." : "Seu mapa precisa do seu contexto de nascimento primeiro.")
      : sessionExpired
        ? (isEnglish ? "Your session has ended." : "Sua sessão terminou.")
        : (isEnglish ? "Your map could not be opened right now." : "Não foi possível abrir o seu mapa agora.");
    const action = needsBirthData
      ? { href: "/astrologia/mapa", label: isEnglish ? "Prepare my birth context" : "Preparar meu contexto de nascimento" }
      : sessionExpired
        ? { href: buildLoginPath("/astrologia/mapa"), label: isEnglish ? "Sign in again" : "Entrar novamente" }
        : { href: "/meu-universo#preparar-meu-mapa", label: isEnglish ? "Review my birth context" : "Revisar meu contexto de nascimento" };
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-sm text-[#8a6b3f]">{title}</p>
        <Link href={action.href} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8]">
          {action.label}
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const astrologyLocale: AstrologyLocale = isEnglish ? "en" : "pt-BR";
  const ascendant = chart.ascendant;
  const hasBirthTime = chart.timePrecision !== "unknown" && ascendant !== null;
  const ascendantLabel = ascendant ? getSignInterpretation(ascendant.sign, astrologyLocale).label : "";
  const personalizedBodies = accessLevel === "full" ? fullBodies : coreBodies;
  const ascendantIndex = ascendant ? zodiacSigns.indexOf(ascendant.sign) : -1;
  const expandedPlacement = expandedBody === "Ascendant" && ascendant
    ? { sign: ascendant.sign, degreesInSign: ascendant.degreesInSign, house: 1 }
    : expandedBody && expandedBody !== "Ascendant" && personalizedBodies.includes(expandedBody)
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
              <p className="mt-3 text-xs leading-5 text-[#bfb5ad]">{hasBirthTime ? (isEnglish ? "Calculated from your local birth time and the historical time rule for that date." : "Calculado a partir da sua hora local de nascimento e da regra histórica daquele dia.") : (isEnglish ? "Birth time was not provided. Rising sign and houses stay hidden until you add it; no time was guessed." : "O horário de nascimento não foi informado. Ascendente e casas ficam ocultos até você adicioná-lo; nenhuma hora foi inventada.")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {checkoutNotice ? (
          <div className={`mb-8 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${checkoutNoticeTone === "success" ? "border-[#a9cdbf] bg-[#eef8f2] text-[#315d56]" : checkoutNoticeTone === "warning" ? "border-[#d8b877] bg-[#fff7df] text-[#6f5134]" : "border-[#c9b6df] bg-[#f4eefb] text-[#4f3d66]"}`} role="status">
            {checkoutNoticeTone === "success" ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : checkoutNoticeTone === "info" ? <LoaderCircle className="mt-0.5 shrink-0 animate-spin" size={18} /> : <CircleHelp className="mt-0.5 shrink-0" size={18} />}
            <p>{checkoutNotice}</p>
          </div>
        ) : null}

        <div className={`grid gap-5 ${hasBirthTime ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          <CoreCard body="Sun" icon={<Sun size={20} />} eyebrow={isEnglish ? "Sun sign" : "Signo solar"} title={getBodyInterpretation("Sun", astrologyLocale).label} placement={positionMap.get("Sun")} locale={astrologyLocale} expanded={expandedBody === "Sun"} onSelect={() => setExpandedBody("Sun")} />
          <CoreCard body="Moon" icon={<MoonStar size={20} />} eyebrow={isEnglish ? "Moon sign" : "Signo lunar"} title={getBodyInterpretation("Moon", astrologyLocale).label} placement={positionMap.get("Moon")} locale={astrologyLocale} expanded={expandedBody === "Moon"} onSelect={() => setExpandedBody("Moon")} />
          {hasBirthTime && ascendant ? (
            <CoreCard body="Ascendant" icon={<Sparkles size={20} />} eyebrow={isEnglish ? "Rising sign" : "Ascendente"} title={ascendantLabel} placement={{ sign: ascendant.sign, degreesInSign: ascendant.degreesInSign, house: 1 }} locale={astrologyLocale} expanded={expandedBody === "Ascendant"} onSelect={() => setExpandedBody("Ascendant")} />
          ) : (
            <Link href="/meu-universo#preparar-meu-mapa" className="rounded-[26px] border border-dashed border-[#caa96c] bg-[#fffaf2] p-6 text-left shadow-[0_18px_50px_rgba(80,57,34,0.05)] transition hover:-translate-y-1 hover:border-[#8a6b3f]">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-[#caa96c]/60 bg-[#f8efe2] text-[#8a6b3f]"><Clock3 size={19} /></span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">{isEnglish ? "When you know the time" : "Quando souber o horário"}</p>
              <h3 className="brand-serif mt-2 text-3xl font-semibold">{isEnglish ? "Add rising sign and houses" : "Adicionar Ascendente e casas"}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6f615a]">{isEnglish ? "Your current reading remains available. Add or correct the birth time later to complete these layers responsibly." : "Sua leitura atual continua disponível. Adicione ou corrija o horário depois para completar essas camadas com responsabilidade."}</p>
            </Link>
          )}
        </div>

        {accessLevel !== "full" ? (
          <AstrologyOfferCard isEnglish={isEnglish} fullPrice={fullPrice} circlePrice={circlePrice} checkoutLoading={checkoutLoading} checkoutDisabled={checkoutRecoveryPending} onCheckout={startCheckout} compact />
        ) : null}
        {checkoutError ? <p className="mt-4 rounded-2xl border border-[#d9aaa8] bg-[#fff1f0] p-4 text-center text-sm text-[#7b3330]" role="alert">{checkoutError}</p> : null}

        {expandedBody && expandedPlacement ? <PlacementDetail body={expandedBody} position={expandedPlacement} aspects={chart.aspects} locale={astrologyLocale} /> : null}

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
          ].filter((tab) => hasBirthTime || tab.id !== "houses").map((tab) => (
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
              <h3 className="brand-serif mt-3 text-3xl font-semibold">{hasBirthTime ? (isEnglish ? "The Big Three are a beginning, not a summary." : "Os três pilares são um começo, não um resumo.") : (isEnglish ? "Two pillars are already open." : "Dois pilares já estão abertos.")}</h3>
              <p className="mt-4 text-sm leading-7 text-[#6f615a]">{hasBirthTime ? (isEnglish ? "Sun, Moon, and rising sign answer three different questions: who you are becoming, what you need to feel at home, and how you meet the world. Tap the cards above to read each one in your own chart." : "Sol, Lua e Ascendente respondem a três perguntas diferentes: quem você está se tornando, do que precisa para se sentir em casa e como encontra o mundo. Toque nos cards acima para ler cada um dentro do seu mapa.") : (isEnglish ? "Your Sun and Moon are already open. Rising sign and houses depend on birth time, so those layers remain hidden instead of being guessed." : "Seu Sol e sua Lua já estão abertos. Ascendente e casas dependem do horário de nascimento, por isso essas camadas ficam ocultas em vez de serem inventadas.")}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniLesson title={isEnglish ? "Sun" : "Sol"} text={isEnglish ? "identity and direction" : "identidade e direção"} artwork={PDU_ASSETS.astrology.planets.Sun} />
                <MiniLesson title={isEnglish ? "Moon" : "Lua"} text={isEnglish ? "care and belonging" : "cuidado e pertencimento"} artwork={PDU_ASSETS.astrology.planets.Moon} />
                <MiniLesson title={isEnglish ? "Rising" : "Ascendente"} text={hasBirthTime ? (isEnglish ? "presence and entry" : "presença e entrada") : (isEnglish ? "available when you add the time" : "disponível ao adicionar o horário")} artwork={PDU_ASSETS.astrology.mapHero} />
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

        {activeSection === "houses" && hasBirthTime ? (
          <HouseLibrary ascendantIndex={ascendantIndex} accessLevel={accessLevel} locale={astrologyLocale} expandedHouse={expandedHouse} onSelect={setExpandedHouse} />
        ) : null}

        {activeSection === "aspects" ? (
          <AspectLibrary chart={chart} accessLevel={accessLevel} locale={astrologyLocale} expandedAspect={expandedAspect} onSelect={setExpandedAspect} />
        ) : null}

        {accessLevel !== "full" ? <AstrologyOfferCard isEnglish={isEnglish} fullPrice={fullPrice} circlePrice={circlePrice} checkoutLoading={checkoutLoading} checkoutDisabled={checkoutRecoveryPending} onCheckout={startCheckout} /> : null}

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-6 text-[#8a7667]">{isEnglish ? "Astrology is offered as a symbolic language for reflection and entertainment. It does not determine events, replace professional care, or remove your freedom of choice." : "A astrologia é oferecida como linguagem simbólica para reflexão e entretenimento. Ela não determina acontecimentos, substitui cuidados profissionais nem retira sua liberdade de escolha."}</p>
      </section>
    </main>
  );
}

function AstrologyOfferCard({
  isEnglish,
  fullPrice,
  circlePrice,
  checkoutLoading,
  checkoutDisabled,
  onCheckout,
  compact = false,
}: {
  isEnglish: boolean;
  fullPrice: string;
  circlePrice: string;
  checkoutLoading: string;
  checkoutDisabled: boolean;
  onCheckout: (productKey: string) => Promise<void>;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "mt-6" : "mt-8"} grid gap-6 overflow-hidden rounded-[30px] border border-[#caa96c]/40 bg-[#241b18] p-6 text-[#fff7e8] shadow-[0_30px_80px_rgba(36,27,24,0.18)] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center`}>
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]"><Lock size={14} /> {isEnglish ? "Continue your map" : "Continue o seu mapa"}</p>
        <h3 className="brand-serif mt-3 text-3xl font-semibold">{isEnglish ? "Open every available planet, aspect, and personal layer." : "Abra todos os planetas, aspectos e camadas pessoais disponíveis."}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d8ccc0]">{isEnglish ? `Unlock the complete interpretation for ${fullPrice} as a one-time payment, or access it as part of the Circle for ${circlePrice} per month.` : `Desbloqueie a interpretação completa por ${fullPrice}, em pagamento único, ou tenha acesso a ela dentro do Círculo por ${circlePrice} ao mês.`}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
        <button type="button" onClick={() => void onCheckout(ASTROLOGY_FULL_PRODUCT_KEY)} disabled={checkoutDisabled || Boolean(checkoutLoading)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] hover:bg-[#ffe3a3] disabled:cursor-not-allowed disabled:opacity-60">{checkoutRecoveryPendingLabel(checkoutDisabled, checkoutLoading === ASTROLOGY_FULL_PRODUCT_KEY, isEnglish, isEnglish ? "Unlock my full map" : "Desbloquear meu mapa")} <ArrowRight size={16} /></button>
        <button type="button" onClick={() => void onCheckout("circulo_do_universo")} disabled={checkoutDisabled || Boolean(checkoutLoading)} className="inline-flex items-center justify-center rounded-full border border-[#f4d58d]/45 px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">{checkoutRecoveryPendingLabel(checkoutDisabled, checkoutLoading === "circulo_do_universo", isEnglish, isEnglish ? "Join the Circle" : "Entrar no Círculo")}</button>
      </div>
    </div>
  );
}

function checkoutRecoveryPendingLabel(disabled: boolean, loading: boolean, isEnglish: boolean, defaultLabel: string) {
  if (disabled) return isEnglish ? "Synchronizing access…" : "Sincronizando acesso…";
  if (loading) return isEnglish ? "Opening…" : "Abrindo…";
  return defaultLabel;
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
  placement?: { sign: ZodiacSign; degreesInSign: number; house: number | null };
  locale: AstrologyLocale;
  expanded: boolean;
  onSelect: () => void;
}) {
  const copy = body === "Ascendant" ? getAscendantInterpretation(locale) : getBodyInterpretation(body, locale);
  const artwork = body === "Ascendant" ? PDU_ASSETS.astrology.mapHero : PDU_ASSETS.astrology.planets[body];
  return (
    <button type="button" onClick={onSelect} aria-expanded={expanded} data-body={body} className={`${styles.coreCard} group relative overflow-hidden rounded-[26px] border p-6 text-left shadow-[0_18px_50px_rgba(80,57,34,0.07)] transition hover:-translate-y-1 ${expanded ? "border-[#8a6b3f] ring-2 ring-[#f4d58d]/35" : "border-[#d8c3a6]"}`}>
      <span className={styles.coreArtwork} aria-hidden="true"><Image src={artwork} alt="" fill sizes="(max-width: 767px) 11rem, 12rem" className="object-contain" /></span>
      <div className="relative flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#caa96c]/50 text-[#8a6b3f]">{icon}</span><span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a7b4b]">{eyebrow}</span></div>
      <div className={styles.coreHeading}>
        <h3 className="brand-serif text-3xl font-semibold">{title}</h3>
        {placement ? <p className="mt-2 text-sm text-[#6f615a]">{formatPlacement(placement.sign, placement.degreesInSign, locale)}{placement.house !== null ? ` · ${locale === "en" ? `house ${placement.house}` : `casa ${placement.house}`}` : ""}</p> : null}
      </div>
      <p className="relative mt-5 border-t border-[#e6d8c3] pt-4 text-sm leading-6 text-[#6f615a]">{copy.archetype}</p>
      <span className="relative mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">{expanded ? (locale === "en" ? "Reading open" : "Leitura aberta") : (locale === "en" ? "Open explanation" : "Abrir explicação")} <ChevronDown size={15} className={`transition ${expanded ? "rotate-180" : ""}`} /></span>
    </button>
  );
}

function PlacementDetail({ body, position, aspects, locale }: { body: AstrologySelection; position: { sign: ZodiacSign; degreesInSign: number; house: number | null }; aspects: Chart["aspects"]; locale: AstrologyLocale }) {
  const copy = body === "Ascendant" ? getAscendantInterpretation(locale) : getBodyInterpretation(body, locale);
  const sign = getSignInterpretation(position.sign, locale);
  const degree = getDegreeInterpretation(position.degreesInSign, locale);
  const placement = body === "Ascendant" || position.house === null ? null : getPlacementInterpretation({ body, ...position, house: position.house }, locale);
  const bodyAspects = body === "Ascendant" ? [] : getBodyAspectReadings(body, aspects, locale);
  return (
    <section className="mt-5 overflow-hidden rounded-[30px] border border-[#caa96c]/55 bg-[#fffaf2] shadow-[0_20px_55px_rgba(80,57,34,0.1)]" aria-live="polite">
      <div className="grid gap-0 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="relative min-h-[15rem] overflow-hidden bg-[#241b18] p-6 text-[#fff7e8] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(244,213,141,0.22),transparent_34%),linear-gradient(145deg,#241b18,#171225)]" />
          <Image src={body === "Ascendant" ? PDU_ASSETS.astrology.mapHero : PDU_ASSETS.astrology.planets[body]} alt="" fill sizes="(max-width: 1024px) 100vw, 28rem" className="object-contain opacity-60" />
          <div className="relative z-10 flex min-h-[13rem] flex-col justify-end">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]">{copy.label}</p>
            <p className="brand-serif mt-2 text-3xl font-semibold">{formatPlacement(position.sign, position.degreesInSign, locale)}</p>
            <p className="mt-2 text-sm text-[#d8ccc0]">{position.house !== null ? `${locale === "en" ? `House ${position.house}` : `Casa ${position.house}`} · ` : ""}{sign.element} · {sign.mode}</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{locale === "en" ? "What this means" : "O que isso significa"}</p>
          <h3 className="brand-serif mt-3 text-3xl font-semibold">{copy.label} {locale === "en" ? "in" : "em"} {sign.label}</h3>
          <p className="mt-4 text-base leading-8 text-[#4f4035]">{placement?.combination ?? copy.explanation}</p>
          <p className="mt-4 text-sm leading-7 text-[#6f615a]">{placement?.manifestation ?? `${locale === "en" ? "Through this sign:" : "Através deste signo:"} ${sign.tone}. ${sign.gifts}.`}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InsightBlock title={locale === "en" ? "Potential" : "Potenciais"} text={placement?.gifts ?? `${sign.gifts}.`} />
            <InsightBlock title={locale === "en" ? "A gentle attention" : "Ponto de atenção"} text={placement?.tension ?? `${sign.tension}.`} />
            {position.house !== null ? <InsightBlock title={placement?.houseTitle ?? `${locale === "en" ? "House" : "Casa"} ${position.house}`} text={placement?.houseMeaning ?? getHouseInterpretation(position.house, locale).explanation} /> : null}
            <InsightBlock title={`${locale === "en" ? "Degree" : "Grau"} · ${degree.title}`} text={`${degree.label}. ${degree.explanation} ${locale === "en" ? "The degree refines the reading; it does not replace the sign, house, or aspects." : "O grau refina a leitura; não substitui o signo, a casa nem os aspectos."}`} />
          </div>
          {placement ? <p className="mt-6 rounded-2xl border border-[#d8c3a6] bg-white/65 p-4 text-sm font-medium leading-7 text-[#4f4035]">{placement.synthesis}</p> : null}
          {body !== "Ascendant" ? <PersonalAspectList readings={bodyAspects} locale={locale} /> : null}
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

function MiniLesson({ title, text, artwork }: { title: string; text: string; artwork: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#e6d8c3] bg-white/70 p-4 sm:block">
      <span className={`${styles.pillarArtwork} relative block h-16 w-16 shrink-0 sm:mb-3 sm:h-24 sm:w-full`} aria-hidden="true">
        <Image src={artwork} alt="" fill sizes="(max-width: 639px) 4rem, 9rem" className="object-contain" />
      </span>
      <div>
        <p className="font-semibold text-[#332720]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#8a7667]">{text}</p>
      </div>
    </div>
  );
}

function InsightBlock({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-[#e6d8c3] bg-white/60 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{title}</p><p className="mt-2 text-sm leading-6 text-[#6f615a]">{text}</p></div>;
}

function PersonalAspectList({ readings, locale }: { readings: ReturnType<typeof getBodyAspectReadings>; locale: AstrologyLocale }) {
  return (
    <div className="mt-5 rounded-2xl border border-[#d8c3a6] bg-[#241b18] p-4 text-[#fff7e8]">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#f5d896]">{locale === "en" ? "Relationships with other planets" : "Relações com outros planetas"}</p>
      {readings.length ? (
        <div className="mt-3 grid gap-3">
          {readings.map((reading) => (
            <div key={reading.id} className="rounded-xl border border-[#f4d58d]/20 bg-white/[0.06] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{reading.title}</p>
                <span className="text-[0.68rem] uppercase tracking-[0.1em] text-[#c8bbb0]">{reading.orb}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#d8ccc0]">{reading.explanation}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[#d8ccc0]">{locale === "en" ? "No major aspect within the calculation's orb was found for this planet. That does not make it weak; it means its expression is less tied to the five major relationships shown here." : "Nenhum aspecto maior dentro do orbe de cálculo foi encontrado para este planeta. Isso não o torna fraco; significa apenas que sua expressão está menos ligada às cinco relações principais mostradas aqui."}</p>
      )}
    </div>
  );
}

function PersonalizedPlacementReading({ position, aspects, locale }: { position: NatalPosition; aspects: Chart["aspects"]; locale: AstrologyLocale }) {
  if (position.house === null) {
    const body = getBodyInterpretation(position.body, locale);
    const sign = getSignInterpretation(position.sign, locale);
    const degree = getDegreeInterpretation(position.degreesInSign, locale);
    const bodyAspects = getBodyAspectReadings(position.body, aspects, locale);
    return (
      <div className="mt-4 grid gap-4">
        <div className="rounded-2xl border border-[#d8c3a6] bg-[#fffaf2] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{locale === "en" ? "Planet and sign" : "Planeta e signo"}</p>
          <h5 className="brand-serif mt-2 text-2xl font-semibold text-[#332720]">{body.label} {locale === "en" ? "in" : "em"} {sign.label}</h5>
          <p className="mt-3 text-sm leading-7 text-[#55473e]">{body.explanation}</p>
          <p className="mt-3 text-sm font-medium leading-6 text-[#6f5134]">{sign.tone}. {sign.gifts}.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InsightBlock title={locale === "en" ? "Potential" : "Potenciais"} text={sign.gifts} />
          <InsightBlock title={locale === "en" ? "A gentle attention" : "Ponto de atenção"} text={sign.tension} />
          <InsightBlock title={`${locale === "en" ? "Degree" : "Grau"} · ${degree.title}`} text={`${degree.label}. ${degree.explanation}`} />
        </div>
        <p className="rounded-2xl border border-[#d8c3a6] bg-[#f8efe2] p-4 text-sm leading-7 text-[#4f4035]">{locale === "en" ? "Birth time was not provided, so no house was assigned to this planet. Add the time later to reveal that layer without guessing." : "O horário de nascimento não foi informado, por isso nenhuma casa foi atribuída a este planeta. Adicione o horário depois para revelar essa camada sem suposições."}</p>
        <PersonalAspectList readings={bodyAspects} locale={locale} />
      </div>
    );
  }
  const reading = getPlacementInterpretation({ ...position, house: position.house }, locale);
  const bodyAspects = getBodyAspectReadings(position.body, aspects, locale);
  return (
    <div className="mt-4 grid gap-4">
      <div className="rounded-2xl border border-[#d8c3a6] bg-[#fffaf2] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{locale === "en" ? "The combination" : "A combinação"}</p>
        <h5 className="brand-serif mt-2 text-2xl font-semibold text-[#332720]">{reading.title}</h5>
        <p className="mt-3 text-sm leading-7 text-[#55473e]">{reading.combination}</p>
        <p className="mt-3 text-sm font-medium leading-6 text-[#6f5134]">{reading.manifestation}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InsightBlock title={locale === "en" ? "Potential" : "Potenciais"} text={reading.gifts} />
        <InsightBlock title={locale === "en" ? "A gentle attention" : "Ponto de atenção"} text={reading.tension} />
        <InsightBlock title={reading.houseTitle} text={reading.houseMeaning} />
        <InsightBlock title={reading.degreeTitle} text={reading.degreeMeaning} />
      </div>
      <p className="rounded-2xl border border-[#d8c3a6] bg-[#f8efe2] p-4 text-sm font-medium leading-7 text-[#4f4035]">{reading.synthesis}</p>
      <PersonalAspectList readings={bodyAspects} locale={locale} />
      <div className="rounded-2xl border border-[#d8c3a6] bg-[#fffaf2] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{locale === "en" ? "A question to carry" : "Uma pergunta para levar"}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#6f5134]">{reading.question}</p>
      </div>
    </div>
  );
}

function PlanetLibrary({ chart, positionMap, personalizedBodies, locale, expandedBody, onSelect }: { chart: Chart; positionMap: Map<NatalBody, NatalPosition>; personalizedBodies: NatalBody[]; locale: AstrologyLocale; expandedBody: AstrologySelection | null; onSelect: (body: NatalBody) => void }) {
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
          return (
            <button
              key={body}
              type="button"
              onClick={() => onSelect(body)}
              aria-expanded={expanded}
              data-body={body}
              className={`${styles.planetCard} rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 ${expanded ? "border-[#8a6b3f]" : "border-[#e6d8c3] hover:border-[#caa96c]"}`}
            >
              <div className={styles.planetLead}>
                <span className={styles.planetArtwork} aria-hidden="true">
                  <Image src={PDU_ASSETS.astrology.planets[body]} alt="" fill sizes="(max-width: 767px) 11rem, 13rem" className="object-contain" />
                </span>
                <div className={styles.planetHeading}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a6b3f]">{copy.label}</p>
                  <h4 className="brand-serif mt-2 text-2xl font-semibold text-[#332720]">{copy.archetype}</h4>
                </div>
                <span className={`${styles.planetStatus} grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#caa96c]/45 text-[#8a6b3f]`}>
                  {personalized ? <Check size={16} /> : <LockKeyhole size={15} />}
                </span>
              </div>
              <div className={styles.planetNarrative}>
                <p className="text-sm leading-6 text-[#55473e]">{copy.explanation}</p>
                {personalized && position ? (
                  <p className="mt-4 border-t border-[#dcc9af] pt-4 text-sm font-semibold text-[#6f5134]">
                    {formatPlacement(position.sign, position.degreesInSign, locale)}{position.house !== null ? ` · ${isEnglish ? `house ${position.house}` : `casa ${position.house}`}` : ""}
                  </p>
                ) : (
                  <p className="mt-4 border-t border-[#dcc9af] pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f5134]">
                    {isEnglish ? "Personal placement · available in full map" : "Posicionamento pessoal · disponível no mapa completo"}
                  </p>
                )}
                {expanded && personalized && position ? <PersonalizedPlacementReading position={position} aspects={chart.aspects} locale={locale} /> : null}
                {expanded && !personalized ? (
                  <div className="mt-4 rounded-2xl border border-[#d8c3a6]/60 bg-[#fffaf2]/85 p-4">
                    <p className="text-sm leading-7 text-[#55473e]">{copy.inLife}</p>
                    <p className="mt-3 text-sm font-medium leading-6 text-[#6f5134]">{copy.question}</p>
                  </div>
                ) : null}
              </div>
            </button>
          );
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
