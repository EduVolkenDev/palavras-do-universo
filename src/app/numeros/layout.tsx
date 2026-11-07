import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NumerosShell } from "@/components/numeros/NumerosShell";

export const metadata: Metadata = {
  title: "Números de intenção | Palavras do Universo",
  description:
    "Sequências de Grabovoi para sintonizar intenção e frequência: escrever, vibrar e abrir o portal de cada código. Prática de ressonância com geometria e propósito.",
  alternates: { canonical: "/numeros" },
};

export default function NumerosLayout({ children }: { children: ReactNode }) {
  return <NumerosShell>{children}</NumerosShell>;
}
