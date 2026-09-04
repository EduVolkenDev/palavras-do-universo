"use client";

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  PRODUCT_CURRENCY_COOKIE_NAME,
  PRODUCT_CURRENCY_OVERRIDE_STORAGE_KEY,
  PRODUCT_CURRENCY_STORAGE_KEY,
  getDefaultProductCurrency,
  normalizeProductCurrency,
  type ProductCurrency,
} from "@/lib/product/pricing";

type ProductCurrencyContextValue = {
  currency: ProductCurrency;
  setCurrency: (currency: ProductCurrency) => void;
};

const ProductCurrencyContext = createContext<ProductCurrencyContextValue | null>(null);

function readBrowserCurrency(fallback: ProductCurrency): ProductCurrency {
  if (typeof window === "undefined") return fallback;

  const params = new URLSearchParams(window.location.search);
  const urlCurrency = normalizeProductCurrency(params.get("currency"));
  if (urlCurrency) return urlCurrency;

  try {
    const storedCurrency = normalizeProductCurrency(
      window.localStorage.getItem(PRODUCT_CURRENCY_STORAGE_KEY)
    );
    const isManualOverride =
      window.localStorage.getItem(PRODUCT_CURRENCY_OVERRIDE_STORAGE_KEY) === "1";
    if (storedCurrency && isManualOverride) return storedCurrency;
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }

  return fallback;
}

function persistBrowserCurrency(nextCurrency: ProductCurrency) {
  try {
    window.localStorage.setItem(PRODUCT_CURRENCY_STORAGE_KEY, nextCurrency);
    window.localStorage.setItem(PRODUCT_CURRENCY_OVERRIDE_STORAGE_KEY, "1");
  } catch {
    // The visible preference still applies for this session.
  }

  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${PRODUCT_CURRENCY_COOKIE_NAME}=${nextCurrency}; path=/; max-age=31536000; samesite=lax${secure}`;
  } catch {
    // Cookie persistence is best-effort; the visible preference is primary.
  }
}

function updateCurrencyUrl(nextCurrency: ProductCurrency) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("currency", nextCurrency);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // URL synchronization is best-effort.
  }
}

function emitCurrencyChange(nextCurrency: ProductCurrency) {
  window.dispatchEvent(
    new CustomEvent("pdu:currency-changed", {
      detail: { currency: nextCurrency },
    })
  );
}

export function ProductCurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: ProductCurrency;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<ProductCurrency>(initialCurrency);
  const setCurrency = useCallback((nextCurrency: ProductCurrency) => {
    setCurrencyState(nextCurrency);
    persistBrowserCurrency(nextCurrency);
    updateCurrencyUrl(nextCurrency);
    emitCurrencyChange(nextCurrency);
  }, []);

  useEffect(() => {
    const preferredCurrency = readBrowserCurrency(initialCurrency);
    const timer = window.setTimeout(() => {
      setCurrencyState((currentCurrency) =>
        currentCurrency === preferredCurrency ? currentCurrency : preferredCurrency
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialCurrency]);

  const value = useMemo(
    () => ({ currency, setCurrency }),
    [currency, setCurrency]
  );

  return createElement(ProductCurrencyContext.Provider, { value }, children);
}

export function useProductCurrency(locale: string) {
  const context = useContext(ProductCurrencyContext);
  const fallbackCurrency = getDefaultProductCurrency(locale);
  const [localCurrency, setLocalCurrencyState] = useState<ProductCurrency>(fallbackCurrency);
  const setLocalCurrency = useCallback((nextCurrency: ProductCurrency) => {
    setLocalCurrencyState(nextCurrency);
    persistBrowserCurrency(nextCurrency);
    updateCurrencyUrl(nextCurrency);
    emitCurrencyChange(nextCurrency);
  }, []);

  useEffect(() => {
    if (context) return;
    const preferredCurrency = readBrowserCurrency(getDefaultProductCurrency(locale));
    const timer = window.setTimeout(() => {
      setLocalCurrencyState((currentCurrency) =>
        currentCurrency === preferredCurrency ? currentCurrency : preferredCurrency
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [context, locale]);

  if (context) return context;
  return { currency: localCurrency, setCurrency: setLocalCurrency };
}
