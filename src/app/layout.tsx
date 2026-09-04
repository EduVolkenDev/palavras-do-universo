import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import LumeGuide from "@/components/LumeGuide";
import SiteTelemetry from "@/components/SiteTelemetry";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/config";
import { ProductCurrencyProvider } from "@/lib/product/useProductCurrency";
import {
  PRODUCT_CURRENCY_COOKIE_NAME,
  normalizeProductCurrency,
  resolveProductCurrency,
} from "@/lib/product/pricing";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://palavrasdouniverso.com"),
  title: "Palavras do Universo",
  description:
    "Mensagens diárias, tarot e orientação simbólica para atravessar o dia com mais clareza.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#151326",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const initialLocale = normalizeLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? "pt-BR"
  );
  const initialProductCurrency = resolveProductCurrency({
    currency: normalizeProductCurrency(
      cookieStore.get(PRODUCT_CURRENCY_COOKIE_NAME)?.value
    ),
    country: requestHeaders.get("x-vercel-ip-country"),
    locale: initialLocale,
  });

  return (
    <html lang={initialLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider initialLocale={initialLocale}>
          <ProductCurrencyProvider initialCurrency={initialProductCurrency}>
            <SiteTelemetry />
            {children}
            <LumeGuide />
          </ProductCurrencyProvider>
          <LanguageSwitcher />
        </I18nProvider>
      </body>
    </html>
  );
}
