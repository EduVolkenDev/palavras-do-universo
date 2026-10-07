import type { Metadata } from "next";
import { EduReadingComingSoon } from "@/components/EduReadingComingSoon";

export const metadata: Metadata = {
  title: "Leituras com o Edu em breve | Palavras do Universo",
  description: "As leituras individuais com o Edu estão sendo preparadas com cuidado. Entre na lista de espera para receber o aviso de abertura da agenda.",
};

export default function EduReadingRoute() {
  return <EduReadingComingSoon />;
}
