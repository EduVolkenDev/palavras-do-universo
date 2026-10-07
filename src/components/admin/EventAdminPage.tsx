"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  RotateCcw,
  Smartphone,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminPageFrame from "@/components/admin/AdminPageFrame";

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

function isMarketingEvent(event: SiteEventView) {
  return event.event_type.startsWith("marketing.");
}

function isProbableNoiseEvent(event: SiteEventView) {
  if (event.event_type === "ux.scroll_jump_to_top") return true;
  if (event.event_type !== "asset.load_error") return false;

  const tagName = typeof event.context?.tagName === "string" ? event.context.tagName.toLowerCase() : "";
  const source = typeof event.context?.source === "string" ? event.context.source.toLowerCase() : "";
  return (
    ["script", "link", "style"].includes(tagName) ||
    (tagName !== "" && tagName !== "img" && tagName !== "video") ||
    /cloudflareinsights\.com|googletagmanager|google-analytics/.test(source)
  );
}

function isActionableEvent(event: SiteEventView) {
  return !isMarketingEvent(event) && !isProbableNoiseEvent(event);
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
  if (event.event_type === "asset.load_error") return isProbableNoiseEvent(event) ? "Falha de recurso que não é imagem/vídeo — provável ruído." : "Uma imagem ou vídeo não carregou.";
  if (event.event_type === "ux.scroll_jump_to_top") return "Possível reposicionamento de rota ou gesto de rolagem.";
  if (event.event_type === "marketing.cta_click") return "Uma pessoa clicou em um convite para conhecer a oferta.";
  if (event.event_type === "marketing.landing_view") return "Uma pessoa visitou uma página de campanha.";
  return event.message || "Evento registrado pelo site.";
}

