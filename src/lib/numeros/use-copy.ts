"use client";

import { useI18n } from "@/components/I18nProvider";
import type { Phrase } from "@/lib/numeros/codes";
import { ui, type Lang } from "@/lib/numeros/copy";

export function useNumerosCopy() {
  const { locale } = useI18n();
  const lang: Lang = locale === "en" ? "en" : "pt";

  function href(path: string, params?: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    search.set("lang", lang === "en" ? "en" : "pt");
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value);
    }
    return `${path}?${search.toString()}`;
  }

  return {
    lang,
    m: ui[lang],
    href,
    say: (phrase: Phrase) => phrase[lang],
  };
}
