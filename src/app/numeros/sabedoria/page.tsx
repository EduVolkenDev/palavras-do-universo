import type { Metadata } from "next";
import { NumerosWisdom } from "@/components/numeros/NumerosWisdom";

export const metadata: Metadata = {
  title: "Sabedoria | Números de intenção",
  description: "Três textos curtos sobre o que estas sequências podem e não podem fazer.",
  alternates: { canonical: "/numeros/sabedoria" },
};

export default function SabedoriaPage() {
  return <NumerosWisdom />;
}
