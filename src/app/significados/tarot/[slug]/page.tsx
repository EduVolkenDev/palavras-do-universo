import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotCardMeaningContent } from "@/components/tarot/TarotCardMeaningContent";
import { getTarotCardPageData, getTarotCardPageParams } from "@/lib/tarot/card-page";
import { getTarotEditorial } from "@/lib/tarot/editorial";

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
    description: `${card.detail.guide.core} Explore os símbolos da arte, posições direta e reversa, um exemplo cotidiano e diferenças entre cartas.`,
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
  if (!getTarotCardPageData(slug)) notFound();
  const editorial = getTarotEditorial(slug);
  if (!editorial) throw new Error(`Missing tarot editorial content: ${slug}`);
  return <TarotCardMeaningContent cardKey={slug} editorial={editorial} />;
}
