import type { Metadata } from "next";
import { NumerosLibrary } from "@/components/numeros/NumerosLibrary";

export const metadata: Metadata = {
  title: "Códigos por intenção | Palavras do Universo",
  description: "Biblioteca curta das sequências mais repetidas, organizadas por intenção.",
  alternates: { canonical: "/numeros/biblioteca" },
};

export default function BibliotecaPage() {
  return <NumerosLibrary />;
}
