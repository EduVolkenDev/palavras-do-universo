"use client";

import { CalendarDays, CheckCircle2, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  EDU_READING_AVAILABILITY,
  EDU_READING_OFFERS,
  type EduReadingAvailabilityDay,
} from "@/lib/edu-reading-offers";
import { formatPriceCents, type ProductCurrency } from "@/lib/product/pricing";
import { useI18n } from "@/components/I18nProvider";

type BookingStep = 1 | 2 | 3;
type SelectedSlot = { dateKey: string; dayLabel: string; time: string };
type AvailabilityState = "idle" | "loading" | "ready" | "error";

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
  const [availabilityDays, setAvailabilityDays] = useState<EduReadingAvailabilityDay[]>([]);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>("idle");
  const [availabilityError, setAvailabilityError] = useState("");
  const selectedOffer = useMemo(
    () => EDU_READING_OFFERS.find((offer) => offer.id === offerId) ?? null,
    [offerId]
  );
  useEffect(() => {
    if (!selectedOffer || step !== 3) return;

    const controller = new AbortController();
    setAvailabilityState("loading");
    setAvailabilityError("");
    setAvailabilityDays([]);

    void fetch(`/api/edu-reading/availability?offerId=${encodeURIComponent(selectedOffer.id)}&locale=${encodeURIComponent(locale)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean;
          availability?: EduReadingAvailabilityDay[];
          error?: string;
        };
        if (!response.ok || !data.ok || !Array.isArray(data.availability)) {
          throw new Error(data.error || (isEnglish ? "Could not load available times." : "Não foi possível carregar os horários disponíveis."));
        }
        if (!controller.signal.aborted) {
          setAvailabilityDays(data.availability);
          setAvailabilityState("ready");
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setAvailabilityState("error");
        setAvailabilityError(
          caught instanceof Error
            ? caught.message
            : isEnglish
              ? "Could not load available times."
              : "Não foi possível carregar os horários disponíveis."
        );
      });

    return () => controller.abort();
  }, [isEnglish, locale, selectedOffer, step]);

  function continueToReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() && email.trim()) setStep(2);
  }

  function selectOffer(id: string) {
    setOfferId(id);
    setSelectedSlot(null);
    setRequestError("");
    setAvailabilityError("");
    setAvailabilityState("idle");
  }

  function continueToDates() {
    if (selectedOffer) setStep(3);
  }

  async function submitRequest() {
    if (!selectedOffer || !selectedSlot || submittingRequest) return;

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
      const data = (await response.json()) as { ok?: boolean; error?: string; checkoutUrl?: string };
      if (!response.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(data.error || (isEnglish ? "Could not open secure payment." : "Não foi possível abrir o pagamento seguro."));
      }
      window.location.assign(data.checkoutUrl);
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{isEnglish ? "Reserve your reading" : "Reserve sua leitura"}</p>
          <h2 className="brand-serif mt-4 text-4xl font-semibold sm:text-5xl">{isEnglish ? "Choose your moment with care." : "Escolha seu momento com cuidado."}</h2>
          <p className="mt-5 leading-8 text-[#6f5d55]">{isEnglish ? "Share only what is needed, choose your reading and an available London time, then complete secure payment to confirm it." : "Compartilhe só o necessário, escolha sua tirada e um horário em Londres; o pagamento seguro confirma a reserva."}</p>
          {checkoutResult === "success" ? <p className="mt-5 rounded-xl border border-[#afd2c3] bg-[#eefaf5] px-4 py-3 text-sm leading-6 text-[#28604f]" role="status">{isEnglish ? "Payment received. Your time is confirmed and Edu will contact you with the next details." : "Pagamento recebido. Seu horário está confirmado e o Edu entrará em contato com os próximos detalhes."}</p> : null}
          {checkoutResult === "cancelled" ? <p className="mt-5 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm leading-6 text-[#8a4038]" role="status">{isEnglish ? "No payment was taken. Your Checkout can be resumed in this browser until its short reservation expires." : "Nenhum pagamento foi cobrado. O Checkout pode ser retomado neste navegador enquanto a reserva temporária estiver ativa."}</p> : null}
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
              {isEnglish ? "Secure payment confirms the appointment. A time is held only while Checkout is open, never indefinitely." : "O pagamento seguro confirma o atendimento. Um horário só fica retido enquanto o Checkout está aberto, nunca indefinidamente."}
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
                <p className="mt-3 text-sm leading-7 text-[#6f5d55]">{isEnglish ? "Availability changes with the reading length and live bookings, always keeping a 30-minute interval between sessions." : "A disponibilidade muda conforme a duração da tirada e as reservas reais, sempre mantendo 30 minutos entre atendimentos."}</p>
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
                {availabilityState === "loading" ? <p className="mt-7 rounded-xl bg-[#f7eddb] px-4 py-3 text-sm text-[#6f5134]" role="status">{isEnglish ? "Checking the live schedule…" : "Consultando a agenda ao vivo…"}</p> : null}
                {availabilityState === "error" ? <p className="mt-7 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm leading-6 text-[#8a4038]" role="alert">{availabilityError}</p> : null}
                {availabilityState === "ready" && !availabilityDays.length ? <p className="mt-7 rounded-xl bg-[#f7eddb] px-4 py-3 text-sm leading-6 text-[#6f5134]" role="status">{isEnglish ? "There are no open times in the next available dates. Please check back shortly." : "Não há horários abertos nas próximas datas disponíveis. Volte em breve."}</p> : null}
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {availabilityDays.map((day) => (
                    <div key={day.dateKey} className="rounded-2xl border border-[#d8c3a6] bg-white p-4">
                      <h4 className="font-semibold capitalize text-[#2c1f1b]">{day.label}</h4>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {day.slots.map((time) => {
                          const isSelected = selectedSlot?.dateKey === day.dateKey && selectedSlot.time === time;
                          return <button key={`${day.dateKey}-${time}`} type="button" onClick={() => { setSelectedSlot({ dateKey: day.dateKey, dayLabel: day.label, time }); setRequestError(""); }} aria-pressed={isSelected} className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${isSelected ? "border-[#8e674d] bg-[#f4d58d] text-[#241b18]" : "border-[#d8c3a6] text-[#6f5134] hover:border-[#8e674d] hover:bg-[#f7eddb]"}`}>{time}</button>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSlot ? (
                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#dceee5] p-4 text-sm text-[#315d51]" role="status">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
                    <div><p className="font-semibold">{isEnglish ? "Time selected" : "Horário selecionado"}</p><p className="mt-1">{selectedSlot.dayLabel} · {selectedSlot.time}. {isEnglish ? "Continue to secure payment to confirm this time." : "Continue para o pagamento seguro e confirme este horário."}</p></div>
                  </div>
                ) : null}
                {requestError ? <p className="mt-4 rounded-xl border border-[#e2bdb5] bg-[#fff2ef] px-4 py-3 text-sm leading-6 text-[#8a4038]" role="alert">{requestError}</p> : null}
                {selectedSlot ? <button type="button" onClick={() => void submitRequest()} disabled={submittingRequest || availabilityState !== "ready"} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-55">{submittingRequest ? (isEnglish ? "Opening secure payment…" : "Abrindo pagamento seguro…") : (isEnglish ? "Continue to secure payment" : "Continuar para o pagamento seguro")}<CheckCircle2 size={17} /></button> : null}
                <p className="mt-5 text-xs leading-6 text-[#806c5d]">{isEnglish ? "Times are in London time. Selecting one does not reserve it; opening Checkout holds it briefly and payment confirms it." : "Os horários estão no fuso de Londres. Selecionar não reserva; abrir o Checkout o retém por pouco tempo e o pagamento confirma."}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
