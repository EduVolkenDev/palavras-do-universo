import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { TAROT_CARD_CATALOG } from "@/lib/tarot/cardCatalog";
import { getTarotCardPageData, getTarotCardGroup } from "@/lib/tarot/card-page";

export const metadata: Metadata = {
  title: "Significados do Tarot: as 78 cartas explicadas | Palavras do Universo",
  description:
    "Explore os significados das 78 cartas do tarot, suas palavras-chave, leituras diretas e reversas e uma pergunta para levar para a sua vida.",
  alternates: { canonical: "/significados/tarot" },
};

export default function TarotMeaningsPage() {
  return (
    <main className="pdu-home min-h-screen text-[#f8efe2]">
      <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="pdu-veil" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm text-[#e8dbcf] transition hover:border-[#f4d58d]/50 hover:text-[#fff7e8]"
          >
            <ArrowRight className="rotate-180" size={16} />
            Voltar ao portal
          </Link>

          <div className="max-w-4xl">
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5d896]">
              <Sparkles size={15} /> Biblioteca simbólica
            </p>
            <h1 className="brand-serif text-5xl font-semibold leading-[0.98] text-[#fff7e8] sm:text-7xl">
              Significados do tarot para reconhecer o que está vivo em você.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d8ccc0]">
              Uma biblioteca para consultar as 78 cartas com linguagem clara:
              o que cada símbolo representa, como pode aparecer na vida real e
              qual pergunta ele convida você a fazer.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/tiradas"
              className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-bold text-[#211913] transition hover:bg-[#fff0bd]"
            >
              Fazer uma leitura gratuita <ArrowRight size={16} />
            </Link>
            <Link
              href="/baralho"
              className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-[#fff7e8] transition hover:border-[#f4d58d]/50"
            >
              Abrir o baralho completo <BookOpen size={16} />
            </Link>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TAROT_CARD_CATALOG.map((card) => {
              const data = getTarotCardPageData(card.key);
              if (!data) return null;

              return (
                <Link
                  key={card.key}
                  href={`/significados/tarot/${card.key}`}
                  className="group overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.055] transition hover:-translate-y-1 hover:border-[#f4d58d]/45 hover:bg-white/[0.09]"
                >
                  <div className="relative aspect-[5/4] overflow-hidden bg-[#0d0b16]">
                    <Image
                      src={card.assetPath}
                      alt={`Carta ${card.name}`}
                      fill
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw"
                      className="object-contain p-7 transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full border border-[#f4d58d]/25 bg-[#0b0912]/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f5d896] backdrop-blur">
                      {getTarotCardGroup(card)}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="brand-serif text-2xl font-semibold text-[#fff7e8]">
                      {data.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#cfc4b9]">
                      {data.detail.guide.core}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#f5d896]">
                      Ler significado <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
