export const PRODUCT_CURRENCIES = ["BRL", "GBP"] as const;

export type ProductCurrency = (typeof PRODUCT_CURRENCIES)[number];
export type ProductMarket = "br" | "uk";

export const PRODUCT_CURRENCY_STORAGE_KEY = "pdu_product_currency";
export const PRODUCT_CURRENCY_OVERRIDE_STORAGE_KEY = "pdu_product_currency_override";
export const PRODUCT_CURRENCY_COOKIE_NAME = "pdu_product_currency";

export type ProductPrice = {
  amountCents: number;
  currency: ProductCurrency;
};

export const PRODUCT_PRICE_MATRIX: Record<
  string,
  Record<ProductCurrency, number>
> = {
  mensagem_do_dia: { BRL: 0, GBP: 0 },
  carta_do_dia: { BRL: 0, GBP: 0 },
  caminho_3_cartas: { BRL: 1290, GBP: 600 },
  sinais_do_amor: { BRL: 1590, GBP: 700 },
  energia_da_semana: { BRL: 1790, GBP: 800 },
  relacionar: { BRL: 1790, GBP: 800 },
  clareza_urgente: { BRL: 2290, GBP: 1000 },
  tirada_diamante: { BRL: 2290, GBP: 1000 },
  mapa_do_momento: { BRL: 2290, GBP: 1000 },
  o_paradoxo: { BRL: 2290, GBP: 1000 },
  passaro_voando: { BRL: 2690, GBP: 1200 },
  a_chave: { BRL: 2990, GBP: 1400 },
  o_espelho: { BRL: 3490, GBP: 1600 },
  cruz_celta: { BRL: 3490, GBP: 1600 },
  circulo_do_universo: { BRL: 4990, GBP: 2000 },
  teste_checkout_50: { BRL: 50, GBP: 50 },
};

export function normalizeProductCurrency(value: unknown): ProductCurrency | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized === "BRL" || normalized === "GBP" ? normalized : null;
}

export function normalizeProductMarket(value: unknown): ProductMarket | null {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (["br", "brl", "brasil", "brazil", "pt", "pt-br"].includes(normalized)) {
    return "br";
  }

  if (["uk", "gb", "gbp", "en", "en-gb"].includes(normalized)) {
    return "uk";
  }

  return null;
}

export function currencyForProductMarket(market: ProductMarket): ProductCurrency {
  return market === "uk" ? "GBP" : "BRL";
}

export function marketForProductCurrency(currency: ProductCurrency): ProductMarket {
  return currency === "GBP" ? "uk" : "br";
}

export function currencyForCountry(country: unknown): ProductCurrency | null {
  const normalized = String(country ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized) || normalized === "XX") return null;
  return normalized === "BR" ? "BRL" : "GBP";
}

export function getDefaultProductCurrency(locale?: string | null): ProductCurrency {
  return String(locale ?? "").toLowerCase().startsWith("en") ? "GBP" : "BRL";
}

export function resolveProductCurrency(params: {
  currency?: unknown;
  market?: unknown;
  country?: unknown;
  locale?: string | null;
}): ProductCurrency {
  const explicitCurrency = normalizeProductCurrency(params.currency);
  if (explicitCurrency) return explicitCurrency;

  const market = normalizeProductMarket(params.market);
  if (market) return currencyForProductMarket(market);

  const countryCurrency = currencyForCountry(params.country);
  if (countryCurrency) return countryCurrency;

  return getDefaultProductCurrency(params.locale);
}

export function getProductPriceForCurrency(
  productKey: string,
  currency: ProductCurrency
): ProductPrice | null {
  const priceMap = PRODUCT_PRICE_MATRIX[productKey];
  if (!priceMap) return null;
  return {
    amountCents: priceMap[currency],
    currency,
  };
}

export function formatPriceCents(
  amountCents: number,
  currency: ProductCurrency
) {
  if (currency === "GBP") {
    return `£${(amountCents / 100).toFixed(2)}`;
  }

  return `R$${(amountCents / 100).toFixed(2).replace(".", ",")}`;
}

export function formatProductPrice(productKey: string, currency: ProductCurrency) {
  const price = getProductPriceForCurrency(productKey, currency);
  return price ? formatPriceCents(price.amountCents, price.currency) : "";
}
