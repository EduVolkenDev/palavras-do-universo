import type { MetadataRoute } from "next";
import { codes } from "@/lib/numeros/codes";
import { TAROT_CARD_CATALOG } from "@/lib/tarot/cardCatalog";

const siteUrl = "https://palavrasdouniverso.com";

const publicRoutes = [
  "/",
  "/astrologia",
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
  "/numeros",
  "/numeros/biblioteca",
  "/numeros/praticar",
  "/numeros/sabedoria",
  "/profissionais",
  "/termos",
  "/privacidade",
  "/reembolsos",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const cardRoutes = TAROT_CARD_CATALOG.map((card) => `/significados/tarot/${card.key}`);
  const numberRoutes = codes.map((code) => `/numeros/${code.slug}`);

  return [...publicRoutes, ...cardRoutes, ...numberRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/significados/tarot/") ? 0.65 : 0.7,
  }));
}
