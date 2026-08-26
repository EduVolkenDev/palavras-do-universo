"use client";

import { ArrowRight, Send, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import {
  getLumeSurface,
  getLumeWelcome,
  LUME_NAME,
  replyToLume,
  type LumeAction,
  type LumeSurface,
} from "@/lib/lume/persona";
import {
  createUserContext,
  type UserContext,
} from "@/lib/personalization/reading-context";

type LumeMessage = {
  id: number;
  role: "lume" | "user";
  text: string;
  action?: LumeAction;
  suggestions?: string[];
};

const LUME_OPEN_EVENT = "pdu-open-lume";

export function requestLumeOpen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LUME_OPEN_EVENT));
  }
}

function initialMessage(
  surface: LumeSurface,
  locale: "pt-BR" | "en",
  userContext?: UserContext | null
): LumeMessage {
  const welcome = getLumeWelcome(surface, locale, userContext);
  return { id: 0, role: "lume", ...welcome };
}

export default function LumeGuide() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const surface = getLumeSurface(pathname);
  const scope = `${locale}:${surface}`;
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{
    scope: string;
    messages: LumeMessage[];
  }>(() => ({ scope, messages: [initialMessage(surface, locale)] }));

  useEffect(() => {
    if (!open || contextLoaded) return;

    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { profile?: unknown };
        return data.profile ?? null;
      })
      .then((profile) => {
        if (!cancelled && profile) setUserContext(createUserContext(profile, "remote"));
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setContextLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [contextLoaded, open]);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }

    window.addEventListener(LUME_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(LUME_OPEN_EVENT, handleOpen);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const welcome = getLumeWelcome(surface, locale, userContext);
  const messages = conversation.scope === scope
    ? conversation.messages
    : [initialMessage(surface, locale, userContext)];
  const visibleMessages =
    messages.length === 1 && messages[0]?.role === "lume"
      ? [initialMessage(surface, locale, userContext)]
      : messages;
  const latestSuggestions = visibleMessages.length === 1
    ? welcome.suggestions ?? []
    : visibleMessages[visibleMessages.length - 1]?.suggestions ?? [];

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question) return;

    const reply = replyToLume(question, surface, locale, userContext);
    const nextId = visibleMessages.length + 1;
    setConversation({
      scope,
      messages: [
        ...visibleMessages,
        { id: nextId, role: "user", text: question },
        { id: nextId + 1, role: "lume", ...reply },
      ],
    });
    setInput("");
  }

  function askSuggestion(question: string) {
    const reply = replyToLume(question, surface, locale, userContext);
    const nextId = visibleMessages.length + 1;
    setConversation({
      scope,
      messages: [
        ...visibleMessages,
        { id: nextId, role: "user", text: question },
        { id: nextId + 1, role: "lume", ...reply },
      ],
    });
    setInput("");
  }

  return (
    <div className="pdu-lume-ambient">
      {open ? (
        <>
          <div className="pdu-lume-presence-field" aria-hidden="true" />
          <section
            id="lume-guide-panel"
            className="pdu-lume-guide-panel fixed right-[5.5rem] top-1/2 z-[111] flex max-h-[min(75vh,38rem)] w-[min(23rem,calc(100vw-1.5rem))] -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-[#f4d58d]/30 bg-[#111019] text-[#fff7e8] shadow-[0_28px_90px_rgba(0,0,0,0.46)]"
            aria-label={`${LUME_NAME} — ${locale === "en" ? "guidance" : "orientação"}`}
            role="dialog"
          >
          <header className="pdu-lume-guide-panel__header flex items-center gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,213,141,0.2),transparent_44%),#16131d] p-4">
            <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#f4d58d]/35 bg-[#090811]">
              <Image
                src={PDU_ASSETS.symbolic.wingOracle}
                alt=""
                fill
                sizes="48px"
                quality={88}
                className="object-contain p-1"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="pdu-lume-guide-panel__status">
                {locale === "en" ? "Presence active" : "Presença ativa"}
              </p>
              <p className="text-sm font-semibold text-[#fff7e8]">{LUME_NAME}</p>
              <p className="mt-0.5 text-xs leading-5 text-[#cfc4b9]">
                {locale === "en"
                  ? "She follows this point of the portal with you."
                  : "Ela acompanha este ponto do portal com você."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-[#cfc4b9] transition hover:bg-white/10 hover:text-white"
              aria-label={locale === "en" ? "Close Lume" : "Fechar Lume"}
            >
              <X size={17} />
            </button>
          </header>

          <div className="pdu-lume-guide-panel__body min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {visibleMessages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "ml-8" : "mr-4"}>
                <div
                  className={`rounded-2xl px-3.5 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-[#f4d58d] text-[#241b18]"
                      : "border border-white/10 bg-white/[0.06] text-[#efe2d2]"
                  }`}
                >
                  {message.text}
                </div>
                {message.action ? (
                  <Link
                    href={message.action.href}
                    onClick={() => setOpen(false)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#f4d58d]/35 px-3 py-2 text-xs font-semibold text-[#f5d896] transition hover:border-[#f4d58d] hover:bg-[#f4d58d]/10"
                  >
                    {message.action.label}
                    <ArrowRight size={13} />
                  </Link>
                ) : null}
              </div>
            ))}
            {latestSuggestions.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {latestSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => askSuggestion(suggestion)}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs text-[#e8dbcc] transition hover:border-[#a7d7c5]/60 hover:bg-[#a7d7c5]/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form onSubmit={submit} className="pdu-lume-guide-panel__form flex gap-2 border-t border-white/10 bg-[#0b0a10] p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm text-[#fff7e8] outline-none placeholder:text-[#8d837b] focus:border-[#f4d58d]/65"
              placeholder={locale === "en" ? "What are you trying to do?" : "O que você está tentando fazer?"}
              aria-label={locale === "en" ? "Ask Lume" : "Perguntar à Lume"}
            />
            <button
              type="submit"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#a7d7c5] text-[#07120e] transition hover:bg-[#c1ecdc] disabled:opacity-45"
              disabled={!input.trim()}
              aria-label={locale === "en" ? "Send question" : "Enviar pergunta"}
            >
              <Send size={16} />
            </button>
          </form>
          </section>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`pdu-lume-ambient__button group inline-flex max-w-[calc(100vw-1.5rem)] items-center gap-2 text-left text-[#fff7e8] transition ${
          open ? "pdu-lume-ambient__button--open" : ""
        }`}
        aria-expanded={open}
        aria-controls="lume-guide-panel"
        aria-label={open ? (locale === "en" ? "Close Lume" : "Fechar Lume") : (locale === "en" ? "Open Lume" : "Abrir Lume")}
      >
        <span className="pdu-lume-ambient__orb relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full">
          <Image
            src={PDU_ASSETS.symbolic.wingOracle}
            alt=""
            fill
            sizes="48px"
            quality={88}
            className="object-contain p-0.5 transition duration-500 group-hover:scale-110"
          />
        </span>
        <span className="pdu-lume-ambient__copy min-w-0 pr-1">
          <span className="block text-sm font-semibold tracking-[0.08em] text-[#fff7e8]">{LUME_NAME}</span>
          <span className="block max-w-[9.5rem] truncate text-[0.62rem] uppercase tracking-[0.12em] text-[#f5d896]">
            {locale === "en" ? "Lume is here" : "Lume está aqui"}
          </span>
        </span>
        <span className="pdu-lume-ambient__signal" aria-hidden="true" />
        <Sparkles size={15} className="pdu-lume-ambient__spark shrink-0 text-[#a7d7c5]" />
      </button>
    </div>
  );
}

export function LumePresence() {
  const { locale } = useI18n();
  const isEnglish = locale === "en";

  return (
    <section className="pdu-lume-presence" aria-labelledby="lume-presence-title">
      <div className="pdu-lume-presence__halo" aria-hidden="true" />
      <div className="pdu-lume-presence__seal" aria-hidden="true">
        <span className="pdu-lume-presence__seal-ring" />
        <span className="pdu-lume-presence__seal-art relative">
          <Image
            src={PDU_ASSETS.symbolic.wingOracle}
            alt=""
            fill
            sizes="88px"
            quality={90}
            className="object-contain"
          />
        </span>
      </div>
      <div className="pdu-lume-presence__copy">
        <div className="pdu-lume-presence__eyebrow">
          <span className="pdu-lume-presence__signal" />
          <span>{isEnglish ? "Presence of the portal" : "Presença do portal"}</span>
          <span className="pdu-lume-presence__eyebrow-rule" />
          <span>{LUME_NAME}</span>
        </div>
        <h2 id="lume-presence-title" className="brand-serif">
          {isEnglish ? "A quieter intelligence for the moment you are living." : "Uma inteligência mais quieta para o momento que você está vivendo."}
        </h2>
        <p>
          {isEnglish
            ? "Lume connects your question, the cards and the context you choose to share — turning symbolism into a clear next step."
            : "Lume conecta sua pergunta, as cartas e o contexto que você escolhe compartilhar — transformando símbolo em um próximo passo claro."}
        </p>
        <button type="button" onClick={requestLumeOpen} className="pdu-lume-presence__cta">
          {isEnglish ? "Enter Lume's presence" : "Entrar na presença da Lume"}
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="pdu-lume-presence__note">
        <span>{isEnglish ? "Her promise" : "O compromisso dela"}</span>
        <strong>{isEnglish ? "Possibility over prediction." : "Possibilidade, não previsão."}</strong>
      </div>
    </section>
  );
}
