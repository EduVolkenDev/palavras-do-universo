import type { Metadata } from "next";
import { NumerosHome } from "@/components/numeros/NumerosHome";

export const metadata: Metadata = {
  title: "Números de intenção | Palavras do Universo",
  description:
    "Vibre sequências de Grabovoi com intenção clara: ressonância numérica, portais de foco e pausa guiada de três minutos.",
  alternates: { canonical: "/numeros" },
};

export default function NumerosPage() {
  return <NumerosHome />;
}