function getAnalysis(event: SiteEventView) {
  const detail = `${event.error_name ?? ""} ${event.message ?? ""}`;
  if (isMarketingEvent(event)) return { cause: "Este é um evento de medição de campanha, não um erro técnico.", impact: "Ajuda a entender visitas e cliques; por si só, não indica falha para a pessoa.", recommendation: "Consulte estes dados na análise da campanha. Não é necessário corrigir ou arquivar como incidente." };
  if (isProbableNoiseEvent(event)) return { cause: event.event_type === "asset.load_error" ? "O evento veio de script, link ou outro recurso que não é imagem/vídeo; o coletor antigo o classificava incorretamente como falha visual." : "O registro pode ser uma rolagem intencional ou a página reposicionada durante uma troca de rota.", impact: "Este registro, isoladamente, não confirma perda de conteúdo nem bloqueio da experiência.", recommendation: "A coleta foi ajustada para evitar recorrência. Use os detalhes técnicos apenas como histórico; não conte como falha visual confirmada." };
  if (event.event_type === "asset.load_error") return { cause: "O navegador informou falha ao carregar uma imagem ou vídeo.", impact: "A mídia pode estar ausente nessa rota e dispositivo; o restante da página pode continuar utilizável.", recommendation: "Confira a URL da mídia e reproduza na mesma rota/dispositivo antes de considerar o caso resolvido." };
  if (event.event_type === "react.error_boundary" || event.event_type === "browser.error" || event.event_type === "browser.unhandled_rejection") return { cause: detail.trim() ? `O navegador registrou uma exceção (${event.error_name || event.event_type}); a causa precisa ser confirmada pela rota e pelo stack.` : "O navegador registrou uma exceção sem detalhe suficiente para identificar a causa.", impact: "Pode interromper a parte da interface que falhou; os dados disponíveis não confirmam se a falha ainda acontece.", recommendation: "Abra o stack e tente reproduzir a mesma ação na versão atual. Só confirme como resolvido após validar o fluxo afetado." };
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
  const [scope, setScope] = useState<"open" | "fatal" | "marketing" | "noise" | "all">("open");

  const groups = useMemo(() => {
    const filtered = events.filter((event) => {
      if (scope === "all") return true;
      if (scope === "fatal") return event.severity === "fatal" && isActionableEvent(event);
      if (scope === "marketing") return isMarketingEvent(event);
      if (scope === "noise") return isProbableNoiseEvent(event);
      return isActionableEvent(event) && (event.status === "new" || event.status === "reviewed");
    });
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
      open: events.filter((event) => isActionableEvent(event) && (event.status === "new" || event.status === "reviewed")).length,
      severe: events.filter((event) => isActionableEvent(event) && (event.severity === "error" || event.severity === "fatal")).length,
      marketing: events.filter(isMarketingEvent).length,
      noise: events.filter(isProbableNoiseEvent).length,
      mobile: events.filter(isMobileEvent).length,
    }),
    [events]
  );

  const summaryCards: Array<{ label: string; value: number; detail: string; tone: string; Icon: LucideIcon }> = [
    { label: "Carregados", value: summary.total, detail: "eventos recentes", tone: "#73549b", Icon: Eye },
    { label: "A revisar", value: summary.open, detail: "incidentes técnicos", tone: "#a97935", Icon: Clock3 },
    { label: "Erros técnicos", value: summary.severe, detail: "erros e fatais", tone: "#a34c4c", Icon: AlertTriangle },
    { label: "Métricas", value: summary.marketing, detail: "visitas e conversões", tone: "#4d8190", Icon: Eye },
    { label: "Ruído provável", value: summary.noise, detail: "separado para contexto", tone: "#8b817b", Icon: XCircle },
    { label: "Mobile", value: summary.mobile, detail: "telas até 760 px", tone: "#477e70", Icon: Smartphone },
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
    <AdminPageFrame
      path="/admin/eventos"
      eyebrow="Experiência · Observabilidade"
      title="Saúde da experiência"
      description="Uma visão clara do que precisa de atenção — sem confundir sinais técnicos com o movimento natural das campanhas."
      ownerEmail={ownerEmail}
      hasSupabase={hasSupabase}
      actions={<button type="button" onClick={() => void loadEvents()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f0d79f] px-4 py-2 text-sm font-bold text-[#2b2033] shadow-[0_8px_24px_rgba(6,4,11,0.18)] transition hover:bg-[#f7e4b7] disabled:opacity-50" disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Atualizar</button>}
    >
        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-label="Resumo dos eventos">
          {summaryCards.map(({ label, value, detail, tone, Icon }) => (
            <div key={label} className="group relative overflow-hidden rounded-[23px] border border-[#e3d5c5] bg-[#fffaf3]/85 p-4 shadow-[0_12px_34px_rgba(75,46,30,0.055)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c4a66f]/60 hover:shadow-[0_18px_38px_rgba(75,46,30,0.09)] sm:p-5">
              <span className="absolute inset-x-0 top-0 h-[2px] opacity-75" style={{ backgroundColor: tone }} aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 text-[#806b60]">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] sm:text-[11px]">{label}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border border-[#e6d8c7] bg-white/70" style={{ color: tone }}><Icon size={15} /></span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <strong className="font-serif text-3xl font-semibold leading-none tracking-tight text-[#2c1f1b] sm:text-[2.1rem]">{value}</strong>
                <span className="mb-0.5 text-right text-[10px] leading-4 text-[#9a887d]">{detail}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[26px] border border-[#e1d2c1] bg-white/45 p-4 shadow-[0_14px_40px_rgba(75,46,30,0.035)] backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#987a4c]">Visão operacional</p>
              <h2 className="brand-serif mt-1 text-2xl font-semibold text-[#302332] sm:text-[1.75rem]">O que estamos vendo</h2>
            </div>
            <p className="max-w-2xl text-xs leading-5 text-[#806f65]">A revisar reúne incidentes técnicos pendentes. Métricas e ruído provável ficam separados. Exibindo até 150 registros mais recentes.</p>
          </div>

          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filtro de eventos">
            {(["open", "fatal", "marketing", "noise", "all"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={scope === value} onClick={() => setScope(value)} className={`min-h-10 rounded-full border px-4 py-2 text-xs font-bold transition ${scope === value ? "border-[#382747] bg-[#382747] text-[#fff8ec] shadow-[0_6px_16px_rgba(56,39,71,0.18)]" : "border-[#d7c8b8] bg-[#fffaf3]/70 text-[#604b42] hover:border-[#b59561] hover:bg-white"}`}>
                {value === "open" ? "A revisar" : value === "fatal" ? "Fatais técnicos" : value === "marketing" ? "Métricas de campanha" : value === "noise" ? "Ruído provável" : "Todos os eventos"}
              </button>
            ))}
          </nav>
        </section>

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
            <article key={key} className="relative overflow-hidden rounded-[26px] border border-[#e1d2c1] bg-[linear-gradient(125deg,rgba(255,252,246,0.98),rgba(255,255,255,0.82))] p-5 shadow-[0_16px_40px_rgba(75,46,30,0.055)] transition hover:border-[#cbb27e]/70 hover:shadow-[0_20px_48px_rgba(75,46,30,0.09)] sm:p-6">
              <span className="absolute bottom-5 left-0 top-5 w-[3px] rounded-r-full bg-[#c9ad73]" aria-hidden="true" />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#806b60]">
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${SEVERITY_CLASSES[event.severity]}`}>{event.severity.toUpperCase()}</span>
                    {isMarketingEvent(event) ? <span className="rounded-full border border-[#c8d8da] bg-[#eef8fa] px-2.5 py-1 font-bold text-[#34646b]">Métrica</span> : isProbableNoiseEvent(event) ? <span className="rounded-full border border-[#d7d4cf] bg-white px-2.5 py-1 font-bold text-[#6f625a]">Ruído provável</span> : <span className={`rounded-full border px-2.5 py-1 font-bold ${STATUS_CLASSES[event.status]}`}>{STATUS_LABELS[event.status]}</span>}
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
                  <button type="button" onClick={() => setExpandedAnalysis(isExpanded ? null : key)} className="inline-flex items-center gap-2 rounded-full border border-[#bdd7d0] bg-[#eff8f4] px-4 py-2.5 text-xs font-bold text-[#35685c]"><Eye size={15} />{isExpanded ? "Fechar análise" : "Ver análise"}</button>
                  {isActionableEvent(event) ? <>
                    <button type="button" onClick={() => void updateStatus(ids, "reviewed", "Investigado no painel: causa, impacto e próximo passo revisados.")} disabled={savingId === event.id || event.status === "reviewed"} className="inline-flex items-center gap-2 rounded-full border border-[#bdd7d0] bg-[#eff8f4] px-4 py-2.5 text-xs font-bold text-[#35685c] disabled:opacity-50">Em análise</button>
                    {event.status !== "resolved" ? <button type="button" onClick={() => { if (window.confirm(`Confirmar que ${ids.length > 1 ? "estas ocorrências" : "esta ocorrência"} foi corrigida${ids.length > 1 ? "s" : ""}?`)) void updateStatus(ids, "resolved", "Correção confirmada após validação do fluxo afetado."); }} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full bg-[#2f7762] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Confirmar correção</button> : null}
                    {event.status !== "ignored" ? <button type="button" onClick={() => { if (window.confirm(`Arquivar ${ids.length > 1 ? "estas ocorrências" : "esta ocorrência"} como sem ação necessária?`)) void updateStatus(ids, "ignored", "Arquivado após revisão como caso sem ação necessária."); }} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#d1b8b0] bg-[#fff7f5] px-4 py-2.5 text-xs font-bold text-[#7b4f47] disabled:opacity-50"><XCircle size={15} />Arquivar</button> : null}
                    {event.status !== "new" ? <button type="button" onClick={() => void updateStatus(ids, "new", "Reaberto para nova investigação.")} disabled={savingId === event.id} className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white px-4 py-2.5 text-xs font-bold text-[#604b42] disabled:opacity-50"><RotateCcw size={15} />Reabrir</button> : null}
                  </> : null}
                </div>
              </div>
            </article>
          )})}
        </section>
    </AdminPageFrame>
  );
}
