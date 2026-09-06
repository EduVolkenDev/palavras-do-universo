"use client";

import { ArrowRight, Send, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { getLumeVisualAsset } from "@/lib/lume/assets";
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
  normalizeActiveReading,
  type UserContext,
} from "@/lib/personalization/reading-context";
import {
  buildJourneySnapshot,
  type JourneyMessageRecord,
  type JourneyReadingRecord,
} from "@/lib/personalization/journey";
import { getLabPracticeContinuity } from "@/lib/lab/practice";
import {
  getLocalActiveReading,
  getLocalImpactCommitments,
  getLocalSavedMessages,
  localActiveReadingAsSavedMessage,
} from "@/lib/client/localUniverse";

type LumeMessage = {
  id: number;
  role: "lume" | "user";
  text: string;
  action?: LumeAction;
  suggestions?: string[];
};

const LUME_OPEN_EVENT = "pdu-open-lume";
const LUME_JOURNEY_UPDATE_EVENT = "pdu:journey-updated";

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
  const isHome = pathname === "/";
  const scope = `${locale}:${surface}`;
  const contextScope = `${locale}:${pathname}`;
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loadedContextScope, setLoadedContextScope] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{
    scope: string;
    messages: LumeMessage[];
  }>(() => ({ scope, messages: [initialMessage(surface, locale)] }));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || loadedContextScope === contextScope) return;

    let cancelled = false;
    Promise.all(
      [
        "/api/profile",
        "/api/readings?limit=20",
        "/api/saved-messages?limit=20",
        "/api/actions",
      ].map((url) => fetch(url, { cache: "no-store" }).catch(() => null))
    )
      .then(async ([profileResponse, readingsResponse, messagesResponse, actionsResponse]) => {
        const [profileData, readingsData, messagesData, actionsData] = await Promise.all(
          [profileResponse, readingsResponse, messagesResponse, actionsResponse].map(async (response) => {
            if (!response?.ok) return null;
            try {
              return (await response.json()) as unknown;
            } catch {
              return null;
            }
          })
        );

        let localProfile: unknown = null;
        try {
          const stored = window.localStorage.getItem("pdu_onboarding_profile");
          localProfile = stored ? JSON.parse(stored) : null;
        } catch {
          localProfile = null;
        }

        const remoteProfile =
          profileData && typeof profileData === "object" && profileData !== null
            ? (profileData as { profile?: unknown }).profile ?? null
            : null;
        const profile = remoteProfile ?? localProfile;
        const source: UserContext["source"] = remoteProfile
          ? "remote"
          : localProfile
            ? "local"
            : "none";
        const remoteReadings =
          readingsData && typeof readingsData === "object" && readingsData !== null
            ? (readingsData as { readings?: unknown }).readings
            : [];
        const remoteMessages =
          messagesData && typeof messagesData === "object" && messagesData !== null
            ? (messagesData as { messages?: unknown }).messages
            : [];
        const remoteActions =
          actionsData && typeof actionsData === "object" && actionsData !== null
            ? (actionsData as { commitments?: unknown }).commitments
            : [];
        const localActiveReadingRecord = getLocalActiveReading();
        const localActiveReading = localActiveReadingAsSavedMessage(
          localActiveReadingRecord
        );
        const activeReading = normalizeActiveReading(localActiveReadingRecord);
        const messages = [
          ...(Array.isArray(remoteMessages) ? remoteMessages : []),
          ...(localActiveReading ? [localActiveReading] : []),
          ...getLocalSavedMessages(),
        ] as JourneyMessageRecord[];
        const readings = (Array.isArray(remoteReadings) ? remoteReadings : []) as JourneyReadingRecord[];
        const actions = [
          ...(Array.isArray(remoteActions) ? remoteActions : []),
          ...getLocalImpactCommitments(),
        ];
        const practiceContinuity = getLabPracticeContinuity(
          messages
            .filter((message) => message.message_type === "practice")
            .map((message) => message.payload)
        );
        const baseContext = createUserContext(profile, source);
        const journey = buildJourneySnapshot(
          readings,
          messages,
          baseContext.readingProfile,
          actions
        );

        if (!cancelled) {
          setUserContext(
            profile ||
              journey.hasHistory ||
              journey.actionCount > 0 ||
              practiceContinuity.latest ||
              activeReading
              ? createUserContext(
                  profile,
                  source,
                  journey,
                  practiceContinuity,
                  activeReading ?? undefined
                )
              : null
          );
        }
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoadedContextScope(contextScope);
      });

    return () => {
      cancelled = true;
    };
  }, [contextScope, loadedContextScope, open, pathname]);

  useEffect(() => {
    function handleOpen() {
      setLoadedContextScope(null);
      setOpen(true);
    }

    window.addEventListener(LUME_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(LUME_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    const refreshContext = () => setLoadedContextScope(null);
    window.addEventListener(LUME_JOURNEY_UPDATE_EVENT, refreshContext);
    return () => window.removeEventListener(LUME_JOURNEY_UPDATE_EVENT, refreshContext);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const frameId = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus?.();
    };
  }, [open]);

  if (pathname.startsWith("/admin") || pathname === "/clareza-urgente") return null;

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
  const visual = getLumeVisualAsset(surface, locale, userContext);

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

  function toggleLume() {
    if (!open) setLoadedContextScope(null);
    setOpen(!open);
  }

  return (
    <div className={`pdu-lume-ambient ${isHome ? "pdu-lume-ambient--home" : ""}`}>
      {open ? (
        <>
          <div className="pdu-lume-presence-field" aria-hidden="true" />
          <section
            id="lume-guide-panel"
            className="pdu-lume-guide-panel fixed right-[5.5rem] top-1/2 z-[111] flex max-h-[min(75vh,38rem)] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[26px] border border-[#f4d58d]/30 bg-[#111019] text-[#fff7e8] shadow-[0_28px_90px_rgba(0,0,0,0.46)]"
            aria-label={`${LUME_NAME} — ${locale === "en" ? "guidance" : "orientação"}`}
            role="dialog"
            aria-modal="true"
            data-lume-visual-state={visual.state}
          >
          <header className="pdu-lume-guide-panel__header flex items-center gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,213,141,0.2),transparent_44%),#16131d] p-4">
            <span className="pdu-lume-guide-panel__portrait relative grid h-[4.25rem] w-[3.35rem] shrink-0 place-items-center overflow-hidden rounded-[1.15rem] border border-[#f4d58d]/40 bg-[#090811]">
              <Image
                src={visual.src}
                alt=""
                fill
                sizes="54px"
                quality={88}
                className="object-cover"
                style={{ objectPosition: visual.objectPosition }}
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
              ref={closeButtonRef}
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
        onClick={toggleLume}
        ref={triggerRef}
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
  const visual = getLumeVisualAsset("home", locale);

  return (
    <section
      className="pdu-lume-presence"
      aria-labelledby="lume-presence-title"
      data-lume-visual-state={visual.state}
    >
      <div className="pdu-lume-presence__halo" aria-hidden="true" />
      <div className="pdu-lume-presence__seal" aria-hidden="true">
        <span className="pdu-lume-presence__seal-ring" />
        <span className="pdu-lume-presence__seal-art relative">
          <Image
            src={visual.src}
            alt=""
            fill
            sizes="112px"
            quality={90}
            className="object-cover"
            style={{ objectPosition: visual.objectPosition }}
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
