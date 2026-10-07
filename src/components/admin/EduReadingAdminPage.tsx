"use client";

import {
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Mail,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ReadingRequest = {
  id: string;
  created_at: string;
  offer_title: string;
  client_name: string;
  client_email: string;
  intention: string;
  currency: "BRL" | "GBP";
  amount_cents: number;
  date_key: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: "requested" | "confirmed_pending_payment" | "payment_pending" | "paid" | "declined" | "expired" | "cancelled";
  payment_url: string | null;
};

type WaitlistEntry = {
  id: string;
  email: string;
  locale: "pt-BR" | "en";
  created_at: string;
};

const STATUS_LABELS: Record<ReadingRequest["status"], string> = {
  requested: "Aguardando confirmação",
  confirmed_pending_payment: "Confirmado · preparando pagamento",
  payment_pending: "Aguardando pagamento",
  paid: "Pago",
  declined: "Recusado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

const STATUS_CLASSES: Record<ReadingRequest["status"], string> = {
  requested: "border-[#d8c28e] bg-[#fff8df] text-[#7b6336]",
  confirmed_pending_payment: "border-[#c9b8e0] bg-[#f4effb] text-[#5e4778]",
  payment_pending: "border-[#bdd7d0] bg-[#eff8f4] text-[#35685c]",
  paid: "border-[#9ec9b8] bg-[#e4f6ee] text-[#1c6650]",
  declined: "border-[#d9c9c6] bg-[#f8f0ee] text-[#795c56]",
  expired: "border-[#d9c9c6] bg-[#f8f0ee] text-[#795c56]",
  cancelled: "border-[#d9c9c6] bg-[#f8f0ee] text-[#795c56]",
};

function formatDate(request: ReadingRequest) {
  const date = new Date(`${request.date_key}T${request.start_time.slice(0, 5)}:00Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: request.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatPrice(amount: number, currency: ReadingRequest["currency"]) {
  return currency === "GBP"
    ? `£${(amount / 100).toFixed(2)}`
    : `R$${(amount / 100).toFixed(2).replace(".", ",")}`;
}

export default function EduReadingAdminPage({
  ownerEmail,
  hasSupabase,
}: {
  ownerEmail: string;
  hasSupabase: boolean;
}) {
  const [requests, setRequests] = useState<ReadingRequest[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/edu-reading-requests", { cache: "no-store" });
      const data = (await response.json()) as { requests?: ReadingRequest[]; waitlist?: WaitlistEntry[]; error?: string };
      if (!response.ok || !Array.isArray(data.requests) || !Array.isArray(data.waitlist)) {
        throw new Error(data.error || "Não foi possível carregar os pedidos.");
      }
      setRequests(data.requests);
      setWaitlist(data.waitlist);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function act(id: string, action: "confirm" | "decline" | "cancel") {
    setActionId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/edu-reading-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = (await response.json()) as { request?: ReadingRequest; error?: string };
      if (!response.ok || !data.request) throw new Error(data.error || "Não foi possível atualizar o pedido.");
      setRequests((current) => current.map((item) => item.id === id ? data.request! : item));
      setNotice(action === "confirm" ? "Atendimento confirmado. Copie o link e envie ao cliente." : "Status atualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o pedido.");
    } finally {
      setActionId("");
    }
  }

  async function copyPaymentLink(url: string) {
    await navigator.clipboard.writeText(url);
    setNotice("Link de pagamento copiado.");
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f0e8] px-3 py-6 text-[#241b18] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#d8c8ba] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8e674d]">Palavras do Universo · Administração</p>
            <h1 className="brand-serif mt-2 break-words text-3xl leading-tight text-[#2c1f1b] sm:text-4xl sm:leading-none">Leituras com Edu</h1>
            <h1 className="brand-serif mt-2 break-words text-3xl leading-tight text-[#2c1f1b] sm:text-4xl sm:leading-none">Leituras com Edu</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f5d55]">Acompanhe pedidos de atendimento e a lista de espera. Confirme o horário antes de criar o link Stripe.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/eventos" className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white/60 px-4 py-2 text-sm font-semibold text-[#604b42]">Eventos <ExternalLink size={14} /></Link>
            <button type="button" onClick={() => void loadRequests()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[#241b18] px-4 py-2 text-sm font-semibold text-[#fff7ed] disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Atualizar</button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#765f54]"><ShieldCheck size={15} className="text-[#3f786a]" />Acesso de proprietário: {ownerEmail || "conta autorizada"}{!hasSupabase ? " · Supabase indisponível neste ambiente" : ""}</div>
        {notice ? <p className="mt-6 rounded-xl border border-[#afd2c3] bg-[#eefaf5] px-4 py-3 text-sm text-[#28604f]" role="status">{notice}</p> : null}
        {error ? <p className="mt-6 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm text-[#8a4038]" role="alert">{error}</p> : null}

        <section className="mt-7 space-y-4" aria-live="polite">
          {loading ? <div className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-8 text-sm text-[#765f54]">Carregando pedidos…</div> : null}
          {!loading && requests.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cdbbab] bg-white/52 p-10 text-center text-sm text-[#765f54]">Ainda não há pedidos de atendimento.</div> : null}
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-[#dfd0c4] bg-white/82 p-5 shadow-[0_16px_40px_rgba(75,46,30,0.06)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#806b60]"><span className={`rounded-full border px-2.5 py-1 font-bold ${STATUS_CLASSES[request.status]}`}>{STATUS_LABELS[request.status]}</span><time dateTime={request.created_at}>Pedido recebido {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.created_at))}</time></div>
                  <h2 className="mt-4 text-xl font-semibold text-[#2c1f1b]">{request.client_name} · {request.offer_title}</h2>
                  <p className="mt-2 text-sm font-semibold capitalize text-[#6f5134]">{formatDate(request)} · {request.start_time.slice(0, 5)}–{request.end_time.slice(0, 5)} · {request.timezone}</p>
                  <p className="mt-2 text-sm text-[#765f54]">{request.client_email} · {formatPrice(request.amount_cents, request.currency)}</p>
                  {request.intention ? <p className="mt-4 break-words whitespace-pre-line text-sm leading-6 text-[#4f403a]">“{request.intention}”</p> : null}
                </div>
                <div className="flex w-full min-w-0 flex-wrap gap-2 lg:w-auto lg:max-w-[20rem] lg:justify-end">
                  {request.status === "requested" ? <><button type="button" onClick={() => void act(request.id, "confirm")} disabled={actionId === request.id} className="inline-flex items-center gap-2 rounded-full bg-[#2f7762] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Confirmar e gerar link</button><button type="button" onClick={() => void act(request.id, "decline")} disabled={actionId === request.id} className="inline-flex items-center gap-2 rounded-full border border-[#d1b8b0] bg-[#fff7f5] px-4 py-2.5 text-xs font-bold text-[#7b4f47] disabled:opacity-50"><XCircle size={15} />Recusar</button></> : null}
                  {request.status === "payment_pending" && request.payment_url ? <><button type="button" onClick={() => void copyPaymentLink(request.payment_url!)} className="inline-flex items-center gap-2 rounded-full bg-[#241b18] px-4 py-2.5 text-xs font-bold text-white"><Clipboard size={15} />Copiar link</button><a href={request.payment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#cdbbab] bg-white px-4 py-2.5 text-xs font-bold text-[#604b42]">Abrir checkout <ExternalLink size={14} /></a></> : null}
                  {request.status === "paid" ? <span className="inline-flex items-center gap-2 rounded-full bg-[#e4f6ee] px-4 py-2.5 text-xs font-bold text-[#1c6650]"><CheckCircle2 size={15} />Pagamento confirmado</span> : null}
                  {["confirmed_pending_payment", "payment_pending"].includes(request.status) ? <button type="button" onClick={() => void act(request.id, "cancel")} disabled={actionId === request.id} className="inline-flex items-center gap-2 rounded-full border border-[#d1b8b0] bg-[#fff7f5] px-4 py-2.5 text-xs font-bold text-[#7b4f47] disabled:opacity-50"><XCircle size={15} />Cancelar</button> : null}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 border-t border-[#d8c8ba] pt-8" aria-live="polite" aria-labelledby="edu-waitlist-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8e674d]">Abertura da agenda</p>
              <h2 id="edu-waitlist-heading" className="brand-serif mt-2 text-3xl text-[#2c1f1b]">Lista de espera</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f5d55]">Envie o primeiro aviso a estes contatos quando as leituras individuais estiverem prontas.</p>
            </div>
            {!loading ? <span className="w-fit rounded-full border border-[#cdbbab] bg-white/60 px-3 py-1.5 text-xs font-bold text-[#604b42]">{waitlist.length} {waitlist.length === 1 ? "contato" : "contatos"}</span> : null}
          </div>

          <div className="mt-5 space-y-3">
            {loading ? <div className="rounded-2xl border border-[#dfd0c4] bg-white/72 p-6 text-sm text-[#765f54]">Carregando lista de espera…</div> : null}
            {!loading && waitlist.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cdbbab] bg-white/52 p-8 text-center text-sm text-[#765f54]">Ainda não há contatos na lista de espera.</div> : null}
            {waitlist.map((entry) => (
              <article key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-[#dfd0c4] bg-white/82 p-4 shadow-[0_12px_32px_rgba(75,46,30,0.05)] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#2c1f1b]"><Mail size={15} className="shrink-0 text-[#8e674d]" />{entry.email}</p>
                  <p className="mt-1 text-xs text-[#765f54]">Entrou em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.created_at))} · {entry.locale === "en" ? "inglês" : "português"}</p>
                </div>
                <a href={`mailto:${entry.email}`} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#cdbbab] bg-white px-4 py-2 text-xs font-bold text-[#604b42]">Preparar e-mail <ExternalLink size={14} /></a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
