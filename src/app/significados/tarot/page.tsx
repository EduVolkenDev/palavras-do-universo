import type { Metadata } from "next";
import { TarotMeaningsContent } from "@/components/tarot/TarotMeaningsContent";

export const metadata: Metadata = {
  title: "Significados do Tarot: as 78 cartas explicadas | Palavras do Universo",
  description:
    "Explore os significados das 78 cartas do tarot, suas palavras-chave, leituras diretas e reversas e uma pergunta para levar para a sua vida.",
  alternates: { canonical: "/significados/tarot" },
};

export default function TarotMeaningsPage() {
  return <TarotMeaningsContent />;
}
