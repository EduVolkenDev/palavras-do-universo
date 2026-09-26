"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock3, RefreshCw, Sparkles } from "lucide-react";
import type { DailySky, DailyTone, DailyTransit } from "@/lib/astrology/daily-sky";
import { getAspectInterpretation, getBodyInterpretation, getSignInterpretation, type AstrologyLocale } from "@/lib/astrology/interpretations";

const toneOrder: DailyTone[] = ["supportive", "attention", "intensified"];

const toneStyles: Record<DailyTone, string> = {
  supportive: "border-[#a8bda4] bg-[#f1f6ee]",
  attention: "border-[#d9b5a0] bg-[#fff4eb]",
  intensified: "border-[#cbb9d4] bg-[#f6f0f8]",
};

function toneLabel(tone: DailyTone, locale: AstrologyLocale) {
  if (locale === "en") return { supportive: "What may support you", attention: "What asks for care", intensified: "What feels stronger" }[tone];
  return { supportive: "O que pode favorecer", attention: "O que pede cuidado", intensified: "O que se intensifica" }[tone];
}

function transitText(transit: DailyTransit, locale: AstrologyLocale) {
  const moving = getBodyInterpretation(transit.transitBody, locale);
  const natal = getBodyInterpretation(transit.natalBody, locale);
  const aspect = getAspectInterpretation(transit.type, locale);
  const title = locale === "en"
    ? `${moving.label} ${aspect.label.toLowerCase()} natal ${natal.label}`
    : `${moving.label} em ${aspect.label.toLowerCase()} com ${natal.label} natal`;
  const transitSign = getSignInterpretation(transit.transitSign, locale).label;
  const natalSign = getSignInterpretation(transit.natalSign, locale).label;
  const detail = locale === "en"
    ? `${moving.label} in ${transitSign} · natal ${natal.label} in ${natalSign}${transit.natalHouse ? `, house ${transit.natalHouse}` : ""}`
    : `${moving.label} em ${transitSign} · ${natal.label} natal em ${natalSign}${transit.natalHouse ? `, casa ${transit.natalHouse}` : ""}`;
  const description = locale === "en"
    ? transit.tone === "supportive"
      ? `A symbolic opening between ${moving.archetype} and your ${natal.archetype}. It may help you work with that theme deliberately.`
      : transit.tone === "attention"
        ? `A symbolic tension between ${moving.archetype} and your ${natal.archetype}. Notice friction before treating it as a setback.`
        : `The theme of ${natal.archetype} may feel louder as ${moving.label} meets it. Give it attention without rushing to a conclusion.`
    : transit.tone === "supportive"
      ? `Uma abertura simbólica entre ${moving.archetype} e ${natal.archetype} do seu mapa. Pode ajudar você a trabalhar esse tema com intenção.`
      : transit.tone === "attention"
        ? `Uma tensão simbólica entre ${moving.archetype} e ${natal.archetype} do seu mapa. Observe o atrito antes de entendê-lo como impedimento.`
        : `O tema de ${natal.archetype} pode ganhar intensidade no encontro com ${moving.label}. Vale prestar atenção sem tirar conclusões apressadas.`;
  return { title, detail, description };
}

function clockLabel(instant: string, timezone: string, locale: AstrologyLocale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-BR", {
    timeZone: timezone,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
}

