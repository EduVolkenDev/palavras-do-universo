import type { Metadata } from "next";
import { Suspense } from "react";
import { NumerosPractice } from "@/components/numeros/NumerosPractice";

export const metadata: Metadata = {
  title: "Prática guiada | Números de intenção",
  description: "Três minutos: respiração, a sequência escrita uma vez, e uma pergunta.",
  alternates: { canonical: "/numeros/praticar" },
};

export default function PraticarPage() {
  return (
    <Suspense>
      <NumerosPractice />
    </Suspense>
  );
}
