-- Reconcile the live catalog with the public pricing contract.
-- The previous pricing migration is already recorded remotely, but some rows
-- retained the older BRL amounts and provider pricing metadata. Keep existing
-- provider ids for auditability while forcing checkout to use the current
-- regional inline matrix until those prices are intentionally replaced.

with market_prices(product_key, brl_cents, gbp_cents) as (
  values
    ('mensagem_do_dia', 0, 0),
    ('carta_do_dia', 0, 0),
    ('caminho_3_cartas', 1290, 600),
    ('sinais_do_amor', 1590, 700),
    ('energia_da_semana', 1790, 800),
    ('relacionar', 1790, 800),
    ('clareza_urgente', 2290, 1000),
    ('tirada_diamante', 2290, 1000),
    ('mapa_do_momento', 2290, 1000),
    ('o_paradoxo', 2290, 1000),
    ('passaro_voando', 2690, 1200),
    ('a_chave', 2990, 1400),
    ('o_espelho', 3490, 1600),
    ('cruz_celta', 3490, 1600),
    ('circulo_do_universo', 4990, 2000),
    ('teste_checkout_50', 50, 50)
)
update public.oracle_products as product
set
  price_cents = prices.brl_cents,
  currency = 'BRL',
  metadata = coalesce(product.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'market_prices',
      jsonb_build_object('BRL', prices.brl_cents, 'GBP', prices.gbp_cents),
      'default_market', 'br',
      'pricing_revision', '2026-09-08-public-launch',
      'pricing_source', 'inline'
    ),
  updated_at = now()
from market_prices as prices
where product.product_key = prices.product_key
  and product.status = 'active';
