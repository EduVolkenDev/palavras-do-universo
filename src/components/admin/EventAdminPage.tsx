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

type EventGroup = {
  key: string;
  event: SiteEventView;
  ids: string[];
};

function eventFingerprint(event: SiteEventView) {
  return [event.severity, event.event_type, event.path ?? event.route ?? "", event.error_name ?? "", event.message ?? ""].join("|");
}

function getPlainSummary(event: SiteEventView) {
  if (event.event_type === "react.error_boundary") return "Uma parte da página parou de carregar.";
  if (event.event_type === "asset.load_error") return "Um recurso visual não carregou.";
  if (event.event_type === "ux.scroll_jump_to_top") return "A página voltou ao topo inesperadamente.";
  if (event.event_type === "marketing.cta_click") return "Uma pessoa clicou em um convite para conhecer a oferta.";
  if (event.event_type === "marketing.landing_view") return "Uma pessoa visitou uma página de campanha.";
  return event.message || "Evento registrado pelo site.";
}

function getAnalysis(event: SiteEventView) {
  const detail = `${event.error_name ?? ""} ${event.message ?? ""}`;
  if (detail.includes("PlacementDetail")) {
    return { cause: "Uma versão antiga da Astrologia chamou um componente que ainda não estava disponível.", impact: "A página /astrologia não carregou para estas visitas de 17 de setembro.", recommendation: "A função já existe no código atual. Confirme a página publicada e marque este grupo como resolvido." };
  }
  if (detail.includes("PduAssetStory")) {
    return { cause: "Uma versão transitória da home tentou usar um bloco visual antes de ele estar disponível.", impact: "A home não carregou em três tentativas de 21 de setembro.", recommendation: "O bloco foi removido da versão atual. Se a home abrir normalmente, marque este grupo como resolvido." };
  }
  if (detail.includes("insertBefore")) {
    return { cause: "O navegador encontrou uma alteração de interface enquanto reorganizava elementos da página.", impact: "A interação falhou para quatro visitas de 15 de setembro.", recommendation: "Não há repetição recente. Mantenha em análise e reabra apenas se voltar a acontecer." };
  }
  if (event.event_type === "asset.load_error") return { cause: "O navegador não conseguiu obter um arquivo visual.", impact: "A experiência pode ficar incompleta, mas a página tende a continuar utilizável.", recommendation: "Confira o caminho do arquivo e se o erro continua ocorrendo depois da publicação." };
  if (event.event_type === "ux.scroll_jump_to_top") return { cause: "Uma mudança de rota ou atualização de conteúdo reposicionou a página.", impact: "A pessoa pode perder o ponto onde estava lendo.", recommendation: "Compare a última ação e o dispositivo; investigue apenas se o padrão se repetir." };
  return { cause: "O site registrou um comportamento que precisa de contexto.", impact: "O impacto depende da rota e da ação anterior.", recommendation: "Abra os detalhes técnicos e confirme se é um caso isolado antes de tomar uma decisão." };
}

