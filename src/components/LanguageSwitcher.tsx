"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const isCampaignPage = pathname === "/clareza-urgente";
  const isHome = pathname === "/";

  const handleLocaleClick = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
  };

  return (
    <div
      className={`pdu-language-switcher fixed right-2.5 top-[calc(.55rem+env(safe-area-inset-top))] z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-white/15 bg-[#111019]/92 p-1 text-xs font-semibold text-[#fff7e8] shadow-[0_18px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:right-4 sm:top-auto ${isCampaignPage ? "pdu-language-switcher--campaign" : ""} ${isHome ? "pdu-language-switcher--home" : ""}`}
      aria-label={locale === "en" ? "Language" : "Idioma"}
      data-i18n-ignore
    >
      <span
        className="pdu-language-switcher__mark relative ml-1 h-5 w-5 shrink-0 overflow-hidden rounded-full sm:ml-1.5"
        aria-hidden="true"
      >
        <Image
          src="/assets/palavras-symbol.webp"
          alt=""
          fill
          sizes="20px"
          className="object-contain"
        />
      </span>
      <button
        type="button"
        onClick={() => handleLocaleClick("pt-BR")}
        aria-pressed={locale === "pt-BR"}
        className={`rounded-full px-2.5 py-1.5 ${
          locale === "pt-BR" ? "bg-[#f4d58d] text-[#1c1308]" : "text-[#d8ccc0]"
        }`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => handleLocaleClick("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1.5 ${
          locale === "en" ? "bg-[#f4d58d] text-[#1c1308]" : "text-[#d8ccc0]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
