import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotCardMeaningContent } from "@/components/tarot/TarotCardMeaningContent";
import { getTarotCardPageData, getTarotCardPageParams } from "@/lib/tarot/card-page";

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
  if (!getTarotCardPageData(slug)) notFound();
  return <TarotCardMeaningContent cardKey={slug} />;
}
