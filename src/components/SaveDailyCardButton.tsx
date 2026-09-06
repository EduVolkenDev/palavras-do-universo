"use client";

import { Bookmark, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getOrCreateLocalUserId,
  hasLocalDailyCard,
  removeLocalSavedMessages,
  saveLocalMessage,
} from "@/lib/client/localUniverse";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type DailyCardPayload = {
  date_key: string;
  date_label: string;
  opening_key?: string;
  card: {
    key: string;
    name: string;
    reversed: boolean;
    asset_path: string;
    keywords: string[];
    core_meaning?: string;
    life_question?: string;
  };
  reading: {
    keyword: string;
    coreMeaning?: string;
    lifeQuestion?: string;
    meaning: string;
    counsel: string;
    reflection_prompt: string;
    ritual: string;
  };
  daily_context: {
    source: "carta_do_dia";
    suggested_focus: string;
    energy: string;
  };
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveDailyCardButton(props: { payload: DailyCardPayload }) {
  const [state, setState] = useState<SaveState>("idle");
  const [detail, setDetail] = useState("");

  const label = useMemo(() => {
    if (state === "saving") return "Salvando...";
    if (state === "saved") return "Salva no Meu Universo";
    if (state === "error") return "Tentar salvar de novo";
    return "Salvar no Meu Universo";
  }, [state]);

  useEffect(() => {
    const savedKey = props.payload.opening_key ?? props.payload.date_key;

    if (hasLocalDailyCard(savedKey)) {
      setState("saved");
      setDetail("Esta abertura já está guardada neste navegador.");
      return;
    }

    const controller = new AbortController();
    getOrCreateLocalUserId();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) return;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!data.user) return null;
        return fetch("/api/saved-messages?limit=30", {
          signal: controller.signal,
        });
      })
      .then((response) => (response?.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object") return;
        const messages = (data as { messages?: unknown }).messages;
        if (!Array.isArray(messages)) return;

        const alreadySaved = messages.some((message) => {
          if (!message || typeof message !== "object") return false;
          const record = message as { message_type?: unknown; payload?: unknown };
          if (record.message_type !== "daily_card") return false;
          if (!record.payload || typeof record.payload !== "object") return false;

          return (
            ((record.payload as { opening_key?: unknown }).opening_key ??
              (record.payload as { date_key?: unknown }).date_key) === savedKey
          );
        });

        if (alreadySaved) {
          setState("saved");
          setDetail("Esta abertura já está guardada no seu histórico.");
        }
      })
      .catch(() => {
        // Histórico remoto indisponível não impede o fallback local.
      });

    return () => controller.abort();
  }, [props.payload.date_key, props.payload.opening_key]);

  async function saveDailyCard() {
    if (state === "saving" || state === "saved") return;

    const localMessage = saveLocalMessage({
      readingId: null,
      messageType: "daily_card",
      payload: props.payload,
    });

    setState("saved");
    setDetail("Carta salva neste navegador. Sincronizando com o histórico...");

    const body = {
      clientKey: localMessage.id,
      readingId: null,
      messageType: "daily_card",
      payload: props.payload,
    };

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase
        ? await supabase.auth.getUser()
        : { data: { user: null } };

      if (!data.user) {
        throw new Error("Usuário visitante");
      }

      const response = await fetch("/api/saved-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Supabase indisponível");
      }

      removeLocalSavedMessages([localMessage.id]);
      setState("saved");
      setDetail("Carta guardada no seu histórico.");
    } catch {
      setState("saved");
      setDetail("Carta salva neste navegador. Depois sincronizamos com sua conta.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={saveDailyCard}
        disabled={state === "saving" || state === "saved"}
        data-state={state}
        className="pdu-save-action inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] shadow-[0_18px_50px_rgba(244,213,141,0.24)] transition hover:bg-[#ffe3a3] disabled:cursor-default disabled:bg-[#d8c28a] disabled:text-[#3a2b17]"
      >
        <span className="pdu-save-action__content inline-flex items-center justify-center gap-2">
          {state === "saving" ? <Loader2 size={17} className="animate-spin" /> : null}
          {state === "saved" ? <Check size={17} /> : null}
          {state === "idle" || state === "error" ? <Bookmark size={17} /> : null}
          {label}
        </span>
      </button>

      {detail ? (
        <p className="text-center text-xs leading-5 text-[#bfb3a8] sm:text-left">
          {detail}{" "}
          {state === "saved" ? (
            <Link href="/meu-universo" className="font-semibold text-[#f5d896]">
              Ver no Meu Universo
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
