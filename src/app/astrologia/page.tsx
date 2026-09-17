import { redirect } from "next/navigation";
import { AstrologyOverview } from "@/components/astrology/AstrologyOverview";

export const metadata = {
  title: "Astrologia | Palavras do Universo",
  description: "Conheça o céu diário, o pulso cósmico, o mapa natal, o seu tempo e as convergências simbólicas do Palavras do Universo.",
};

export default async function AstrologyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const product = Array.isArray(params.product) ? params.product[0] : params.product;
  const legacyMapEntry = params.access === "active" || product === "mapa_astral";
  if (legacyMapEntry) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
    }
    redirect(`/astrologia/mapa${query.toString() ? `?${query.toString()}` : ""}`);
  }

  return <AstrologyOverview />;
}
