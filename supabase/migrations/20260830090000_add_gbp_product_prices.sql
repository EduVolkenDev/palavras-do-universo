-- Adds UK market prices while preserving BRL as the base product currency.
-- The app uses this same matrix to create Stripe Checkout Sessions in BRL or GBP.

with market_prices(product_key, brl_cents, gbp_cents) as (
  values
    ('mensagem_do_dia', 0, 0),
    ('carta_do_dia', 0, 0),
    ('caminho_3_cartas', 990, 990),
    ('sinais_do_amor', 1290, 1290),
    ('energia_da_semana', 1490, 1490),
    ('relacionar', 1490, 1490),
    ('clareza_urgente', 1990, 1990),
    ('tirada_diamante', 1990, 1990),
    ('mapa_do_momento', 1990, 1990),
    ('o_paradoxo', 1990, 1990),
    ('passaro_voando', 2290, 2490),
    ('a_chave', 2490, 2490),
    ('o_espelho', 2990, 2990),
    ('cruz_celta', 2990, 2990),
    ('circulo_do_universo', 2990, 2990),
    ('teste_checkout_50', 50, 50)
)
update public.oracle_products as product
set
  metadata = coalesce(product.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'market_prices',
      jsonb_build_object('BRL', prices.brl_cents, 'GBP', prices.gbp_cents),
      'default_market',
      'br',
      'uk_market_pricing_added_at',
      '2026-08-30'
    ),
  updated_at = now()
from market_prices as prices
where product.product_key = prices.product_key;
