"use client";

import { Check, Heart, MessageCircleHeart, Send, Sparkles, Star, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { PDU_ASSETS } from "@/lib/pdu-assets";

type FeedbackSource = "reading" | "footer";

type FeedbackDialogProps = {
  source: FeedbackSource;
  readingId: string | null;
  locale: "pt-BR" | "en";
  className?: string;
};

const copy = {
  "pt-BR": {
    triggerReading: "Como foi essa leitura?",
    triggerFooter: "Deixar um feedback",
    eyebrow: "Uma mensagem para o universo",
    title: "O que essa experiência despertou em você?",
    description: "Sua percepção ajuda a tornar cada leitura mais humana, clara e conectada com a vida real.",
    scoreLabel: "Quanto essa leitura ressoou?",
    scoreOptional: "opcional",
    messageLabel: "Sua mensagem",
    messagePlaceholder: "Escreva a frase, sensação ou mudança que ficou com você...",
    nameLabel: "Como podemos assinar?",
    nameOptional: "opcional",
    namePlaceholder: "Seu primeiro nome",
    consent: "Aceito que esta mensagem seja revisada para possível publicação, de forma anônima ou com o nome acima. Nada será publicado sem aprovação.",
    moderationNote: "Seu feedback ficará privado para revisão e só aparecerá no site depois da aprovação.",
    submit: "Enviar ao nosso círculo",
    submitting: "Recebendo sua mensagem...",
    close: "Fechar feedback",
    successTitle: "Sua mensagem chegou.",
    successText: "Obrigada por deixar uma parte desse momento aqui. Vamos ler com cuidado e carinho.",
    successClose: "Voltar para a jornada",
    required: "Escreva pelo menos algumas palavras para continuarmos.",
    unavailable: "Não conseguimos guardar agora. Tente novamente em um instante.",
  },
  en: {
    triggerReading: "How was this reading?",
    triggerFooter: "Leave feedback",
    eyebrow: "A message for the universe",
    title: "What did this experience awaken in you?",
    description: "Your perspective helps make each reading more human, clear, and connected to real life.",
    scoreLabel: "How much did it resonate?",
    scoreOptional: "optional",
    messageLabel: "Your message",
    messagePlaceholder: "Write the phrase, feeling, or change that stayed with you...",
    nameLabel: "How should we sign it?",
    nameOptional: "optional",
    namePlaceholder: "Your first name",
    consent: "I agree that this message may be reviewed for possible publication, anonymously or with the name above. Nothing will be published without approval.",
    moderationNote: "Your feedback stays private for review and will only appear on the site after approval.",
    submit: "Send it into our circle",
    submitting: "Receiving your message...",
    close: "Close feedback",
    successTitle: "Your message arrived.",
    successText: "Thank you for leaving a part of this moment here. We will read it with care.",
    successClose: "Return to the journey",
    required: "Write a few words so we can continue.",
    unavailable: "We could not save it right now. Please try again in a moment.",
  },
} as const;

export default function FeedbackDialog({ source, readingId, locale, className = "" }: FeedbackDialogProps) {
  const strings = copy[locale];
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [allowTestimonial, setAllowTestimonial] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => messageRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openDialog() {
    setStatus("idle");
    setErrorMessage("");
    setOpen(true);
  }

  function closeDialog() {
    if (status !== "sending") setOpen(false);
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (cleanMessage.length < 8) {
      setStatus("error");
      setErrorMessage(strings.required);
      messageRef.current?.focus();
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          readingId: source === "reading" ? readingId : null,
          source,
          resonanceScore: score,
          message: cleanMessage,
          displayName: displayName.trim(),
          allowTestimonial,
          locale,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || strings.unavailable);
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : strings.unavailable);
    }
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={`pdu-feedback-trigger ${className}`}>
        <span className="pdu-feedback-trigger__icon" aria-hidden="true">
          <MessageCircleHeart size={17} strokeWidth={1.65} />
        </span>
        <span>{source === "reading" ? strings.triggerReading : strings.triggerFooter}</span>
        <Sparkles size={14} strokeWidth={1.65} aria-hidden="true" />
      </button>

      {open ? createPortal(
        <div className="pdu-feedback-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <div className="pdu-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="pdu-feedback-title">
            <div className="pdu-feedback-dialog__art" aria-hidden="true">
              <Image src={PDU_ASSETS.editorial.crystal} alt="" fill sizes="10rem" className="object-contain" />
              <Image src={PDU_ASSETS.ambient.mandala} alt="" fill sizes="24rem" className="pdu-feedback-dialog__mandala object-contain" />
              <span className="pdu-feedback-dialog__glow" />
            </div>
            <button type="button" onClick={closeDialog} className="pdu-feedback-dialog__close" aria-label={strings.close}>
              <X size={19} />
            </button>

            {status === "success" ? (
              <div className="pdu-feedback-success">
                <span className="pdu-feedback-success__sigil" aria-hidden="true">
                  <Heart size={28} className="fill-current" />
                </span>
                <p className="pdu-feedback-dialog__eyebrow">{strings.eyebrow}</p>
                <h2 id="pdu-feedback-title" className="brand-serif pdu-feedback-dialog__title">{strings.successTitle}</h2>
                <p className="pdu-feedback-dialog__description">{strings.successText}</p>
                <button type="button" onClick={() => setOpen(false)} className="pdu-feedback-submit">
                  <Check size={17} />
                  {strings.successClose}
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="pdu-feedback-form">
                <p className="pdu-feedback-dialog__eyebrow">{strings.eyebrow}</p>
                <h2 id="pdu-feedback-title" className="brand-serif pdu-feedback-dialog__title">{strings.title}</h2>
                <p className="pdu-feedback-dialog__description">{strings.description}</p>

                <fieldset className="pdu-feedback-score">
                  <legend>{strings.scoreLabel} <span>({strings.scoreOptional})</span></legend>
                  <div className="pdu-feedback-score__options">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value}/5`}
                        aria-pressed={score === value}
                        onClick={() => setScore(score === value ? null : value)}
                        className={`pdu-feedback-score__button ${score === value ? "is-selected" : ""}`}
                      >
                        <Star size={18} className={score !== null && value <= score ? "fill-current" : ""} />
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="pdu-feedback-field">
                  <span>{strings.messageLabel}</span>
                  <textarea
                    ref={messageRef}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={2_000}
                    rows={5}
                    placeholder={strings.messagePlaceholder}
                    required
                  />
                  <small>{message.length}/2000</small>
                </label>

                <label className="pdu-feedback-field">
                  <span>{strings.nameLabel} <em>({strings.nameOptional})</em></span>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} placeholder={strings.namePlaceholder} />
                </label>

                <label className="pdu-feedback-consent">
                  <input type="checkbox" checked={allowTestimonial} onChange={(event) => setAllowTestimonial(event.target.checked)} />
                  <span>{strings.consent}</span>
                </label>
                <p className="pdu-feedback-moderation-note">{strings.moderationNote}</p>

                {errorMessage ? <p className="pdu-feedback-error" role="alert">{errorMessage}</p> : null}

                <button type="submit" disabled={status === "sending"} className="pdu-feedback-submit">
                  <Send size={16} />
                  {status === "sending" ? strings.submitting : strings.submit}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
