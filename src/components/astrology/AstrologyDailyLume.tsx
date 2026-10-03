"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import { dailyTransitId, type DailyReadingResult } from "@/lib/astrology/daily-reading";
import type { DailySky, DailyTone } from "@/lib/astrology/daily-sky";
import { getAspectInterpretation, getBodyInterpretation, type AstrologyLocale } from "@/lib/astrology/interpretations";
import { dailyTransitArtworkKey, type DailyTransitArtworkPlan } from "@/lib/astrology/visual-assets";

const groups: Array<{ tone: DailyTone; pt: string; en: string }> = [
  { tone: "supportive", pt: "O que pode favorecer você", en: "What may support you" },
  { tone: "attention", pt: "O que pede cuidado", en: "What asks for care" },
  { tone: "intensified", pt: "O que se intensifica", en: "What feels stronger" },
];

export function AstrologyDailyLume({ sky, locale, artworkPlan }: { sky: DailySky; locale: AstrologyLocale; artworkPlan: DailyTransitArtworkPlan }) {
  const isEnglish = locale === "en";
  const natalLabel = { "pt-BR": "natal", en: "natal" }[locale];
  const key = `${sky.localDate}:${sky.timezone}:${locale}:${sky.access}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; result: DailyReadingResult | "denied" } | null>(null);

  useEffect(() => {
    if (sky.access !== "circle") return;
    let active = true;
    let controller: AbortController | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    async function load() {
      controller = new AbortController();
      requestTimer = setTimeout(() => controller?.abort(), 40_000);
      try {
        const response = await fetch("/api/astrology/daily/reading", {
          method: "POST", credentials: "include", cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, timezone: sky.timezone }), signal: controller.signal,
        });
        if (!active) return;
        if (response.status === 403 || response.status === 401) {
          setState({ key, result: "denied" });
          return;
        }
        if (!response.ok) throw new Error("Daily reading unavailable");
        const result = await response.json() as DailyReadingResult;
        if (!active) return;
        if (!["ready", "pending", "unavailable"].includes(result.status)) throw new Error("Invalid daily reading response");
        // Do not show yesterday's answer when a request crosses local midnight.
        if (result.status === "ready" && (result.reading.localDate !== sky.localDate || result.reading.locale !== locale || result.reading.timezone !== sky.timezone)) {
          throw new Error("Daily reading day changed");
        }
        setState({ key, result });
        if (result.status === "pending" && polls++ < 12) {
          pollTimer = setTimeout(() => void load(), Math.max(3, Math.min(result.retryAfterSeconds, 5)) * 1_000);
        } else if (result.status === "pending") {
          setState({ key, result: { status: "unavailable", retryAfterSeconds: 60 } });
        }
      } catch {
        if (active) setState({ key, result: { status: "unavailable", retryAfterSeconds: 300 } });
      } finally {
        clearTimeout(requestTimer);
      }
    }
    void load();
    return () => { active = false; controller?.abort(); clearTimeout(pollTimer); clearTimeout(requestTimer); };
  }, [key, locale, sky.access, sky.localDate, sky.timezone, attempt]);

  if (sky.access !== "circle") return null;
  const result = state?.key === key ? state.result : null;
  const reading = result && result !== "denied" && result.status === "ready" ? result.reading : null;
  const pending = !result || (result !== "denied" && result.status === "pending");
  const artwork = artworkPlan.lumeHero;
  return (
    <section className="mt-7 overflow-hidden rounded-[24px] border border-[#caa96c]/55 bg-[linear-gradient(145deg,#fffaf2,#f4eadc)]" aria-labelledby="daily-lume-title" aria-busy={pending}>
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#775a3c]"><Sparkles size={16} aria-hidden="true" />{isEnglish ? "Lume · your daily interpretation" : "Lume · sua interpretação diária"}</p>
          <h3 id="daily-lume-title" className="brand-serif mt-3 max-w-2xl text-2xl font-semibold text-[#332720] sm:text-3xl">{isEnglish ? "A reading of your day, not a fixed destiny." : "Uma leitura do seu dia, não um destino escrito."}</h3>
          {pending ? <p role="status" className="mt-5 flex max-w-2xl items-center gap-2 text-sm leading-6 text-[#6f615a]"><RefreshCw size={16} className="motion-safe:animate-spin" aria-hidden="true" />{isEnglish ? "Lume is connecting today's sky with your natal chart. Your reading will be saved for today." : "Lume está conectando o céu de hoje ao seu mapa natal. Sua leitura ficará salva para este dia."}</p> : null}
          {result === "denied" ? <p role="status" className="mt-5 max-w-2xl text-sm leading-6 text-[#6f615a]">{isEnglish ? "An active Circle subscription and a valid session are required. Reopen the page to synchronize your access." : "É preciso ter Círculo ativo e uma sessão válida. Abra a página novamente para sincronizar seu acesso."}</p> : null}
          {result && result !== "denied" && result.status === "unavailable" ? <div className="mt-5 max-w-2xl text-sm leading-6 text-[#6f615a]" role="status"><p>{isEnglish ? "Lume could not prepare your interpretation now. The calculated sky remains available below; those explanations are not a new AI reading." : "Lume não conseguiu preparar sua interpretação agora. O céu calculado continua disponível abaixo; essas explicações não são uma nova leitura de IA."}</p><button type="button" onClick={() => { setState(null); setAttempt((value) => value + 1); }} className="mt-4 min-h-11 rounded-full border border-[#caa96c] px-4 py-2 font-semibold text-[#775a3c] focus-visible:outline-2 focus-visible:outline-offset-4">{isEnglish ? "Check again" : "Verificar novamente"}</button><p className="mt-2 text-xs">{isEnglish ? "Repeated checks do not bypass the waiting period or create extra readings." : "Verificar novamente não ignora o intervalo de espera nem cria leituras extras."}</p></div> : null}
        </div>
        <div className="relative min-h-[18rem] overflow-hidden border-t border-[#caa96c]/45 bg-[#241b18] lg:min-h-full lg:border-l lg:border-t-0">
          <Image src={artwork} alt="" fill sizes="(max-width: 1024px) 100vw, 34rem" className="object-contain p-6" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(36,27,24,0.52))]" aria-hidden="true" />
        </div>
      </div>
      {reading ? <div className="border-t border-[#caa96c]/35 p-5 sm:p-7">
        <p className="text-xs leading-5 text-[#806c5d]">{new Intl.DateTimeFormat(isEnglish ? "en-GB" : "pt-BR", { timeZone: reading.timezone, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(reading.sky.snapshotAtISO))} · {reading.timezone}. {isEnglish ? "Based on this snapshot, saved for your day. AI-generated symbolic interpretation." : "Baseada nesse retrato do céu e salva para o seu dia. Interpretação simbólica gerada por IA."}</p>
        {reading.natalTimePrecision === "unknown" ? <p className="mt-4 rounded-xl border border-[#e6d8c3] bg-white/65 p-3 text-sm leading-6 text-[#6f615a]">{isEnglish ? "Without your birth time, natal positions use local noon as a reference. The Moon and aspects may change when you add the time; no Ascendant or houses are assumed." : "Sem a hora de nascimento, as posições natais usam o meio-dia local como referência. A Lua e os aspectos podem mudar quando você informar a hora; não atribuímos Ascendente nem casas."}</p> : null}
        <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#493527]">{reading.content.overview}</p>
        {groups.map(({ tone, pt, en }) => {
          const transits = reading.sky.transits.filter((transit) => transit.tone === tone);
          const entries = reading.content.influences.filter((item) => transits.some((transit) => dailyTransitId(transit) === item.transitId));
          if (!entries.length) return null;
          return <div key={tone} className="mt-6"><h4 className="font-semibold text-[#493527]">{isEnglish ? en : pt}</h4><div className="mt-3 space-y-3">{entries.map((item) => {
            const transit = transits.find((value) => dailyTransitId(value) === item.transitId)!;
            return <article key={item.transitId} className="grid overflow-hidden rounded-2xl border border-[#e6d8c3] bg-white/75 md:grid-cols-[minmax(0,1.2fr)_minmax(13rem,0.8fr)]"><div className="p-4 sm:p-5"><p className="text-xs font-semibold text-[#806c5d]">{getBodyInterpretation(transit.transitBody, locale).label} · {getAspectInterpretation(transit.type, locale).label} · {getBodyInterpretation(transit.natalBody, locale).label} {natalLabel}</p><p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#55473e]">{item.text}</p></div><div className="relative min-h-[12rem] overflow-hidden border-t border-[#e6d8c3] bg-[#e7dac6] md:min-h-full md:border-l md:border-t-0"><Image src={artworkPlan.lumeCardByTransit[dailyTransitArtworkKey(transit)]} alt="" fill sizes="(max-width: 767px) 100vw, 26rem" className="object-contain p-3" aria-hidden="true" /></div></article>;
          })}</div></div>;
        })}
        <div className="mt-6 rounded-2xl bg-[#241b18] p-5 text-[#fff7e8]"><h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#f5d896]">{isEnglish ? "One possible gesture today" : "Um gesto possível para hoje"}</h4><p className="mt-3 text-sm leading-7">{reading.content.nextStep}</p></div>
      </div> : null}
    </section>
  );
}
