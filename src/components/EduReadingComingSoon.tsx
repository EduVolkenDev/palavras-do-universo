"use client";

import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { PDU_ASSETS } from "@/lib/pdu-assets";

const COPY = {
  "pt-BR": {
    back: "Palavras do Universo",
    eyebrow: "Leituras com o Edu · Em breve",
    title: "Um espaço para conversar com calma.",
    text: "As leituras individuais com o Edu estão sendo preparadas com cuidado. Quando a agenda abrir, você encontrará formatos, valores, disponibilidade e orientações claras nesta página.",
    noticeTitle: "A agenda ainda não está aberta.",
    noticeText: "Não há reservas ou pagamentos por enquanto. Deixe seu e-mail para receber o aviso de abertura da agenda.",
    waitlistLabel: "Seu melhor e-mail",
    waitlistPlaceholder: "voce@email.com",
    waitlistSubmit: "Entrar na lista de espera",
    waitlistSubmitting: "Salvando…",
    waitlistPrivacy: "Usaremos seu e-mail apenas para avisar quando esta agenda abrir.",
    waitlistSuccess: "Pronto — você será avisado quando a agenda abrir.",
    invalidEmail: "Informe um e-mail válido.",
    waitlistUnavailable: "A lista de espera está indisponível neste momento. Tente novamente em alguns instantes.",
    rateLimited: "Muitas tentativas em pouco tempo. Tente novamente mais tarde.",
    primary: "Explorar leituras digitais",
    secondary: "Conhecer Meu Universo",
    imageAlt: "Edu segurando cartas de tarot diante de um portal dourado.",
  },
  en: {
    back: "Palavras do Universo",
    eyebrow: "Readings with Edu · Coming soon",
    title: "A space to talk at an unhurried pace.",
    text: "Personal readings with Edu are being prepared with care. When the calendar opens, this page will show the formats, prices, availability, and clear guidance.",
    noticeTitle: "The calendar is not open yet.",
    noticeText: "There are no bookings or payments at the moment. Leave your email to be notified when the calendar opens.",
    waitlistLabel: "Your best email",
    waitlistPlaceholder: "you@email.com",
    waitlistSubmit: "Join the waitlist",
    waitlistSubmitting: "Saving…",
    waitlistPrivacy: "We will use your email only to let you know when this calendar opens.",
    waitlistSuccess: "You’re on the list — we’ll let you know when the calendar opens.",
    invalidEmail: "Enter a valid email address.",
    waitlistUnavailable: "The waitlist is unavailable at the moment. Please try again shortly.",
    rateLimited: "Too many attempts in a short time. Please try again later.",
    primary: "Explore digital readings",
    secondary: "Discover My Universe",
    imageAlt: "Edu holding tarot cards in front of a golden portal.",
  },
} as const;

