"use client";

import {
  Archive,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageCircleHeart,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FeedbackStatus = "new" | "reviewed" | "published" | "archived";

type FeedbackView = {
  id: string;
  created_at: string;
  source: "reading" | "footer";
  resonance_score: number | null;
  message: string;
  display_name: string | null;
  allow_testimonial: boolean;
  locale: string;
  status: FeedbackStatus;
  reading_id: string | null;
  user_id: string | null;
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Aguardando revisão",
  reviewed: "Em revisão",
  published: "Aprovado",
  archived: "Recusado / arquivado",
};

const STATUS_CLASSES: Record<FeedbackStatus, string> = {
  new: "border-[#d8c28e] bg-[#fff8df] text-[#7b6336]",
  reviewed: "border-[#bdd7d0] bg-[#eff8f4] text-[#35685c]",
  published: "border-[#9ec9b8] bg-[#e4f6ee] text-[#1c6650]",
  archived: "border-[#d9c9c6] bg-[#f8f0ee] text-[#795c56]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function FeedbackAdminPage({
  ownerEmail,
  hasSupabase,
}: {
  ownerEmail: string;
  hasSupabase: boolean;
}) {
  const [feedback, setFeedback] = useState<FeedbackView[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const summary = useMemo(
    () => ({
      total: feedback.length,
      pending: feedback.filter((item) => item.status === "new").length,
      published: feedback.filter((item) => item.status === "published").length,
      testimonials: feedback.filter(
        (item) => item.status === "published" && item.allow_testimonial
      ).length,
    }),
    [feedback]
  );

  const summaryCards: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    { label: "Total", value: summary.total, Icon: MessageCircleHeart },
    { label: "Pendentes", value: summary.pending, Icon: Clock3 },
    { label: "Aprovados", value: summary.published, Icon: CheckCircle2 },
    { label: "Com autorização", value: summary.testimonials, Icon: ShieldCheck },
  ];

  async function loadFeedback() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/feedback", { cache: "no-store" });
      const data = (await response.json()) as {
        feedback?: FeedbackView[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(data.feedback)) {
        throw new Error(data.error || "Não foi possível carregar os feedbacks.");
      }
      setFeedback(data.feedback);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os feedbacks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeedback();
  }, []);

  async function updateStatus(id: string, status: FeedbackStatus) {
    setSavingId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", id, status }),
      });
      const data = (await response.json()) as { feedback?: FeedbackView; error?: string };
      if (!response.ok || !data.feedback) {
        throw new Error(data.error || "Não foi possível atualizar o feedback.");
      }
      setFeedback((current) =>
        current.map((item) => (item.id === id ? data.feedback! : item))
      );
      setNotice(
        status === "published"
          ? "Feedback aprovado. Ele está liberado para uso editorial."
          : status === "archived"
            ? "Feedback arquivado e retirado da fila editorial."
            : "Status atualizado."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o feedback.");
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
            <h1 className="brand-serif mt-2 text-4xl leading-none text-[#2c1f1b]">Feedbacks recebidos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f5d55]">
              Revise cada mensagem antes de qualquer uso público. Nada é publicado automaticamente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/codigos" className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white/60 px-4 py-2 text-sm font-semibold text-[#604b42]">
              Códigos
              <ExternalLink size={14} />
            </Link>
            <button type="button" onClick={() => void loadFeedback()} className="inline-flex items-center gap-2 rounded-full bg-[#241b18] px-4 py-2 text-sm font-semibold text-[#fff7ed] disabled:opacity-50" disabled={loading}>
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

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo dos feedbacks">
          {summaryCards.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-4 shadow-[0_12px_34px_rgba(75,46,30,0.06)]">
              <div className="flex items-center justify-between gap-3 text-[#805f4e]"><span className="text-xs font-bold uppercase tracking-[0.14em]">{label}</span><Icon size={17} /></div>
              <strong className="mt-3 block text-3xl font-semibold text-[#2c1f1b]">{value}</strong>
            </div>
          ))}
        </section>

        {notice ? <p className="mt-6 rounded-xl border border-[#afd2c3] bg-[#eefaf5] px-4 py-3 text-sm text-[#28604f]" role="status">{notice}</p> : null}
        {error ? <p className="mt-6 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm text-[#8a4038]" role="alert">{error}</p> : null}

        <section className="mt-7 space-y-4" aria-live="polite">
          {loading ? <div className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-8 text-sm text-[#765f54]">Carregando feedbacks…</div> : null}
          {!loading && feedback.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cdbbab] bg-white/52 p-10 text-center text-sm text-[#765f54]">Ainda não há feedbacks para revisar.</div> : null}
          {feedback.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#dfd0c4] bg-white/82 p-5 shadow-[0_16px_40px_rgba(75,46,30,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#806b60]">
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${STATUS_CLASSES[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                    <span>{item.source === "reading" ? "Após a leitura" : "Final da página"}</span>
                    <span>·</span>
                    <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                    {item.resonance_score ? <span>· Nota {item.resonance_score}/5</span> : null}
                  </div>
                  <blockquote className="mt-4 whitespace-pre-line text-lg leading-8 text-[#342622]">“{item.message}”</blockquote>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#806b60]">
                    <span>{item.allow_testimonial ? "Autorizou uso editorial" : "Uso editorial não autorizado"}</span>
                    {item.display_name ? <span>Nome: {item.display_name}</span> : null}
                    <span>Idioma: {item.locale}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[18rem] lg:justify-end">
                  {item.status !== "published" ? <button type="button" onClick={() => void updateStatus(item.id, "published")} disabled={savingId === item.id} className="inline-flex items-center gap-2 rounded-full bg-[#2f7762] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Aprovar</button> : null}
                  {item.status !== "archived" ? <button type="button" onClick={() => void updateStatus(item.id, "archived")} disabled={savingId === item.id} className="inline-flex items-center gap-2 rounded-full border border-[#d1b8b0] bg-[#fff7f5] px-4 py-2.5 text-xs font-bold text-[#7b4f47] disabled:opacity-50"><Archive size={15} />Recusar</button> : null}
                  {item.status === "archived" ? <button type="button" onClick={() => void updateStatus(item.id, "new")} disabled={savingId === item.id} className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white px-4 py-2.5 text-xs font-bold text-[#604b42] disabled:opacity-50"><RotateCcw size={15} />Reabrir</button> : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
