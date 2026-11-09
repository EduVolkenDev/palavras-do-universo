import { redirect } from "next/navigation";
import { AstrologyOverview } from "@/components/astrology/AstrologyOverview";
import { normalizeMarketingAttribution } from "@/lib/marketing/attribution";

export const metadata = {
  title: "Astrologia | Palavras do Universo",
  description: "Conheça o céu diário, o pulso cósmico, o mapa natal, o seu tempo e as convergências simbólicas do Palavras do Universo.",
  alternates: { canonical: "/astrologia" },
};

export default async function AstrologyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  // The public astrology overview must never wait for Supabase auth.
  // Only the explicit legacy chart-entry URL retains its redirect.
  if (params.access === "active" && params.overview !== "1") {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
    }
    redirect(`/astrologia/mapa${query.toString() ? `?${query.toString()}` : ""}`);
  }

  return <AstrologyOverview attribution={normalizeMarketingAttribution(params)} />;
}
