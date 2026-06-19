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

function translateText(value: string, locale: Locale) {
  const source = reverseEn[value] ?? value;
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

  for (const attribute of ["placeholder", "aria-label", "title"]) {
    const value = node.getAttribute(attribute);
    if (!value) continue;
    const translated = translateText(value, locale);
    if (translated !== value) node.setAttribute(attribute, translated);
  }

  for (const child of node.childNodes) translateNode(child, locale);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(DEFAULT_LOCALE);

  const setLocale = useCallback((nextLocale: Locale) => {
    updateLocale(nextLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookieLocale = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.split("=")[1];
    const initial = normalizeLocale(stored ?? cookieLocale ?? navigator.language);
    const timer = window.setTimeout(() => updateLocale(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "en" ? "Palavras do Universo | Daily clarity ritual" : "Palavras do Universo";
    translateNode(document.body, locale);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateNode(mutation.target, locale);
        }
        for (const node of mutation.addedNodes) translateNode(node, locale);
      }
    });
    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
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
