import type { MetadataRoute } from "next";
import { TAROT_CARD_CATALOG } from "@/lib/tarot/cardCatalog";

const siteUrl = "https://palavrasdouniverso.com";

const publicRoutes = [
  "/",
  "/lab",
  "/clareza-urgente",
  "/carta-do-dia",
  "/baralho",
  "/significados/tarot",
  "/tiradas",
  "/tiradas/diamante",
  "/tiradas/passaro-voando",
  "/tiradas/a-chave",
  "/tiradas/o-espelho",
  "/tiradas/cruz-celta",
  "/tiradas/relacionar",
  "/tiradas/o-paradoxo",
  "/profissionais",
  "/termos",
  "/privacidade",
  "/reembolsos",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const cardRoutes = TAROT_CARD_CATALOG.map((card) => `/significados/tarot/${card.key}`);

  return [...publicRoutes, ...cardRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/significados/tarot/") ? 0.65 : 0.7,
  }));
}
