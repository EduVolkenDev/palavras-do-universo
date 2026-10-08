import type { Metadata } from "next";
import { EduReadingPage } from "@/components/EduReading";

export const metadata: Metadata = {
  title: "Leitura com o Edu | Palavras do Universo",
  description: "Conheça Edu, criador do Palavras do Universo, e converse sobre uma leitura de tarot realizada por ele.",
};

export default function EduReadingRoute() {
  return <EduReadingPage />;
}
