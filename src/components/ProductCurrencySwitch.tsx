"use client";

import type { ProductCurrency } from "@/lib/product/pricing";

type ProductCurrencySwitchProps = {
  currency: ProductCurrency;
  locale: string;
  onChange: (currency: ProductCurrency) => void;
  className?: string;
  tone?: "light" | "dark";
};

const options: {
  currency: ProductCurrency;
  label: string;
  symbol: string;
  region: Record<"pt-BR" | "en", string>;
}[] = [
  {
    currency: "BRL",
    label: "BRL",
    symbol: "R$",
    region: { "pt-BR": "Brasil", en: "Brazil" },
  },
  {
    currency: "GBP",
    label: "GBP",
    symbol: "£",
    region: { "pt-BR": "Reino Unido", en: "United Kingdom" },
  },
];

export function ProductCurrencySwitch({
  currency,
  locale,
  onChange,
  className = "",
  tone = "light",
}: ProductCurrencySwitchProps) {
  const normalizedLocale = locale === "en" ? "en" : "pt-BR";
  const ariaLabel =
    normalizedLocale === "en" ? "Choose product currency" : "Escolher moeda dos produtos";

  return (
    <div
      className={`pdu-currency-switch pdu-currency-switch--${tone} ${className}`}
      aria-label={ariaLabel}
      role="group"
    >
      {options.map((option) => (
        <button
          key={option.currency}
          type="button"
          aria-pressed={currency === option.currency}
          className="pdu-currency-switch__option"
          onClick={() => onChange(option.currency)}
        >
          <span className="pdu-currency-switch__symbol">{option.symbol}</span>
          <span>
            <strong>{option.label}</strong>
            <small>{option.region[normalizedLocale]}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
