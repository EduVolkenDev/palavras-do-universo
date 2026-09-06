import type { MetadataRoute } from "next";

const siteUrl = "https://palavrasdouniverso.com";

const publicRoutes = [
  "/",
  "/lab",
  "/clareza-urgente",
  "/carta-do-dia",
  "/baralho",
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
  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
