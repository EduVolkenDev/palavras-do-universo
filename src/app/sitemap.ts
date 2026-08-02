import type { MetadataRoute } from "next";

const siteUrl = "https://palavrasdouniverso.com";

const publicRoutes = [
  "/",
  "/carta-do-dia",
  "/baralho",
  "/tiradas",
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
