"use client";

import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Palavras do Universo runtime error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0d0d16] px-4 py-12 text-[#fff7e8] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
        <div className="w-full rounded-[28px] border border-[#f4d58d]/22 bg-white/[0.055] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#f4d58d]/30 bg-[#f4d58d]/12 text-[#f5d896]">
            <AlertTriangle size={22} />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
            O portal oscilou
          </p>
          <h1 className="brand-serif mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            A página encontrou uma falha, mas sua jornada não foi perdida.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
            Tente reabrir a experiência. Se você tinha uma tirada neste navegador, o
            Palavras do Universo tenta restaurar a última leitura salva assim que a
            página volta.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308]"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
            <Link
              href="/meu-universo"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#fff7e8]"
            >
              Ver Meu Universo
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#d8ccc0]"
            >
              <ArrowLeft size={16} />
              Voltar ao início
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
