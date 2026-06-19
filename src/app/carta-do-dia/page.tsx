import type { Metadata } from "next";
import { DailyCardExperience } from "./DailyCardExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carta do Dia | Palavras do Universo",
  description:
    "Uma orientação diária para atravessar o dia com mais presença, clareza e intenção.",
};

export default function CartaDoDiaPage() {
  return <DailyCardExperience />;
}