function adminNote(event: SiteEventView) {
  const admin = event.context?.admin;
  if (typeof admin !== "object" || admin === null || Array.isArray(admin)) return null;
  const record = admin as JsonRecord;
  return typeof record.note === "string" && record.note ? record.note : null;
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
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [scope, setScope] = useState<"open" | "fatal" | "all">("open");

  const groups = useMemo(() => {
    const filtered = events.filter((event) => scope === "all" || (scope === "fatal" ? event.severity === "fatal" : event.status === "new" || event.status === "reviewed"));
    const grouped = new Map<string, EventGroup>();
    for (const event of filtered) {
      const key = eventFingerprint(event);
      const current = grouped.get(key);
      if (current) current.ids.push(event.id);
      else grouped.set(key, { key, event, ids: [event.id] });
    }
    return Array.from(grouped.values());
  }, [events, scope]);

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

  async function updateStatus(ids: string[], status: SiteEventStatus, note: string) {
    setSavingId(ids[0] ?? "");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", ids, status, note }),
      });
      const data = (await response.json()) as { events?: SiteEventView[]; error?: string };
      if (!response.ok || !Array.isArray(data.events)) {
        throw new Error(data.error || "Não foi possível atualizar o evento.");
      }
      const updates = new Map(data.events.map((event) => [event.id, event]));
      setEvents((current) =>
        current.map((event) => updates.get(event.id) ?? event)
      );
      setNotice(`${ids.length > 1 ? `${ids.length} ocorrências` : "Ocorrência"} atualizada${ids.length > 1 ? "s" : ""} com registro da decisão.`);
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

        <nav className="mt-7 flex flex-wrap gap-2" aria-label="Filtro de eventos">
          {(["open", "fatal", "all"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setScope(value)} className={`rounded-full border px-4 py-2 text-xs font-bold ${scope === value ? "border-[#241b18] bg-[#241b18] text-[#fff7ed]" : "border-[#cdbbab] bg-white/60 text-[#604b42]"}`}>
              {value === "open" ? "Pendentes" : value === "fatal" ? "Somente fatais" : "Todos os eventos"}
            </button>
          ))}
        </nav>

        {notice ? <p className="mt-6 rounded-xl border border-[#afd2c3] bg-[#eefaf5] px-4 py-3 text-sm text-[#28604f]" role="status">{notice}</p> : null}
        {error ? <p className="mt-6 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm text-[#8a4038]" role="alert">{error}</p> : null}

        <section className="mt-7 space-y-4" aria-live="polite">
          {loading ? <div className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-8 text-sm text-[#765f54]">Carregando eventos…</div> : null}
          {!loading && groups.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cdbbab] bg-white/52 p-10 text-center text-sm text-[#765f54]">Não há eventos neste filtro.</div> : null}
          {groups.map(({ key, event, ids }) => {
            const analysis = getAnalysis(event);
            const isExpanded = expandedAnalysis === key;
            const note = adminNote(event);
            return (
            <article key={key} className="rounded-2xl border border-[#dfd0c4] bg-white/82 p-5 shadow-[0_16px_40px_rgba(75,46,30,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#806b60]">
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${SEVERITY_CLASSES[event.severity]}`}>{event.severity.toUpperCase()}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${STATUS_CLASSES[event.status]}`}>{STATUS_LABELS[event.status]}</span>
                    <span>{getPlainSummary(event)}</span>
                    <span>·</span>
                    <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
                    {ids.length > 1 ? <span className="rounded-full bg-[#f1e8df] px-2 py-1 font-bold text-[#604b42]">{ids.length} repetições</span> : null}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-[#2c1f1b]">{event.path || event.route || "Rota não informada"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#55453e]">{analysis.cause}</p>
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
                  {isExpanded ? <section className="mt-4 rounded-xl border border-[#b9d9d0] bg-[#eef8f4] p-4 text-sm leading-6 text-[#315d56]" aria-label="Análise do evento"><p><strong>Impacto:</strong> {analysis.impact}</p><p className="mt-2"><strong>Próximo passo:</strong> {analysis.recommendation}</p>{note ? <p className="mt-2"><strong>Decisão registrada:</strong> {note}</p> : null}</section> : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[18rem] lg:justify-end">
                  <button type="button" onClick={() => { setExpandedAnalysis(isExpanded ? null : key); void updateStatus(ids, "reviewed", "Investigado no painel: causa, impacto e próximo passo revisados."); }} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#bdd7d0] bg-[#eff8f4] px-4 py-2.5 text-xs font-bold text-[#35685c] disabled:opacity-50"><Eye size={15} />Analisar</button>
                  {event.status !== "resolved" ? <button type="button" onClick={() => { if (window.confirm(`Confirmar que ${ids.length > 1 ? "estas ocorrências" : "esta ocorrência"} foi corrigida${ids.length > 1 ? "s" : ""}?`)) void updateStatus(ids, "resolved", "Correção confirmada após verificação da versão publicada."); }} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full bg-[#2f7762] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Confirmar correção</button> : null}
                  {event.status !== "ignored" ? <button type="button" onClick={() => { if (window.confirm(`Arquivar ${ids.length > 1 ? "estas ocorrências" : "esta ocorrência"} como ruído ou caso sem ação?`)) void updateStatus(ids, "ignored", "Arquivado como caso isolado ou sem ação necessária."); }} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#d1b8b0] bg-[#fff7f5] px-4 py-2.5 text-xs font-bold text-[#7b4f47] disabled:opacity-50"><XCircle size={15} />Arquivar</button> : null}
                  {event.status !== "new" ? <button type="button" onClick={() => void updateStatus(ids, "new", "Reaberto para nova investigação.")} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white px-4 py-2.5 text-xs font-bold text-[#604b42] disabled:opacity-50"><RotateCcw size={15} />Reabrir</button> : null}
                </div>
              </div>
            </article>
          )})}
        </section>
      </div>
    </main>
  );
}
