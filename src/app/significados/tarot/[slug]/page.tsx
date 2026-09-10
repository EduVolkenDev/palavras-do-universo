import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { TAROT_CARD_CATALOG } from "@/lib/tarot/cardCatalog";
import {
  getTarotCardGroup,
  getTarotCardPageData,
  getTarotCardPageParams,
} from "@/lib/tarot/card-page";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getTarotCardPageParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getTarotCardPageData(slug);

  if (!card) return {};

  return {
    title: `Significado de ${card.name} no Tarot | Palavras do Universo`,
    description: `${card.detail.guide.core} Veja palavras-chave, sentido direto, sentido reverso e uma pergunta para levar para a sua vida.`,
    alternates: { canonical: `/significados/tarot/${card.key}` },
    openGraph: {
      title: `Significado de ${card.name} no Tarot`,
      description: card.detail.guide.core,
      type: "article",
      images: [{ url: card.assetPath, alt: `Carta ${card.name}` }],
    },
  };
}

export default async function TarotCardMeaningPage({ params }: PageProps) {
  const { slug } = await params;
  const card = getTarotCardPageData(slug);

  if (!card) notFound();

  const index = TAROT_CARD_CATALOG.findIndex((item) => item.key === card.key);
  const previous = index > 0 ? TAROT_CARD_CATALOG[index - 1] : null;
  const next = index < TAROT_CARD_CATALOG.length - 1 ? TAROT_CARD_CATALOG[index + 1] : null;

  return (
    <main className="pdu-home min-h-screen text-[#f8efe2]">
      <article className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        <div className="pdu-veil" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <nav aria-label="Navegação estrutural" className="flex flex-wrap items-center gap-2 text-sm text-[#cfc4b9]">
            <Link href="/" className="transition hover:text-[#fff7e8]">Portal</Link>
            <span aria-hidden="true">/</span>
            <Link href="/significados/tarot" className="transition hover:text-[#fff7e8]">Significados do tarot</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#f5d896]">{card.name}</span>
          </nav>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-[#f4d58d]/25 bg-[#0d0b16] shadow-[0_28px_100px_rgba(0,0,0,0.35)]">
              <Image
                src={card.assetPath}
                alt={`Carta ${card.name}`}
                width={700}
                height={980}
                priority
                className="h-auto w-full object-contain p-8"
              />
            </div>

            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5d896]">
                <Sparkles size={15} /> {getTarotCardGroup(card)}
              </p>
              <h1 className="brand-serif mt-5 text-6xl font-semibold leading-[0.95] text-[#fff7e8] sm:text-8xl">
                {card.name}
              </h1>
              <p className="mt-7 max-w-2xl text-xl leading-9 text-[#e2d6ca]">
                {card.detail.guide.core}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {card.detail.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-[#d8ccc0]">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            <section className="rounded-[24px] border border-[#f4d58d]/22 bg-[#f4d58d]/[0.07] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">O que representa</p>
              <p className="mt-4 text-base leading-7 text-[#eee1d3]">{card.detail.guide.core}</p>
            </section>
            <section className="rounded-[24px] border border-[#a7d7c5]/22 bg-[#a7d7c5]/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bdebdc]">Quando aparece</p>
              <p className="mt-4 text-base leading-7 text-[#eee1d3]">{card.detail.upright}</p>
            </section>
            <section className="rounded-[24px] border border-[#d2818b]/22 bg-[#d2818b]/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f1b8bd]">Quando pede cuidado</p>
              <p className="mt-4 text-base leading-7 text-[#eee1d3]">{card.detail.reversed}</p>
            </section>
          </div>

          <section className="mt-5 rounded-[24px] border border-white/12 bg-white/[0.055] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">Pergunta para levar</p>
            <p className="brand-serif mt-4 max-w-4xl text-3xl leading-tight text-[#fff7e8] sm:text-4xl">
              {card.detail.guide.question}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#cfc4b9]">
              O significado não é uma sentença sobre o seu futuro. Ele é um
              ponto de partida para reconhecer o que esta carta movimenta no
              seu momento e escolher o que fazer com mais presença.
            </p>
          </section>

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
              Consultar outras cartas <BookOpen size={16} />
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            {previous ? (
              <Link href={`/significados/tarot/${previous.key}`} className="inline-flex items-center gap-2 text-sm text-[#cfc4b9] transition hover:text-[#fff7e8]">
                <ArrowLeft size={16} /> {previous.name}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/significados/tarot/${next.key}`} className="inline-flex items-center gap-2 text-sm text-[#cfc4b9] transition hover:text-[#fff7e8]">
                {next.name} <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </main>
  );
}
