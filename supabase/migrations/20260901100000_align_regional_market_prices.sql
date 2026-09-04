-- Align regional prices with the product value ladder.
-- BRL remains the base market; GBP is intentionally localized instead of
-- copying the numeric BRL amount. The Circle uses inline price_data until its
-- recurring Stripe Price is replaced with the new BRL amount.

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
  metadata = coalesce(product.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'market_prices',
      jsonb_build_object('BRL', prices.brl_cents, 'GBP', prices.gbp_cents),
      'default_market',
      'br',
      'pricing_revision',
      '2026-09-01-regional-value-ladder',
      'pricing_source',
      case
        when prices.product_key = 'circulo_do_universo' then 'inline'
        else 'inline'
      end
    ),
  updated_at = now()
from market_prices as prices
where product.product_key = prices.product_key;
