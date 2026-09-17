-- Astrology is a separate one-time product, included automatically in the Circle.
-- The application keeps the same market-price matrix for BRL and GBP checkout.

insert into public.oracle_products (
  product_key,
  title,
  product_type,
  status,
  price_cents,
  currency,
  access_model,
  provider_price_id,
  included_in,
  metadata
)
values (
  'mapa_astral',
  'Mapa Astral Completo',
  'one_time',
  'active',
  3990,
  'BRL',
  'one_time',
  null,
  array['circulo_do_universo']::text[],
  jsonb_build_object(
    'category', 'astrology',
    'tier', 'complete',
    'market_prices', jsonb_build_object('BRL', 3990, 'GBP', 1700),
    'included_in_circle', true
  )
)
on conflict (product_key) do update
set
  title = excluded.title,
  product_type = excluded.product_type,
  status = excluded.status,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  access_model = excluded.access_model,
  included_in = excluded.included_in,
  metadata = coalesce(public.oracle_products.metadata, '{}'::jsonb) || excluded.metadata,
  updated_at = now();