export function AstrologyDailySky({
  locale,
  mapAccessLevel,
  circlePrice,
  checkoutLoading,
  checkoutDisabled,
  checkoutError,
  onCheckout,
}: {
  locale: AstrologyLocale;
  mapAccessLevel: "preview" | "full";
  circlePrice: string;
  checkoutLoading: boolean;
  checkoutDisabled: boolean;
  checkoutError: string;
  onCheckout: () => Promise<void>;
}) {
  const [sky, setSky] = useState<DailySky | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const isEnglish = locale === "en";

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let lastFetched = 0;
    let lastLocalDate = "";

    async function refresh(force = false) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
      if (!force && today === lastLocalDate && Date.now() - lastFetched < 55 * 60_000) return;
      lastFetched = Date.now();
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`/api/astrology/daily?timezone=${encodeURIComponent(timezone)}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("daily-sky-unavailable");
        const payload = await response.json() as { sky: DailySky };
        if (!active) return;
        lastLocalDate = today;
        setSky(payload.sky);
        setError(false);
      } catch (caught) {
        if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
        lastFetched = 0;
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void refresh(true);
    const interval = window.setInterval(() => void refresh(), 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mapAccessLevel]);

  const circleAccess = sky?.access === "circle";
  return (
    <section className="mt-8 overflow-hidden rounded-[30px] border border-[#cdb898] bg-[#fffaf2] shadow-[0_18px_52px_rgba(80,57,34,0.08)]" aria-labelledby="daily-sky-title">
      <div className="bg-[#241b18] px-6 py-7 text-[#fff7e8] sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]"><Sparkles size={15} aria-hidden="true" />{isEnglish ? "The moving sky" : "O céu em movimento"}</p>
            <h2 id="daily-sky-title" className="brand-serif mt-3 text-3xl font-semibold sm:text-4xl">{isEnglish ? "Your sky today" : "Seu céu de hoje"}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d8ccc0]">{isEnglish ? "The current planetary positions, updated while you visit. Circle members also see their closest encounters with their birth chart and today's symbolic reading." : "As posições atuais dos planetas, atualizadas enquanto você visita. Assinantes do Círculo também veem os encontros com o mapa natal e a leitura simbólica do dia."}</p>
          </div>
          {sky ? <span className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/30 px-3 py-2 text-xs text-[#e6d5ba]"><Clock3 size={14} aria-hidden="true" />{clockLabel(sky.snapshotAtISO, sky.timezone, locale)} · {sky.timezone}</span> : null}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {loading && !sky ? <p className="flex items-center gap-2 text-sm text-[#6f615a]"><RefreshCw size={16} className="animate-spin" aria-hidden="true" />{isEnglish ? "Reading today's sky…" : "Lendo o céu de hoje…"}</p> : null}
        {error ? <p role="status" className="mb-5 rounded-xl border border-[#d9aaa8] bg-[#fff1f0] p-4 text-sm text-[#7b3330]">{isEnglish ? "Today's sky could not be refreshed. Try reopening the page shortly." : "Não foi possível atualizar o céu de hoje. Tente abrir a página novamente em instantes."}</p> : null}
        {sky ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a6b3f]">{isEnglish ? "Where the planets are now" : "Onde estão os planetas agora"}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {sky.positions.map((position) => (
                <div key={position.body} className="rounded-2xl border border-[#e6d8c3] bg-white/75 px-4 py-3">
                  <p className="text-xs font-semibold text-[#806c5d]">{getBodyInterpretation(position.body, locale).label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#332720]">{position.degreesInSign.toFixed(1)}° {getSignInterpretation(position.sign, locale).label}</p>
                </div>
              ))}
            </div>
            {circleAccess ? (
              <div className="mt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="brand-serif text-2xl font-semibold text-[#332720]">{isEnglish ? "How today's sky meets your map" : "Como o céu de hoje encontra seu mapa"}</h3>
                  <p className="text-xs text-[#806c5d]">{isEnglish ? "Major aspects within 2°; Moon within 3°" : "Aspectos principais até 2°; Lua até 3°"}</p>
                </div>
                {sky.transits.length ? toneOrder.map((tone) => {
                  const items = sky.transits.filter((transit) => transit.tone === tone);
                  if (!items.length) return null;
                  return <div key={tone} className="mt-6">
                    <h4 className="text-sm font-semibold text-[#493527]">{toneLabel(tone, locale)}</h4>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {items.map((transit) => {
                        const text = transitText(transit, locale);
                        return <article key={`${transit.transitBody}-${transit.type}-${transit.natalBody}`} className={`rounded-2xl border p-4 ${toneStyles[tone]}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2"><h5 className="font-semibold text-[#332720]">{text.title}</h5><span className="text-xs text-[#806c5d]">{transit.orb.toFixed(1)}° {isEnglish ? "orb" : "orbe"}</span></div>
                          <p className="mt-2 text-xs font-medium text-[#806c5d]">{text.detail}</p>
                          <p className="mt-2 text-sm leading-6 text-[#55473e]">{text.description}</p>
                        </article>;
                      })}
                    </div>
                  </div>;
                }) : <p className="mt-4 rounded-2xl border border-[#e6d8c3] bg-white/70 p-4 text-sm leading-6 text-[#6f615a]">{isEnglish ? "No close major transit meets your birth chart at this moment. That is not a negative reading; the planets still move, and this view refreshes as they do." : "Nenhum trânsito principal está próximo do seu mapa natal neste momento. Isso não é uma leitura negativa; os planetas continuam se movendo, e esta visão se atualiza com eles."}</p>}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-[#d8c3a6] bg-[#f8efe2] p-5">
                <p className="font-semibold text-[#332720]">{isEnglish ? "The moving sky, in conversation with your birth chart." : "O céu em movimento, em conversa com o seu mapa natal."}</p>
                <p className="mt-2 text-sm leading-6 text-[#6f615a]">{mapAccessLevel === "full"
                  ? (isEnglish ? "Your one-time Complete Map keeps your natal interpretation available. Daily transit readings are exclusive to an active Circle subscription." : "Seu Mapa Completo mantém a interpretação natal disponível. Leituras diárias dos trânsitos são exclusivas da assinatura ativa do Círculo.")
                  : (isEnglish ? "The free layer shows today's planetary positions. The one-time Complete Map opens your natal interpretation; only the Circle adds daily transit readings." : "A camada gratuita mostra as posições de hoje. O Mapa Completo avulso abre a interpretação natal; só o Círculo inclui leituras diárias dos trânsitos.")}</p>
                <button type="button" onClick={() => void onCheckout()} disabled={checkoutDisabled || checkoutLoading} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241b18] px-5 py-2.5 text-sm font-semibold text-[#fff7e8] transition hover:bg-[#4b3934] disabled:cursor-wait disabled:opacity-60">
                  {checkoutDisabled ? (isEnglish ? "Synchronizing access…" : "Sincronizando acesso…") : checkoutLoading ? (isEnglish ? "Opening…" : "Abrindo…") : (isEnglish ? `Join the Circle · ${circlePrice}/month` : `Entrar no Círculo · ${circlePrice}/mês`)}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                {checkoutError ? <p role="alert" className="mt-3 text-sm text-[#7b3330]">{checkoutError}</p> : null}
              </div>
            )}
            <p className="mt-6 text-xs leading-5 text-[#806c5d]">{isEnglish ? "Snapshot at the time shown, in your device's time zone. Supportive and challenging describe symbolic aspects, not guaranteed events. This is not an exhaustive account of every influence." : "Retrato no horário indicado, no fuso do seu dispositivo. Favorável e desafiador descrevem aspectos simbólicos, não acontecimentos garantidos. Esta não é uma lista exaustiva de todas as influências."}</p>
          </>
        ) : null}
      </div>
    </section>
  );
}