export function EduReadingComingSoon() {
  const { locale } = useI18n();
  const copy = COPY[locale];
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/edu-reading/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale, website }),
      });
      const data = (await response.json().catch(() => null)) as { code?: string } | null;

      if (!response.ok) {
        const nextMessage = data?.code === "RATE_LIMITED"
          ? copy.rateLimited
          : data?.code === "INVALID_EMAIL"
            ? copy.invalidEmail
            : copy.waitlistUnavailable;
        setStatus("error");
        setMessage(nextMessage);
        return;
      }

      setStatus("success");
      setEmail("");
      setMessage(copy.waitlistSuccess);
    } catch {
      setStatus("error");
      setMessage(copy.waitlistUnavailable);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#171225] px-4 py-8 text-[#fff7e8] sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-[#7e58ac]/25 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-[34rem] w-[34rem] rounded-full bg-[#e6b95f]/16 blur-3xl" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-[#f4d58d]/25 bg-[#241b18] shadow-[0_32px_110px_rgba(0,0,0,0.4)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 flex flex-col px-6 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-14">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#f5d896] transition hover:text-[#fff7e8]">
            <ArrowRight className="rotate-180" size={17} />
            {copy.back}
          </Link>

          <div className="my-auto max-w-2xl py-16 lg:py-20">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/35 bg-[#f4d58d]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5d896]">
              <Sparkles size={15} />
              {copy.eyebrow}
            </p>
            <h1 className="brand-serif mt-7 text-5xl font-semibold leading-[0.96] text-[#fff7e8] sm:text-6xl lg:text-7xl">
              {copy.title}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-[#d8ccc0] sm:text-lg">
              {copy.text}
            </p>

            <div className="mt-9 rounded-2xl border border-[#f4d58d]/28 bg-black/15 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 shrink-0 text-[#f4d58d]" size={20} />
                <div>
                  <p className="font-semibold text-[#fff7e8]">{copy.noticeTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#d8ccc0]">{copy.noticeText}</p>
                </div>
              </div>

              {status === "success" ? (
                <p className="mt-5 rounded-xl border border-[#9ccdbd]/50 bg-[#1c4d42]/45 px-4 py-3 text-sm font-medium text-[#ddf9eb]" role="status">
                  {message}
                </p>
              ) : (
                <form className="mt-5" onSubmit={joinWaitlist}>
                  <label className="block text-sm font-semibold text-[#fff7e8]" htmlFor="edu-waitlist-email">
                    {copy.waitlistLabel}
                  </label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="edu-waitlist-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={copy.waitlistPlaceholder}
                      autoComplete="email"
                      required
                      disabled={status === "submitting"}
                      className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#f4d58d]/35 bg-[#fffaf0] px-4 text-sm text-[#241b18] outline-none transition placeholder:text-[#8d7b70] focus:border-[#f4d58d] focus:ring-2 focus:ring-[#f4d58d]/35 disabled:cursor-wait disabled:opacity-70"
                    />
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#f4d58d] px-5 text-sm font-bold text-[#241b18] transition hover:bg-[#ffe3a3] disabled:cursor-wait disabled:opacity-70"
                    >
                      {status === "submitting" ? copy.waitlistSubmitting : copy.waitlistSubmit}
                    </button>
                  </div>
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="edu-waitlist-website">Website</label>
                    <input
                      id="edu-waitlist-website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </div>
                  {status === "error" ? <p className="mt-3 text-sm text-[#ffb7aa]" role="alert">{message}</p> : null}
                  <p className="mt-3 text-xs leading-5 text-[#cabcaf]">{copy.waitlistPrivacy}</p>
                </form>
              )}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/tiradas" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] transition hover:-translate-y-0.5 hover:bg-[#ffe3a3]">
                {copy.primary}
                <ArrowRight size={17} />
              </Link>
              <Link href="/meu-universo" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#fff7e8] transition hover:border-[#f4d58d]/55 hover:bg-white/5">
                {copy.secondary}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden border-t border-[#f4d58d]/20 bg-[radial-gradient(circle_at_62%_28%,rgba(244,213,141,0.25),transparent_42%),linear-gradient(155deg,#3c2941,#171225_72%)] lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,37,0.04),rgba(23,18,37,0.78))]" />
          <Image
            src={PDU_ASSETS.people.eduReadingPortrait}
            alt={copy.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="object-cover object-[center_22%]"
          />
          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
            <p
              className="max-w-sm text-sm leading-7 text-[#efe2d2]"
              style={{
                background: "#0a0303ad",
                backdropFilter: "blur(10px)",
                padding: "5px 10px",
                borderRadius: "10px",
                border: "2px outset #b8b4b4",
                boxShadow: "0 0 10px",
              }}
            >
              {locale === "en"
                ? "Until then, the digital experiences of Palavras do Universo remain available to explore at your own pace."
                : "Enquanto isso, as experiências digitais do Palavras do Universo continuam disponíveis para você explorar no seu ritmo."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
