"use client";

import { CalendarDays, CheckCircle2, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  EDU_READING_AVAILABILITY,
  EDU_READING_OFFERS,
  getUpcomingEduReadingAvailability,
} from "@/lib/edu-reading-offers";
import { formatPriceCents, type ProductCurrency } from "@/lib/product/pricing";
import { useI18n } from "@/components/I18nProvider";

type BookingStep = 1 | 2 | 3;
type SelectedSlot = { dateKey: string; dayLabel: string; time: string };

export function EduReadingBookingPanel() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const isEnglish = locale === "en";
  const checkoutResult = searchParams.get("booking");
  const emailLabel = isEnglish ? "Email" : "E-mail";
  const [currency, setCurrency] = useState<ProductCurrency>(isEnglish ? "GBP" : "BRL");
  const [step, setStep] = useState<BookingStep>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [intention, setIntention] = useState("");
  const [offerId, setOfferId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const selectedOffer = useMemo(
    () => EDU_READING_OFFERS.find((offer) => offer.id === offerId) ?? null,
    [offerId]
  );
  const availabilityDays = useMemo(
    () => selectedOffer ? getUpcomingEduReadingAvailability(selectedOffer.id, locale) : [],
    [locale, selectedOffer]
  );

  function continueToReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() && email.trim()) setStep(2);
  }

  function selectOffer(id: string) {
    setOfferId(id);
    setSelectedSlot(null);
    setRequestError("");
    setRequestSuccess(false);
  }

  function continueToDates() {
    if (selectedOffer) setStep(3);
  }

  async function submitRequest() {
    if (!selectedOffer || !selectedSlot || submittingRequest || requestSuccess) return;

    setSubmittingRequest(true);
    setRequestError("");
    try {
      const response = await fetch("/api/edu-reading/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          intention,
          offerId: selectedOffer.id,
          currency,
          dateKey: selectedSlot.dateKey,
          startTime: selectedSlot.time,
          locale,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || (isEnglish ? "Could not send your request." : "Não foi possível enviar seu pedido."));
      }
      setRequestSuccess(true);
    } catch (caught) {
      setRequestError(caught instanceof Error ? caught.message : (isEnglish ? "Could not send your request." : "Não foi possível enviar seu pedido."));
    } finally {
      setSubmittingRequest(false);
    }
  }

  return (
    <section id="agendar" className="scroll-mt-24 bg-[#ede1cf] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{isEnglish ? "Request your reading" : "Solicite sua leitura"}</p>
          <h2 className="brand-serif mt-4 text-4xl font-semibold sm:text-5xl">{isEnglish ? "Choose your moment with care." : "Escolha seu momento com cuidado."}</h2>
          <p className="mt-5 leading-8 text-[#6f5d55]">{isEnglish ? "First, share only what is needed. Then choose the reading and an available time that fits your question." : "Primeiro, compartilhe apenas o necessário. Depois, escolha a leitura e um horário disponível que combinem com a sua pergunta."}</p>
          {checkoutResult === "success" ? <p className="mt-5 rounded-xl border border-[#afd2c3] bg-[#eefaf5] px-4 py-3 text-sm leading-6 text-[#28604f]" role="status">{isEnglish ? "Payment submitted. Edu will keep your confirmed time and contact you with the next details." : "Pagamento enviado. O Edu vai manter seu horário confirmado e entrar em contato com os próximos detalhes."}</p> : null}
          {checkoutResult === "cancelled" ? <p className="mt-5 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm leading-6 text-[#8a4038]" role="status">{isEnglish ? "Checkout was cancelled. Your confirmed request remains available for payment." : "O checkout foi cancelado. Seu pedido confirmado continua disponível para pagamento."}</p> : null}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[1.5rem] bg-[#241b18] p-6 text-[#fff7e8]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f4d58d]">{isEnglish ? "Your path" : "Seu caminho"}</p>
            <ol className="mt-6 space-y-5 text-sm">
              {[
                [1, isEnglish ? "Your details" : "Suas informações"],
                [2, isEnglish ? "Your reading" : "Sua tirada"],
                [3, isEnglish ? "Date and time" : "Data e horário"],
              ].map(([number, label]) => (
                <li key={String(number)} className={`flex items-center gap-3 ${step === number ? "text-[#f4d58d]" : "text-[#d8ccc0]"}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full border ${step === number ? "border-[#f4d58d] bg-[#f4d58d] text-[#241b18]" : "border-white/30"}`}>{number}</span>
                  {label}
                </li>
              ))}
            </ol>
            <div className="mt-10 border-t border-white/15 pt-5 text-xs leading-6 text-[#d8ccc0]">
              <LockKeyhole className="mb-2" size={16} />
              {isEnglish ? "No payment is collected before Edu confirms the appointment. Payment instructions come after confirmation." : "Nenhum pagamento é cobrado antes de o Edu confirmar o atendimento. As instruções de pagamento vêm depois da confirmação."}
            </div>
          </aside>

          <div className="rounded-[1.5rem] border border-[#d8c3a6] bg-[#fffaf2] p-6 sm:p-8">
            {step === 1 ? (
              <form onSubmit={continueToReading}>
                <div className="flex items-center gap-3"><Sparkles className="text-[#9d753e]" size={20} /><h3 className="brand-serif text-3xl font-semibold">{isEnglish ? "A little about you" : "Um pouco sobre você"}</h3></div>
                <p className="mt-3 text-sm leading-7 text-[#6f5d55]">{isEnglish ? "You do not need to tell your full story here." : "Você não precisa contar toda a sua história aqui."}</p>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">{isEnglish ? "First name" : "Seu nome"}<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#d8c3a6] bg-white px-4 font-normal outline-none focus:border-[#8e674d]" /></label>
                  <label className="text-sm font-semibold">{emailLabel}<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#d8c3a6] bg-white px-4 font-normal outline-none focus:border-[#8e674d]" /></label>
                </div>
                <label className="mt-4 block text-sm font-semibold">{isEnglish ? "What would you like to look at? (optional)" : "O que você gostaria de olhar? (opcional)"}<textarea value={intention} onChange={(event) => setIntention(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-[#d8c3a6] bg-white p-4 font-normal outline-none focus:border-[#8e674d]" /></label>
                <button className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-white">{isEnglish ? "Choose a reading" : "Escolher a tirada"}<CalendarDays size={17} /></button>
              </form>
            ) : null}

            {step === 2 ? (
              <div>
                <div className="flex items-center gap-3"><Clock3 className="text-[#9d753e]" size={20} /><h3 className="brand-serif text-3xl font-semibold">{isEnglish ? "Choose your reading" : "Escolha sua tirada"}</h3></div>
                <p className="mt-3 text-sm leading-7 text-[#6f5d55]">{isEnglish ? "The available times change with the reading length, keeping a 30-minute interval between sessions." : "Os horários disponíveis mudam conforme a duração da leitura, mantendo 30 minutos entre os atendimentos."}</p>
                <div className="mt-5 flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8e674d]">{isEnglish ? "Currency" : "Moeda"}</span><div className="rounded-full border border-[#d8c3a6] p-1">{(["BRL", "GBP"] as ProductCurrency[]).map((item) => <button type="button" onClick={() => setCurrency(item)} key={item} className={`rounded-full px-3 py-2 text-xs font-bold ${currency === item ? "bg-[#241b18] text-white" : "text-[#6f5d55]"}`}>{item}</button>)}</div></div>
                <div className="mt-7 grid gap-3">
                  {EDU_READING_OFFERS.map((offer) => (
                    <button type="button" onClick={() => selectOffer(offer.id)} key={offer.id} aria-pressed={offer.id === offerId} className={`w-full rounded-2xl border p-5 text-left transition ${offer.id === offerId ? "border-[#8e674d] bg-[#f7eddb] ring-2 ring-[#d8b77a]/35" : "border-[#d8c3a6] bg-white hover:border-[#8e674d]"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="font-semibold text-[#2c1f1b]">{offer.title}</p><p className="mt-1 text-sm text-[#6f5d55]">{offer.cards} {isEnglish ? "cards" : "cartas"} · {offer.durationLabel}</p></div>
                        <strong className="text-[#6f5134]">{formatPriceCents(offer.priceCents[currency], currency)}</strong>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#6f5d55]">{offer.description[isEnglish ? "en" : "pt"]}</p>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={continueToDates} disabled={!selectedOffer} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{isEnglish ? "See available times" : "Ver horários disponíveis"}<CalendarDays size={17} /></button>
              </div>
            ) : null}

            {step === 3 && selectedOffer ? (
              <div>
                <div className="flex items-center gap-3"><CalendarDays className="text-[#9d753e]" size={20} /><h3 className="brand-serif text-3xl font-semibold">{isEnglish ? "Date and time" : "Data e horário"}</h3></div>
                <p className="mt-3 text-sm leading-7 text-[#6f5d55]">{isEnglish ? `${selectedOffer.title} · ${selectedOffer.durationLabel} · 30-minute interval · ${EDU_READING_AVAILABILITY.timezone}` : `${selectedOffer.title} · ${selectedOffer.durationLabel} · intervalo de 30 minutos · ${EDU_READING_AVAILABILITY.timezone}`}</p>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {availabilityDays.map((day) => (
                    <div key={day.dateKey} className="rounded-2xl border border-[#d8c3a6] bg-white p-4">
                      <h4 className="font-semibold capitalize text-[#2c1f1b]">{day.label}</h4>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {day.slots.map((time) => {
                          const isSelected = selectedSlot?.dateKey === day.dateKey && selectedSlot.time === time;
                          return <button key={`${day.dateKey}-${time}`} type="button" onClick={() => { setSelectedSlot({ dateKey: day.dateKey, dayLabel: day.label, time }); setRequestSuccess(false); setRequestError(""); }} aria-pressed={isSelected} className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${isSelected ? "border-[#8e674d] bg-[#f4d58d] text-[#241b18]" : "border-[#d8c3a6] text-[#6f5134] hover:border-[#8e674d] hover:bg-[#f7eddb]"}`}>{time}</button>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSlot ? (
                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#dceee5] p-4 text-sm text-[#315d51]" role="status">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
                    <div><p className="font-semibold">{requestSuccess ? (isEnglish ? "Request sent" : "Pedido enviado") : (isEnglish ? "Time selected for your request" : "Horário pré-selecionado para o seu pedido")}</p><p className="mt-1">{selectedSlot.dayLabel} · {selectedSlot.time}. {requestSuccess ? (isEnglish ? "Edu will review it and contact you with the payment link after confirmation." : "O Edu vai analisar e entrar em contato com o link de pagamento depois da confirmação.") : (isEnglish ? "This is only a request. After Edu confirms the appointment, payment instructions will be sent." : "Este é apenas um pedido. Depois que o Edu confirmar o atendimento, as instruções de pagamento serão enviadas.")}</p></div>
                  </div>
                ) : null}
                {requestError ? <p className="mt-4 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm leading-6 text-[#8a4038]" role="alert">{requestError}</p> : null}
                {selectedSlot && !requestSuccess ? <button type="button" onClick={() => void submitRequest()} disabled={submittingRequest} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-55">{submittingRequest ? (isEnglish ? "Sending…" : "Enviando…") : (isEnglish ? "Send time request" : "Enviar pedido de horário")}<CheckCircle2 size={17} /></button> : null}
                <p className="mt-5 text-xs leading-6 text-[#806c5d]">{isEnglish ? "These are recurring hours in London time. Selecting a time does not reserve it yet." : "Estes são horários recorrentes no fuso de Londres. Selecionar um horário ainda não o reserva."}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
