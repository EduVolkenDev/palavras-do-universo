"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SavedDailyReading } from "@/lib/astrology/daily-reading";
import { daysSince, type DailyCheckIn } from "@/lib/astrology/daily-continuity";
import type { AstrologyLocale } from "@/lib/astrology/interpretations";

type Props = { reading: SavedDailyReading | null; localDate: string; timezone: string; locale: AstrologyLocale };

export function AstrologyDailyContinuity({ reading, localDate, timezone, locale }: Props) {
  const en = locale === "en";
  const [entries, setEntries] = useState<DailyCheckIn[]>([]);
  const [gesture, setGesture] = useState("");
  const [reflection, setReflection] = useState("");
  const [followup, setFollowup] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedRevisitId, setSelectedRevisitId] = useState<string | null>(null);
  const revisitHeadingRef = useRef<HTMLHeadingElement>(null);
  const key = `${localDate}:${timezone}:${locale}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    setError("");
    setEntries([]);
    setHasMore(false);
    setNextOffset(0);
    void fetch("/api/astrology/daily/check-ins", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unavailable");
        return res.json() as Promise<{ checkIns?: DailyCheckIn[]; hasMore?: boolean; nextOffset?: number }>;
      })
      .then((data) => { if (active) { setEntries(data.checkIns ?? []); setHasMore(Boolean(data.hasMore)); setNextOffset(data.nextOffset ?? 0); } })
      .catch(() => { if (active) { setLoadError(true); setError(en ? "Your notes could not be loaded right now." : "Não foi possível carregar suas notas agora."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, en, reloadCount]);

  const today = entries.find((entry) => entry.localDate === localDate && entry.timezone === timezone);
  const due = useMemo(() => entries.filter((entry) => !entry.followupAt && daysSince(entry.localDate, entry.timezone) >= 2 &&
    !(entry.localDate === localDate && entry.timezone === timezone)), [entries, localDate, timezone]);
  const revisit = due.find((entry) => entry.id === selectedRevisitId) ?? due[0];
  const history = entries.filter((entry) => entry.id !== today?.id && entry.id !== revisit?.id);

  useEffect(() => {
    if (!selectedRevisitId || !revisitHeadingRef.current) return;
    revisitHeadingRef.current.focus({ preventScroll: true });
    revisitHeadingRef.current.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [selectedRevisitId]);

  async function loadMore() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/astrology/daily/check-ins?offset=${nextOffset}`, { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("unavailable");
      const data = await res.json() as { checkIns?: DailyCheckIn[]; hasMore?: boolean; nextOffset?: number };
      setEntries((current) => [...current, ...(data.checkIns ?? []).filter((item) => !current.some((saved) => saved.id === item.id))]);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? nextOffset);
    } catch {
      setError(en ? "Older notes could not be loaded right now." : "Não foi possível carregar as notas anteriores agora.");
    } finally { setBusy(false); }
  }

  async function send(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/astrology/daily/check-ins", {
        method, credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const failure = await res.json().catch(() => null) as { code?: string } | null;
        const code = failure?.code;
        const message = res.status === 401
          ? (en ? "Your session ended. Sign in again, then reopen this page." : "Sua sessão terminou. Entre novamente e reabra esta página.")
          : res.status === 403
            ? (en ? "This moment is available with an active Circle subscription." : "Este momento está disponível com uma assinatura ativa do Círculo.")
            : code === "DAILY_READING_REQUIRED"
              ? (en ? "Today's reading is not ready to save yet. Refresh the page and try again." : "A leitura de hoje ainda não está pronta para guardar. Atualize a página e tente novamente.")
              : code === "FOLLOWUP_NOT_READY"
                ? (en ? "This moment can be revisited after two local days." : "Este momento pode ser revisitado depois de dois dias no seu fuso horário.")
                : code === "INVALID_CHECK_IN"
                  ? (en ? "The day may have changed. Refresh the page and try again." : "O dia pode ter mudado. Atualize a página e tente novamente.")
                  : code === "CHECK_IN_NOT_FOUND"
                    ? (en ? "This moment is no longer available. Refresh the page." : "Este momento não está mais disponível. Atualize a página.")
                    : (en ? "We could not save this. Please try again." : "Não foi possível guardar. Tente novamente.");
        setError(message);
        return;
      }
      const result = await res.json() as { checkIn?: DailyCheckIn };
      if (method === "DELETE") setEntries((current) => current.filter((entry) => entry.id !== body.id));
      else if (result.checkIn) setEntries((current) => [result.checkIn!, ...current.filter((entry) => entry.id !== result.checkIn!.id)]);
      else throw new Error("save-failed");
      setNotice(method === "DELETE" ? (en ? "Your note was removed." : "Sua nota foi removida.") :
        method === "PATCH" ? (en ? "Your reflection was saved." : "Sua reflexão foi guardada.") :
          (en ? "Your moment was saved privately." : "Seu momento foi guardado de forma privada."));
      if (method === "POST") { setGesture(""); setReflection(""); }
      if (method === "PATCH") setFollowup("");
    } catch {
      setError(en ? "We could not save this. Please try again." : "Não foi possível guardar. Tente novamente.");
    } finally { setBusy(false); }
  }

  const dateLabel = (entry: DailyCheckIn) => new Intl.DateTimeFormat(en ? "en-GB" : "pt-BR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${entry.localDate}T00:00:00Z`));

  return <section className="mt-7 rounded-[22px] border border-[#d8c4a7] bg-[#fffdf9] p-5 shadow-[0_12px_32px_rgba(80,57,34,0.05)] sm:p-7" aria-labelledby="daily-continuity-title">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">{en ? "Your living journey" : "Sua jornada viva"}</p>
    <h4 id="daily-continuity-title" className="brand-serif mt-2 text-2xl font-semibold text-[#332720]">{en ? "What will you take from today?" : "O que você leva deste dia?"}</h4>
    <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6f615a]">{en ? "Keep a thought or choose a small gesture. In a few days, you can return and notice what changed. This is optional and stays in your private account history; your written words are not sent to Lume automatically." : "Guarde uma ideia ou escolha um pequeno gesto. Daqui a alguns dias, volte para perceber o que mudou. É opcional e fica no seu histórico privado; suas palavras não são enviadas automaticamente à Lume."}</p>
    {!reading ? <p className="mt-3 text-sm leading-6 text-[#6f615a]">{en ? "Today's reading needs to be ready before you save a new moment. Earlier moments remain available below." : "A leitura de hoje precisa ficar pronta para você guardar um novo momento. Os momentos anteriores continuam disponíveis abaixo."}</p> : null}
    {loading ? <p role="status" className="mt-4 text-sm text-[#6f615a]">{en ? "Finding your moments…" : "Encontrando seus momentos…"}</p> : null}
    {!loading && reading && !today && !loadError ? <div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="block text-sm font-semibold text-[#493527]">{en ? "A small gesture (optional)" : "Um pequeno gesto (opcional)"}
        <textarea value={gesture} onChange={(event) => setGesture(event.target.value)} maxLength={500} rows={3} placeholder={reading.content.nextStep} className="mt-2 w-full rounded-xl border border-[#d8c4a7] bg-white p-3 text-sm font-normal leading-6 text-[#493527] placeholder:text-[#8b8075] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6b3f]" />
      </label>
      <label className="block text-sm font-semibold text-[#493527]">{en ? "What you notice (optional)" : "O que você percebe (opcional)"}
        <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={500} rows={3} placeholder={en ? "One sentence is enough." : "Uma frase já basta."} className="mt-2 w-full rounded-xl border border-[#d8c4a7] bg-white p-3 text-sm font-normal leading-6 text-[#493527] placeholder:text-[#8b8075] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6b3f]" />
      </label>
      <div className="md:col-span-2"><button type="button" disabled={busy || (!gesture.trim() && !reflection.trim())} onClick={() => void send("POST", { localDate, timezone, locale, gesture, reflection })} className="min-h-11 rounded-full bg-[#241b18] px-5 py-2.5 text-sm font-semibold text-[#fff7e8] transition-colors hover:bg-[#4b3934] disabled:cursor-not-allowed disabled:opacity-50">{busy ? (en ? "Saving…" : "Guardando…") : (en ? "Save this moment" : "Guardar este momento")}</button></div>
    </div> : null}
    {today ? <div className="mt-5 rounded-2xl border border-[#e6d8c3] bg-[#f8efe2] p-4 text-sm leading-7 text-[#493527]">
      <p className="font-semibold">{en ? "Saved today" : "Guardado hoje"}</p>
      {today.gesture ? <p className="mt-2"><span className="font-semibold">{en ? "Gesture: " : "Gesto: "}</span>{today.gesture}</p> : null}
      {today.reflection ? <p className="mt-2"><span className="font-semibold">{en ? "Reflection: " : "Reflexão: "}</span>{today.reflection}</p> : null}
      <p className="mt-2 text-xs text-[#6f615a]">{en ? "Come back in two days to reflect. You can remove this note at any time." : "Volte em dois dias para refletir. Você pode remover esta nota quando quiser."}</p>
      <button type="button" disabled={busy} onClick={() => void send("DELETE", { id: today.id })} className="mt-2 min-h-11 text-xs font-semibold underline underline-offset-4 disabled:opacity-50">{en ? "Remove note" : "Remover nota"}</button>
    </div> : null}
    {revisit ? <div className="mt-5 rounded-2xl border border-[#d8c4a7] bg-[#f6f0e7] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">{en ? `Return to ${dateLabel(revisit)}` : `Volte a ${dateLabel(revisit)}`}</p>
      <h5 ref={revisitHeadingRef} tabIndex={-1} className="brand-serif mt-2 scroll-mt-24 text-xl font-semibold text-[#332720]">{en ? "What changed since then?" : "O que mudou desde então?"}</h5>
      <p className="mt-2 text-sm leading-7 text-[#55473e]">{revisit.gesture || revisit.nextStep}</p>
      {revisit.reflection ? <p className="mt-2 text-sm leading-7 text-[#6f615a]">{en ? "You noticed: " : "Você percebeu: "}{revisit.reflection}</p> : null}
      <label className="mt-4 block text-sm font-semibold text-[#493527]">{en ? "Your view today" : "Seu olhar de hoje"}
        <textarea value={followup} onChange={(event) => setFollowup(event.target.value)} maxLength={500} rows={3} placeholder={en ? "It can be different from what you expected." : "Pode ser diferente do que você esperava."} className="mt-2 w-full rounded-xl border border-[#d8c4a7] bg-white p-3 text-sm font-normal leading-6 text-[#493527] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6b3f]" />
      </label>
      <button type="button" disabled={busy || !followup.trim()} onClick={() => void send("PATCH", { id: revisit.id, followupText: followup })} className="mt-3 min-h-11 rounded-full bg-[#241b18] px-5 py-2.5 text-sm font-semibold text-[#fff7e8] transition-colors hover:bg-[#4b3934] disabled:cursor-not-allowed disabled:opacity-50">{en ? "Save what changed" : "Guardar o que mudou"}</button>
      <button type="button" disabled={busy} onClick={() => void send("DELETE", { id: revisit.id })} className="ml-4 min-h-11 text-xs font-semibold text-[#6f615a] underline underline-offset-4 disabled:opacity-50">{en ? "Remove note" : "Remover nota"}</button>
    </div> : null}
    {history.length ? <details className="mt-5 rounded-2xl border border-[#e6d8c3] bg-white/70 p-4 text-sm leading-7 text-[#55473e]">
      <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6b3f]">{en ? `Earlier moments (${history.length})` : `Momentos anteriores (${history.length})`}</summary>
      <div className="mt-3 space-y-3">{history.map((entry) => <div key={entry.id} className="rounded-xl border border-[#e6d8c3] p-3">
        <p className="font-semibold">{dateLabel(entry)}</p>
        <p className="mt-1">{entry.gesture || entry.nextStep}</p>
        {entry.reflection ? <p className="mt-1">{entry.reflection}</p> : null}
        {entry.followupText ? <p className="mt-2 font-medium">{en ? "Later: " : "Depois: "}{entry.followupText}</p> : null}
        {!entry.followupAt && daysSince(entry.localDate, entry.timezone) >= 2 ? <button type="button" onClick={() => { setSelectedRevisitId(entry.id); setFollowup(""); }} className="mt-2 min-h-11 text-xs font-semibold underline underline-offset-4">{en ? "Revisit this moment" : "Revisitar este momento"}</button> : null}
        <button type="button" disabled={busy} onClick={() => void send("DELETE", { id: entry.id })} className="ml-4 min-h-11 text-xs font-semibold underline underline-offset-4 disabled:opacity-50">{en ? "Remove note" : "Remover nota"}</button>
      </div>)}</div>
    </details> : null}
    {hasMore ? <button type="button" disabled={busy} onClick={() => void loadMore()} className="mt-4 min-h-11 text-sm font-semibold text-[#493527] underline underline-offset-4 disabled:opacity-50">{en ? "Load earlier moments" : "Carregar momentos anteriores"}</button> : null}
    {error ? <p role="alert" className="mt-4 text-sm text-[#8a3832]">{error}</p> : null}
    {loadError ? <button type="button" onClick={() => setReloadCount((value) => value + 1)} className="mt-2 min-h-11 text-sm font-semibold text-[#493527] underline underline-offset-4">{en ? "Try loading again" : "Tentar carregar novamente"}</button> : null}
    {notice ? <p role="status" className="mt-4 text-sm text-[#4c6b4c]">{notice}</p> : null}
  </section>;
}
