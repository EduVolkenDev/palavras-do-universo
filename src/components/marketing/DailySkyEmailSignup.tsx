"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { SKY_EMAIL_CONSENT } from "@/lib/daily-sky-email/consent";
import styles from "./DailySkyEmailSignup.module.css";

export default function DailySkyEmailSignup({ status }: { status?: string }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const text = (pt: string, english: string) => en ? english : pt;
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || !email.trim()) return;
    setState("sending");
    try {
      const response = await fetch("/api/daily-sky-email/subscribe", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale: en ? "en" : "pt-BR", consent }),
      });
      if (!response.ok) throw new Error("Subscription request failed");
      setState("sent");
      setEmail("");
      setConsent(false);
    } catch {
      setState("error");
    }
  }

  const banner = status === "confirmed"
    ? text("Inscrição confirmada. Os envios do boletim ainda não começaram.", "Subscription confirmed. Newsletter delivery has not started yet.")
    : status === "unsubscribed"
      ? text("Inscrição cancelada. Você não receberá novos e-mails do céu diário.", "Unsubscribed. You will not receive more daily sky emails.")
      : status === "invalid" || status === "error"
        ? text("Este link expirou ou não é válido. Você pode se inscrever novamente abaixo.", "This link has expired or is invalid. You can subscribe again below.")
        : null;

  return (
    <section className={styles.section} aria-labelledby="daily-sky-email-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{text("UM POUCO DE CÉU, TODOS OS DIAS", "A LITTLE SKY, EVERY DAY")}</p>
        <h2 id="daily-sky-email-title">{text("Uma nota do céu para começar o dia.", "A note from the sky to start your day.")}</h2>
        <p>{text("Um acontecimento real do céu, explicado sem peso, e uma pergunta pequena para levar consigo. Não é previsão nem publicidade disfarçada.", "One real event in the sky, explained without overwhelm, and a small question to carry with you. No predictions or disguised advertising.")}</p>
        <p className={styles.detail}>{text("Inscrições abertas · Grátis · Português ou inglês · Envios em preparação", "Sign-ups open · Free · Portuguese or English · Delivery in preparation")}</p>
      </div>
      <form className={styles.form} onSubmit={submit}>
        {banner && <p className={styles.success} role="status">{banner}</p>}
        {state === "sent" && <p className={styles.success} role="status">{text("Confira seu e-mail para confirmar a inscrição. Veja também o spam.", "Check your email to confirm your subscription. Please check spam too.")}</p>}
        {state === "error" && <p className={styles.error} role="alert">{text("Não foi possível enviar a confirmação agora. Tente novamente mais tarde.", "We couldn't send the confirmation now. Please try again later.")}</p>}
        <label htmlFor="daily-sky-email">{text("Seu e-mail", "Your email")}</label>
        <input id="daily-sky-email" type="email" inputMode="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
        <label className={styles.consent}>
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
          <span>{SKY_EMAIL_CONSENT[en ? "en" : "pt-BR"]}</span>
        </label>
        <button type="submit" disabled={state === "sending" || !consent}>{state === "sending" ? text("Enviando…", "Sending…") : text("Receber o céu por e-mail", "Get the sky by email")}</button>
        <small>{text("Seus dados são usados somente para este envio. ", "Your details are used only for this email. ")}<Link href="/privacidade">{text("Privacidade", "Privacy")}</Link></small>
      </form>
    </section>
  );
}
