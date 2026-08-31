export const PRODUCT_CURRENCIES = ["BRL", "GBP"] as const;

export type ProductCurrency = (typeof PRODUCT_CURRENCIES)[number];
export type ProductMarket = "br" | "uk";

export const PRODUCT_CURRENCY_STORAGE_KEY = "pdu_product_currency";

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
  caminho_3_cartas: { BRL: 990, GBP: 990 },
  sinais_do_amor: { BRL: 1290, GBP: 1290 },
  energia_da_semana: { BRL: 1490, GBP: 1490 },
  relacionar: { BRL: 1490, GBP: 1490 },
  clareza_urgente: { BRL: 1990, GBP: 1990 },
  tirada_diamante: { BRL: 1990, GBP: 1990 },
  mapa_do_momento: { BRL: 1990, GBP: 1990 },
  o_paradoxo: { BRL: 1990, GBP: 1990 },
  passaro_voando: { BRL: 2290, GBP: 2490 },
  a_chave: { BRL: 2490, GBP: 2490 },
  o_espelho: { BRL: 2990, GBP: 2990 },
  cruz_celta: { BRL: 2990, GBP: 2990 },
  circulo_do_universo: { BRL: 2990, GBP: 2990 },
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

export function getDefaultProductCurrency(locale?: string | null): ProductCurrency {
  return String(locale ?? "").toLowerCase().startsWith("en") ? "GBP" : "BRL";
}

export function resolveProductCurrency(params: {
  currency?: unknown;
  market?: unknown;
  locale?: string | null;
}): ProductCurrency {
  const explicitCurrency = normalizeProductCurrency(params.currency);
  if (explicitCurrency) return explicitCurrency;

  const market = normalizeProductMarket(params.market);
  if (market) return currencyForProductMarket(market);

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
