import { notFound } from "next/navigation";
import { AstrologyChartExperience } from "@/components/astrology/AstrologyChartExperience";

export default function AstrologyArtworkPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
  const signs = ["sagittarius", "taurus", "gemini", "libra", "aries", "cancer", "capricorn", "aquarius", "pisces", "scorpio"] as const;

  return (
    <>
      <div className="bg-[#241b18] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#f5d896]">
        Prévia visual · dados fictícios · nada foi salvo
      </div>
      <AstrologyChartExperience previewChart={{
        locationLabel: "Cidade de exemplo · dados de demonstração",
        houseSystem: "whole-sign",
        ascendant: { sign: "capricorn", degreesInSign: 7.7 },
        positions: bodies.map((body, index) => ({ body, sign: signs[index], degreesInSign: 10 + index, house: index + 1 })),
        aspects: [
          { firstBody: "Sun", secondBody: "Jupiter", type: "trine", orb: 1.2 },
          { firstBody: "Moon", secondBody: "Saturn", type: "square", orb: 2.1 },
          { firstBody: "Mercury", secondBody: "Venus", type: "sextile", orb: 0.8 },
          { firstBody: "Mars", secondBody: "Pluto", type: "opposition", orb: 2.7 },
          { firstBody: "Uranus", secondBody: "Neptune", type: "conjunction", orb: 1.4 },
        ],
      }} />
    </>
  );
}
