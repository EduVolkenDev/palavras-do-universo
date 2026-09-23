import type { Metadata } from "next";
import Home from "../page";

export const metadata: Metadata = {
  title: "Abrir leitura | Palavras do Universo",
  description: "Prepare sua pergunta e abra a tirada escolhida.",
  robots: { index: false, follow: true },
};

export default function ReadingPage() {
  return <Home readingOnly />;
}
