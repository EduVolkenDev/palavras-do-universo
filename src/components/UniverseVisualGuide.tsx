"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import type { Locale } from "@/lib/i18n/config";

type UniverseVisualGuideProps = {
  locale: Locale;
  latestReading?: {
    id: string;
    theme: string;
    question: string;
  };
  recurringTheme?: {
    label: string;
    count: number;
  };
  hasReadingHistory: boolean;
  savedCount: number;
  activeCommitmentCount: number;
};

type VisualPath = {
  asset: string;
  label: string;
  title: string;
  text: string;
  href: string;
};

export function UniverseVisualGuide({
  locale,
  latestReading,
  recurringTheme,
  hasReadingHistory,
  savedCount,
  activeCommitmentCount,
}: UniverseVisualGuideProps) {
  const isEnglish = locale === "en";
  const latestLabel = latestReading?.question || latestReading?.theme;
  const paths: VisualPath[] = [
    latestReading
      ? {
          asset: PDU_ASSETS.symbolic.zodiac,
          label: isEnglish ? "Latest reading" : "Última leitura",
          title: isEnglish ? "Return to what opened" : "Retomar o que se abriu",
          text: latestLabel
            ? isEnglish
              ? `Open “${latestLabel}” and notice what still asks for your attention.`
              : `Abra “${latestLabel}” e perceba o que ainda pede a sua atenção.`
            : isEnglish
              ? "Open your most recent reading and notice what remains alive."
              : "Abra sua leitura mais recente e perceba o que continua vivo.",
          href: `#leitura-${latestReading.id}`,
        }
      : hasReadingHistory
        ? {
            asset: PDU_ASSETS.symbolic.zodiac,
            label: isEnglish ? "Saved reading" : "Leitura salva",
            title: isEnglish ? "Return to a saved reading" : "Voltar a uma leitura salva",
            text: isEnglish
              ? "Your history already has a thread worth revisiting."
              : "O seu histórico já tem um fio que vale revisitar.",
            href: "#historico-vivo",
          }
        : {
          asset: PDU_ASSETS.symbolic.zodiac,
          label: isEnglish ? "First signal" : "Primeiro sinal",
          title: isEnglish ? "Open your first reading" : "Abrir sua primeira leitura",
          text: isEnglish
            ? "A real question gives your history somewhere to begin."
            : "Uma pergunta real dá ao seu histórico um lugar para começar.",
          href: "/#leitura",
        },
    recurringTheme
      ? {
          asset: PDU_ASSETS.symbolic.butterfly,
          label: isEnglish ? "A returning theme" : "Tema que retorna",
          title: isEnglish ? "Notice the pattern" : "Perceber o padrão",
          text: isEnglish
            ? `“${recurringTheme.label}” appeared ${recurringTheme.count} times in your history.`
            : `“${recurringTheme.label}” apareceu ${recurringTheme.count} vezes no seu histórico.`,
          href: "#historico-vivo",
        }
      : {
          asset: PDU_ASSETS.symbolic.dragonfly,
          label: isEnglish ? "Your context" : "Seu contexto",
          title: isEnglish ? "Give Lume an axis" : "Dar um eixo para a Lume",
          text: isEnglish
            ? "Name your phase and the way you want to be accompanied."
            : "Nomeie sua fase e a forma como quer ser acompanhada.",
          href: "#mapa-inicial",
        },
    {
      asset: PDU_ASSETS.productIcons.threeCardPath,
      label: isEnglish ? "What remained" : "O que ficou",
      title: savedCount
        ? isEnglish
          ? "Revisit saved messages"
          : "Rever mensagens salvas"
        : isEnglish
          ? "Keep what matters"
          : "Guardar o que importa",
      text: savedCount
        ? isEnglish
          ? `${savedCount} ${savedCount === 1 ? "message is" : "messages are"} waiting for a return.`
          : `${savedCount} ${savedCount === 1 ? "mensagem espera" : "mensagens esperam"} por uma volta.`
        : isEnglish
          ? "Save a phrase from a reading when it is useful to return to it."
          : "Guarde uma frase da leitura quando ela for útil para revisitar.",
      href: savedCount ? "#mensagens-salvas" : "#historico-vivo",
    },
    {
      asset: PDU_ASSETS.productIcons.weekEnergy,
      label: isEnglish ? "In real life" : "Na vida real",
      title: activeCommitmentCount
        ? isEnglish
          ? "Return to your next gesture"
          : "Voltar ao seu próximo gesto"
        : isEnglish
          ? "Turn a reading into a gesture"
          : "Transformar leitura em gesto",
      text: activeCommitmentCount
        ? isEnglish
          ? `${activeCommitmentCount} ${activeCommitmentCount === 1 ? "commitment is" : "commitments are"} still in motion.`
          : `${activeCommitmentCount} ${activeCommitmentCount === 1 ? "compromisso segue" : "compromissos seguem"} em movimento.`
        : isEnglish
          ? "Choose one small action that carries a reading into your day."
          : "Escolha uma ação pequena que leve uma leitura para o seu dia.",
      href: activeCommitmentCount ? "#acoes-vivas" : "/#acao",
    },
  ];

  return (
    <section
      aria-labelledby="universe-visual-guide-title"
      className="mt-8 overflow-hidden rounded-[28px] border border-[#241b18]/10 bg-[#111019] p-5 text-[#fff7e8] shadow-[0_30px_90px_rgba(36,27,24,0.16)] sm:p-7"
    >
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
          {isEnglish ? "Your visual guide" : "Seu guia visual"}
        </p>
        <h2 id="universe-visual-guide-title" className="brand-serif mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
          {isEnglish ? "Images that take you somewhere." : "Imagens que levam você a algum lugar."}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#d8ccc0]">
          {isEnglish
            ? "Each symbol is connected to a real part of your journey, not just decoration."
            : "Cada símbolo está ligado a uma parte real da sua jornada, e não apenas à decoração."}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {paths.map((path) => (
          <a
            key={path.title}
            href={path.href}
            className="group relative min-h-[250px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#f4d58d]/45 hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d58d]"
          >
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
              {isEnglish ? "Open" : "Abrir"}
              <ArrowRight size={13} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
