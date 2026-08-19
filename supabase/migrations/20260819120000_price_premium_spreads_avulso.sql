-- Premium spreads can be bought standalone while remaining included in
-- Círculo do Universo. One-time spread checkouts use Stripe Checkout
-- price_data, so provider_price_id can remain null for these products.

with spread_prices(product_key, price_cents, cta_label, value_position) as (
  values
    ('energia_da_semana', 1490, 'Fazer Energia da Semana', 'Compra avulsa semanal ou acesso recorrente pelo Círculo.'),
    ('mapa_do_momento', 1990, 'Fazer Mapa do Momento', 'Compra avulsa de contexto ou acesso recorrente pelo Círculo.'),
    ('tirada_diamante', 1990, 'Fazer O Diamante', 'Compra avulsa premium ou acesso recorrente pelo Círculo.'),
    ('passaro_voando', 2290, 'Fazer O Pássaro Voando', 'Compra avulsa premium ou acesso recorrente pelo Círculo.'),
    ('a_chave', 2490, 'Fazer A Chave', 'Compra avulsa premium ou acesso recorrente pelo Círculo.'),
    ('o_espelho', 2990, 'Fazer O Espelho', 'Compra avulsa premium ou acesso recorrente pelo Círculo.'),
    ('cruz_celta', 2990, 'Fazer Cruz Celta', 'Compra avulsa premium ou acesso recorrente pelo Círculo.'),
    ('relacionar', 1490, 'Fazer Relacionar', 'Compra avulsa relacional ou acesso recorrente pelo Círculo.'),
    ('o_paradoxo', 1990, 'Fazer O Paradoxo', 'Compra avulsa premium ou acesso recorrente pelo Círculo.')
)
update public.oracle_products as product
set
  product_type = 'one_time',
  access_model = 'one_time',
  status = 'active',
  price_cents = spread.price_cents,
  currency = 'BRL',
  cta_label = spread.cta_label,
  value_position = spread.value_position,
  included_in = array['circulo_do_universo']::text[],
  metadata = coalesce(product.metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'standalone_price_cents',
      spread.price_cents,
      'included_in_circle',
      true,
      'pricing_model',
      'one_time_or_circle',
      'priced_by',
      '20260819120000_price_premium_spreads_avulso'
    ),
  updated_at = now()
from spread_prices as spread
where product.product_key = spread.product_key;

update public.oracle_product_features
set
  label = 'Avulsa ou Círculo',
  description = 'Pode ser comprada uma vez ou aberta por assinantes do Círculo.',
  feature_type = 'premium'
where product_key in ('energia_da_semana', 'mapa_do_momento')
  and label = 'Incluído no Círculo';

insert into public.oracle_product_features (
  product_key,
  label,
  description,
  feature_type,
  sort_order
)
select
  product.product_key,
  'Avulsa ou Círculo',
  'Compra única para esta tirada ou acesso incluído no Círculo do Universo.',
  'premium',
  90
from (
  values
    ('tirada_diamante'),
    ('passaro_voando'),
    ('a_chave'),
    ('o_espelho'),
    ('cruz_celta'),
    ('relacionar'),
    ('o_paradoxo')
) as product(product_key)
where not exists (
  select 1
  from public.oracle_product_features as feature
  where feature.product_key = product.product_key
    and feature.label = 'Avulsa ou Círculo'
);
