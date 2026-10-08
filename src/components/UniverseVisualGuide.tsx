"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import type { Locale } from "@/lib/i18n/config";

type UniverseVisualGuideProps = {
  locale: Locale;
  resumeReading?: {
    title: string;
    onOpen: () => void;
  } | null;
};

type VisualPath = {
  asset: string;
  label: string;
  title: string;
  text: string;
  href?: string;
  onOpen?: () => void;
  actionLabel?: string;
};

export function UniverseVisualGuide({
  locale,
  resumeReading,
}: UniverseVisualGuideProps) {
  const isEnglish = locale === "en";
  const paths: VisualPath[] = [
    resumeReading
      ? {
          asset: PDU_ASSETS.symbolic.zodiac,
          label: isEnglish ? "Your reading is here" : "Sua leitura está aqui",
          title: isEnglish
            ? "Continue your last reading"
            : "Continuar minha última leitura",
          text: resumeReading.title
            ? isEnglish
              ? `Open “${resumeReading.title}” exactly where you left it.`
              : `Abra “${resumeReading.title}” exatamente de onde você parou.`
            : isEnglish
              ? "Your cards and answer are saved and ready to revisit."
              : "Suas cartas e a resposta estão guardadas para você revisitar.",
          onOpen: resumeReading.onOpen,
          actionLabel: isEnglish ? "Continue reading" : "Continuar leitura",
        }
      : {
          asset: PDU_ASSETS.symbolic.zodiac,
          label: isEnglish ? "First reading" : "Primeira leitura",
          title: isEnglish ? "Open a reading" : "Abrir uma leitura",
          text: isEnglish
            ? "Ask one honest question and let your personal history begin."
            : "Faça uma pergunta honesta e dê início ao seu histórico pessoal.",
          href: "/#leitura",
          actionLabel: isEnglish ? "Open reading" : "Abrir leitura",
        },
    {
      asset: PDU_ASSETS.astrology.mapHero,
      label: isEnglish ? "Your personal map" : "Seu mapa pessoal",
      title: isEnglish ? "See your birth map" : "Ver meu mapa astral",
      text: isEnglish
        ? "Your birth data and personal sky live here."
        : "Seus dados de nascimento e seu céu pessoal ficam aqui.",
      href: "/astrologia/mapa",
      actionLabel: isEnglish ? "See my map" : "Ver meu mapa",
    },
    {
      asset: PDU_ASSETS.surfaces.access,
      label: isEnglish ? "Your purchases" : "Suas compras",
      title: isEnglish ? "See my access" : "Ver meus acessos",
      text: isEnglish
        ? "Find every reading and subscription available to you."
        : "Encontre todas as leituras e assinaturas liberadas para você.",
      href: "#acessos",
      actionLabel: isEnglish ? "See my access" : "Ver meus acessos",
    },
  ];

  return (
    <section
      aria-labelledby="universe-visual-guide-title"
      className="mt-8 overflow-hidden rounded-[28px] border border-[#241b18]/10 bg-[#111019] p-5 text-[#fff7e8] shadow-[0_30px_90px_rgba(36,27,24,0.16)] sm:p-7"
    >
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
          {isEnglish ? "Start here" : "Comece por aqui"}
        </p>
        <h2 id="universe-visual-guide-title" className="brand-serif mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
          {isEnglish
            ? "Choose one clear next step."
            : "Escolha um próximo passo claro."}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#d8ccc0]">
          {isEnglish
            ? "Return to a reading, find what you saved, or take one small step forward."
            : "Retome uma leitura, encontre o que você guardou ou dê um pequeno próximo passo."}
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {paths.map((path) => {
          const content = (
            <>
              <Image
                src={path.asset}
                alt=""
                width={280}
                height={210}
                sizes="(max-width: 640px) 80vw, (max-width: 1280px) 42vw, 22vw"
                className="mx-auto h-28 w-full object-contain transition duration-300 group-hover:scale-[1.04]"
              />
              <span className="mt-3 block text-[0.63rem] font-semibold uppercase tracking-[0.14em] text-[#a7d7c5]">
                {path.label}
              </span>
              <strong className="mt-1 block text-base leading-5 text-[#fff7e8]">{path.title}</strong>
              <span className="mt-2 block text-sm leading-5 text-[#d8ccc0]">{path.text}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#f5d896]">
                {path.actionLabel ?? (isEnglish ? "Open" : "Abrir")}
                <ArrowRight size={13} aria-hidden="true" />
              </span>
            </>
          );

          const className =
            "group relative min-h-[250px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[#f4d58d]/45 hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d58d]";

          return path.onOpen ? (
            <button
              key={path.title}
              type="button"
              onClick={path.onOpen}
              className={className}
            >
              {content}
            </button>
          ) : (
            <a key={path.title} href={path.href} className={className}>
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}
