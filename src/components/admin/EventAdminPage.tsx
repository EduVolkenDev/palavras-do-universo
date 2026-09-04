"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SiteEventStatus = "new" | "reviewed" | "resolved" | "ignored";
type SiteEventSeverity = "debug" | "info" | "warning" | "error" | "fatal";

type JsonRecord = Record<string, unknown>;

type SiteEventView = {
  id: string;
  created_at: string;
  event_type: string;
  severity: SiteEventSeverity;
  source: string;
  route: string | null;
  path: string | null;
  locale: string | null;
  user_id: string | null;
  anonymous_id: string | null;
  reading_id: string | null;
  product_key: string | null;
  message: string | null;
  error_name: string | null;
  stack: string | null;
  last_action: string | null;
  viewport: JsonRecord;
  scroll: JsonRecord;
  context: JsonRecord;
  user_agent: string | null;
  status: SiteEventStatus;
  resolved_at: string | null;
  resolved_by: string | null;
};

const STATUS_LABELS: Record<SiteEventStatus, string> = {
  new: "Novo",
  reviewed: "Em análise",
  resolved: "Resolvido",
  ignored: "Ignorado",
};

const STATUS_CLASSES: Record<SiteEventStatus, string> = {
  new: "border-[#d8c28e] bg-[#fff8df] text-[#7b6336]",
  reviewed: "border-[#bdd7d0] bg-[#eff8f4] text-[#35685c]",
  resolved: "border-[#9ec9b8] bg-[#e4f6ee] text-[#1c6650]",
  ignored: "border-[#d9c9c6] bg-[#f8f0ee] text-[#795c56]",
};

const SEVERITY_CLASSES: Record<SiteEventSeverity, string> = {
  debug: "border-[#d7d4cf] bg-white text-[#6f625a]",
  info: "border-[#c8d8da] bg-[#eef8fa] text-[#34646b]",
  warning: "border-[#ead29b] bg-[#fff8df] text-[#836637]",
  error: "border-[#e0b2a7] bg-[#fff0ec] text-[#8c4436]",
  fatal: "border-[#cf9ba5] bg-[#fff0f4] text-[#92324a]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatViewport(event: SiteEventView) {
  const width = asNumber(event.viewport?.width);
  const height = asNumber(event.viewport?.height);
  if (!width || !height) return "Tela não informada";
  return `${Math.round(width)} x ${Math.round(height)}`;
}

function isMobileEvent(event: SiteEventView) {
  const width = asNumber(event.viewport?.width);
  return typeof width === "number" && width <= 760;
}

