"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/config";
import { translations } from "@/lib/i18n/translations";

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (value: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);
const reverseEn = Object.fromEntries(
  Object.entries(translations.en).map(([pt, translated]) => [translated, pt])
);
const NON_TRANSLATABLE_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
]);

function translateText(value: string, locale: Locale) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const source = reverseEn[normalized] ?? normalized;
  return locale === "en" ? translations.en[source] ?? source : source;
}

function translateNode(node: Node, locale: Locale) {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.textContent ?? "";
    const trimmed = value.trim();
    if (!trimmed) return;
    const translated = translateText(trimmed, locale);
    if (translated !== trimmed) {
      node.textContent = value.replace(trimmed, translated);
    }
    return;
  }

  if (!(node instanceof HTMLElement)) return;
  if (node.dataset.i18nIgnore !== undefined) return;
  if (NON_TRANSLATABLE_TAGS.has(node.tagName) || node.isContentEditable) return;

  for (const attribute of ["placeholder", "aria-label", "title"]) {
    const value = node.getAttribute(attribute);
    if (!value) continue;
    const translated = translateText(value, locale);
    if (translated !== value) node.setAttribute(attribute, translated);
  }

  for (const child of node.childNodes) translateNode(child, locale);
}

function getInitialLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const urlLocale = new URLSearchParams(window.location.search).get("lang");
  let stored: string | null = null;
  let cookieLocale: string | undefined;

  try {
    stored = window.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
  } catch {
    stored = null;
  }

  try {
    cookieLocale = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.split("=")[1];
  } catch {
    cookieLocale = undefined;
  }

  return normalizeLocale(urlLocale ?? stored ?? cookieLocale ?? navigator.language);
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const preferredLocale = getInitialLocale();
    const timeout = window.setTimeout(
      () =>
        updateLocale((currentLocale) =>
          currentLocale === preferredLocale ? currentLocale : preferredLocale
        ),
      0
    );
    return () => window.clearTimeout(timeout);
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    updateLocale(nextLocale);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", nextLocale);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // URL synchronization is best-effort; state and persistence remain primary.
    }

    try {
      window.localStorage?.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Locale still changes in-session even if browser storage is unavailable.
    }

    try {
      document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Cookie persistence is best-effort; the visible locale state is primary.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "en" ? "Palavras do Universo | Daily clarity ritual" : "Palavras do Universo";
    translateNode(document.body, locale);

    const pendingNodes = new Set<Node>();
    let frameId: number | null = null;
    const scheduleTranslation = (node: Node) => {
      pendingNodes.add(node);
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        for (const pendingNode of pendingNodes) translateNode(pendingNode, locale);
        pendingNodes.clear();
        frameId = null;
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          scheduleTranslation(mutation.target);
        }
        for (const node of mutation.addedNodes) scheduleTranslation(node);
      }
    });
    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (text) => translateText(text, locale),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
