"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

type TranslationParams = {
  enabled?: boolean;
  readingId?: string | null;
  sourceText: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  question: string;
  spread: unknown;
};

type TranslationState = {
  key: string;
  status: "ready" | "loading" | "error";
  text: string;
};

type CacheEntry = { key: string; text: string };
const CACHE_KEY = "pdu_reading_translations_v1";
const MAX_CACHE_ENTRIES = 20;

function hashContent(value: string) {
  let first = 2166136261;
  let second = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }
  return `${(first >>> 0).toString(16)}${(second >>> 0).toString(16)}`;
}

function cacheEntries(): CacheEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is CacheEntry =>
          typeof entry?.key === "string" && typeof entry?.text === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function readCached(key: string) {
  return cacheEntries().find((entry) => entry.key === key)?.text ?? null;
}

function saveCached(key: string, value: string) {
  try {
    const entries = cacheEntries().filter((entry) => entry.key !== key);
    localStorage.setItem(CACHE_KEY, JSON.stringify([{ key, text: value }, ...entries].slice(0, MAX_CACHE_ENTRIES)));
  } catch {
    // The current translation remains visible even when storage is unavailable.
  }
}

export function useReadingTranslation(params: TranslationParams) {
  const serializedSpread = JSON.stringify(params.spread ?? []);
  const key = useMemo(() => hashContent(JSON.stringify([
    params.readingId ?? "",
    params.sourceLocale,
    params.targetLocale,
    params.question,
    params.sourceText,
    serializedSpread,
  ])), [params.question, params.readingId, params.sourceLocale, params.sourceText, params.targetLocale, serializedSpread]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<TranslationState>({ key: "", status: "loading", text: "" });
  const enabled = params.enabled !== false && Boolean(params.sourceText) && params.sourceLocale !== params.targetLocale;
  const requestKey = `${key}:${attempt}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      const cached = readCached(key);
      if (cached) return cached;
      if (controller.signal.aborted) return "";
      const response = await fetch("/api/reading/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          readingId: params.readingId,
          sourceLocale: params.sourceLocale,
          targetLocale: params.targetLocale,
          question: params.question,
          interpretation: params.sourceText,
          spread: JSON.parse(serializedSpread),
        }),
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null) as { interpretation?: unknown } | null;
      if (!response.ok || typeof body?.interpretation !== "string" || !body.interpretation.trim()) {
        throw new Error("Translation unavailable");
      }
      return body.interpretation.trim();
    })
      .then((translated) => {
        if (controller.signal.aborted) return;
        saveCached(key, translated);
        setState({ key: requestKey, status: "ready", text: translated });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ key: requestKey, status: "error", text: "" });
      });

    return () => controller.abort();
  }, [enabled, key, requestKey, params.question, params.readingId, params.sourceLocale, params.sourceText, params.targetLocale, serializedSpread]);

  return {
    status: !enabled ? "ready" as const : state.key === requestKey ? state.status : "loading" as const,
    text: !enabled ? params.sourceText : state.key === requestKey ? state.text : "",
    retry: () => setAttempt((current) => current + 1),
  };
}
