import type { MetadataRoute } from "next";

const siteUrl = "https://palavrasdouniverso.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/entrar", "/meu-universo", "/profissionais/me"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
