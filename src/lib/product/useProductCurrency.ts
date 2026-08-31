"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PRODUCT_CURRENCY_STORAGE_KEY,
  getDefaultProductCurrency,
  normalizeProductCurrency,
  type ProductCurrency,
} from "@/lib/product/pricing";

function readBrowserCurrency(locale: string): ProductCurrency {
  if (typeof window === "undefined") return getDefaultProductCurrency(locale);

  const params = new URLSearchParams(window.location.search);
  const urlCurrency = normalizeProductCurrency(params.get("currency"));
  if (urlCurrency) return urlCurrency;

  try {
    const storedCurrency = normalizeProductCurrency(
      window.localStorage.getItem(PRODUCT_CURRENCY_STORAGE_KEY)
    );
    if (storedCurrency) return storedCurrency;
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }

  return getDefaultProductCurrency(locale);
}

export function useProductCurrency(locale: string) {
  const [currency, setCurrencyState] = useState<ProductCurrency>(() =>
    getDefaultProductCurrency(locale)
  );

  useEffect(() => {
    const nextCurrency = readBrowserCurrency(locale);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setCurrencyState(nextCurrency);
    }, 0);

    try {
      window.localStorage.setItem(PRODUCT_CURRENCY_STORAGE_KEY, nextCurrency);
    } catch {
      // Non-blocking preference persistence.
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [locale]);

  const setCurrency = useCallback((nextCurrency: ProductCurrency) => {
    setCurrencyState(nextCurrency);

    try {
      window.localStorage.setItem(PRODUCT_CURRENCY_STORAGE_KEY, nextCurrency);
    } catch {
      // Non-blocking preference persistence.
    }

    const url = new URL(window.location.href);
    url.searchParams.set("currency", nextCurrency);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(
      new CustomEvent("pdu:currency-changed", {
        detail: { currency: nextCurrency },
      })
    );
  }, []);

  return { currency, setCurrency };
}
