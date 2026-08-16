import type { Metadata } from "next";
import { DailyCardExperience } from "./DailyCardExperience";
import { normalizeLocale } from "@/lib/i18n/config";
import { translations } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const locale = normalizeLocale((await searchParams)?.lang);
  const title = "Carta do Dia | Palavras do Universo";
  const description =
    "Uma orientação diária para atravessar o dia com mais presença, clareza e intenção.";

  return {
    title: locale === "en" ? translations.en[title] ?? title : title,
    description:
      locale === "en" ? translations.en[description] ?? description : description,
  };
}

export default function CartaDoDiaPage() {
  return <DailyCardExperience />;
}
