import type { Metadata } from "next";
import ReadingExperience from "@/components/home/ReadingExperience";

export const metadata: Metadata = {
  title: "Abrir leitura | Palavras do Universo",
  description: "Prepare sua pergunta e abra a tirada escolhida.",
  robots: { index: false, follow: true },
};

export default function ReadingPage() {
  return <ReadingExperience readingOnly />;
}
