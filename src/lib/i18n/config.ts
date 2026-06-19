export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const LOCALE_STORAGE_KEY = "pdu_locale";
export const LOCALE_COOKIE_NAME = "pdu_locale";

export function normalizeLocale(value?: string | null): Locale {
  if (value?.toLowerCase().startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