function formatJson(value: JsonRecord) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function EventAdminPage({
  ownerEmail,
  hasSupabase,
}: {
  ownerEmail: string;
  hasSupabase: boolean;
}) {
  const [events, setEvents] = useState<SiteEventView[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const summary = useMemo(
    () => ({
      total: events.length,
      open: events.filter((event) => event.status === "new").length,
      severe: events.filter((event) => event.severity === "error" || event.severity === "fatal").length,
      mobile: events.filter(isMobileEvent).length,
    }),
    [events]
  );

  const summaryCards: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    { label: "Eventos", value: summary.total, Icon: Eye },
    { label: "Novos", value: summary.open, Icon: Clock3 },
    { label: "Erros", value: summary.severe, Icon: AlertTriangle },
    { label: "Mobile", value: summary.mobile, Icon: Smartphone },
  ];

  async function loadEvents() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const data = (await response.json()) as {
        events?: SiteEventView[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(data.events)) {
        throw new Error(data.error || "Não foi possível carregar os eventos.");
      }
      setEvents(data.events);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  async function updateStatus(id: string, status: SiteEventStatus) {
    setSavingId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", id, status }),
      });
      const data = (await response.json()) as { event?: SiteEventView; error?: string };
      if (!response.ok || !data.event) {
        throw new Error(data.error || "Não foi possível atualizar o evento.");
      }
      setEvents((current) =>
        current.map((event) => (event.id === id ? data.event! : event))
      );
      setNotice("Status atualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o evento.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] px-4 py-8 text-[#241b18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#d8c8ba] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8e674d]">Palavras do Universo · Administração</p>
            <h1 className="brand-serif mt-2 text-4xl leading-none text-[#2c1f1b]">Eventos de estabilidade</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f5d55]">
              Erros de navegador, assets que não carregam e saltos bruscos de rolagem ficam reunidos aqui para investigação.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/feedback" className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white/60 px-4 py-2 text-sm font-semibold text-[#604b42]">
              Feedbacks
              <ExternalLink size={14} />
            </Link>
            <Link href="/admin/codigos" className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white/60 px-4 py-2 text-sm font-semibold text-[#604b42]">
              Códigos
              <ExternalLink size={14} />
            </Link>
            <button type="button" onClick={() => void loadEvents()} className="inline-flex items-center gap-2 rounded-full bg-[#241b18] px-4 py-2 text-sm font-semibold text-[#fff7ed] disabled:opacity-50" disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#765f54]">
          <ShieldCheck size={15} className="text-[#3f786a]" />
          Acesso de proprietário: {ownerEmail || "conta autorizada"}
          {!hasSupabase ? " · Supabase indisponível neste ambiente" : ""}
        </div>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo dos eventos">
          {summaryCards.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-4 shadow-[0_12px_34px_rgba(75,46,30,0.06)]">
              <div className="flex items-center justify-between gap-3 text-[#805f4e]">
                <span className="text-xs font-bold uppercase tracking-[0.14em]">{label}</span>
                <Icon size={17} />
              </div>
              <strong className="mt-3 block text-3xl font-semibold text-[#2c1f1b]">{value}</strong>
            </div>
          ))}
        </section>

        {notice ? <p className="mt-6 rounded-xl border border-[#afd2c3] bg-[#eefaf5] px-4 py-3 text-sm text-[#28604f]" role="status">{notice}</p> : null}
        {error ? <p className="mt-6 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm text-[#8a4038]" role="alert">{error}</p> : null}

        <section className="mt-7 space-y-4" aria-live="polite">
          {loading ? <div className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-8 text-sm text-[#765f54]">Carregando eventos…</div> : null}
          {!loading && events.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cdbbab] bg-white/52 p-10 text-center text-sm text-[#765f54]">Ainda não há eventos registrados.</div> : null}
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-[#dfd0c4] bg-white/82 p-5 shadow-[0_16px_40px_rgba(75,46,30,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#806b60]">
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${SEVERITY_CLASSES[event.severity]}`}>{event.severity.toUpperCase()}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${STATUS_CLASSES[event.status]}`}>{STATUS_LABELS[event.status]}</span>
                    <span>{event.event_type}</span>
                    <span>·</span>
                    <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-[#2c1f1b]">{event.path || event.route || "Rota não informada"}</h2>
                  {event.message ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#55453e]">{event.message}</p> : null}
                  <div className="mt-4 grid gap-2 text-xs text-[#806b60] sm:grid-cols-2 lg:grid-cols-4">
                    <span>Tela: {formatViewport(event)}</span>
                    <span>Scroll: {String(event.scroll?.y ?? "n/a")}</span>
                    <span>Produto: {event.product_key || "n/a"}</span>
                    <span>Idioma: {event.locale || "n/a"}</span>
                  </div>
                  <details className="mt-4 rounded-xl border border-[#eadfd4] bg-[#fffaf4] p-3 text-xs text-[#604b42]">
                    <summary className="cursor-pointer font-bold">Detalhes técnicos</summary>
                    <div className="mt-3 space-y-3">
                      {event.last_action ? <p><strong>Última ação:</strong> {event.last_action}</p> : null}
                      {event.error_name ? <p><strong>Erro:</strong> {event.error_name}</p> : null}
                      {event.user_id || event.anonymous_id ? <p><strong>Usuário:</strong> {event.user_id || event.anonymous_id}</p> : null}
                      {event.reading_id ? <p><strong>Leitura:</strong> {event.reading_id}</p> : null}
                      {event.stack ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-[#2c211f] p-3 text-[#fff7ed]">{event.stack}</pre> : null}
                      <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3">{formatJson({ viewport: event.viewport, scroll: event.scroll, context: event.context })}</pre>
                      {event.user_agent ? <p><strong>Navegador:</strong> {event.user_agent}</p> : null}
                    </div>
                  </details>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[18rem] lg:justify-end">
                  {event.status !== "reviewed" ? <button type="button" onClick={() => void updateStatus(event.id, "reviewed")} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#bdd7d0] bg-[#eff8f4] px-4 py-2.5 text-xs font-bold text-[#35685c] disabled:opacity-50"><Eye size={15} />Analisar</button> : null}
                  {event.status !== "resolved" ? <button type="button" onClick={() => void updateStatus(event.id, "resolved")} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full bg-[#2f7762] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Resolver</button> : null}
                  {event.status !== "ignored" ? <button type="button" onClick={() => void updateStatus(event.id, "ignored")} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#d1b8b0] bg-[#fff7f5] px-4 py-2.5 text-xs font-bold text-[#7b4f47] disabled:opacity-50"><XCircle size={15} />Ignorar</button> : null}
                  {event.status !== "new" ? <button type="button" onClick={() => void updateStatus(event.id, "new")} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white px-4 py-2.5 text-xs font-bold text-[#604b42] disabled:opacity-50"><RotateCcw size={15} />Reabrir</button> : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
