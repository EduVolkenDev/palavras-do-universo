"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { MouseEvent } from "react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const handleLocaleClick = (
    event: MouseEvent<HTMLAnchorElement>,
    nextLocale: Locale
  ) => {
    event.preventDefault();
    setLocale(nextLocale);
  };

  return (
    <div
      className="fixed right-2.5 top-[calc(.55rem+env(safe-area-inset-top))] z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-white/15 bg-[#111019]/92 p-1 text-xs font-semibold text-[#fff7e8] shadow-[0_18px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:right-4 sm:top-auto"
      aria-label={locale === "en" ? "Language" : "Idioma"}
      data-i18n-ignore
    >
      <Languages
        size={15}
        className="ml-2 mr-1 hidden text-[#f5d896] sm:block"
        aria-hidden="true"
      />
      <a
        href="?lang=pt-BR"
        onClick={(event) => handleLocaleClick(event, "pt-BR")}
        aria-pressed={locale === "pt-BR"}
        role="button"
        className={`rounded-full px-2.5 py-1.5 ${
          locale === "pt-BR" ? "bg-[#f4d58d] text-[#1c1308]" : "text-[#d8ccc0]"
        }`}
      >
        PT
      </a>
      <a
        href="?lang=en"
        onClick={(event) => handleLocaleClick(event, "en")}
        aria-pressed={locale === "en"}
        role="button"
        className={`rounded-full px-2.5 py-1.5 ${
          locale === "en" ? "bg-[#f4d58d] text-[#1c1308]" : "text-[#d8ccc0]"
        }`}
      >
        EN
      </a>
    </div>
  );
}
