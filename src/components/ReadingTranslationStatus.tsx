"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

export function ReadingTranslationStatus({
  locale,
  onRetry,
  status,
  tone = "light",
}: {
  locale: Locale;
  onRetry: () => void;
  status: "loading" | "error";
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-2xl border p-4 text-sm leading-6 ${
        isDark
          ? "border-[#f4d58d]/25 bg-[#f4d58d]/[0.07] text-[#efe2d2]"
          : "border-[#dec8a9] bg-[#fffaf2] text-[#5c4b42]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Sparkles size={18} className={`mt-1 shrink-0 ${isDark ? "text-[#f4d58d]" : "text-[#8a6b3f]"}`} aria-hidden="true" />
        <div>
          <p className="font-semibold">
            {status === "loading"
              ? locale === "en" ? "Preparing your complete reading in English" : "Preparando sua leitura completa em português"
              : locale === "en" ? "The complete English reading is not available yet" : "A leitura completa em português ainda não está disponível"}
          </p>
          <p className="mt-1 opacity-85">
            {status === "loading"
              ? locale === "en" ? "Keeping the meaning of your question and every card together." : "Mantendo juntos o sentido da sua pergunta e de cada carta."
              : locale === "en" ? "Please try again. We will not replace it with a shortened summary." : "Tente novamente. Não vamos substituí-la por um resumo encurtado."}
          </p>
          {status === "error" ? (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-3 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                isDark ? "bg-[#f4d58d] text-[#241b18] hover:bg-[#ffe6a8]" : "bg-[#241b18] text-[#fff7e8] hover:bg-[#3a2c25]"
              }`}
            >
              {locale === "en" ? "Try again" : "Tentar novamente"}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
