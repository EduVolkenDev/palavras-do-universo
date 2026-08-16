-- Keep the database product contract aligned with the app access rules.
-- Círculo do Universo includes the core recurring readings and premium spreads.
-- Clareza Urgente remains a separate one-time urgent reading.

update public.oracle_products
set
  included_in = array['circulo_do_universo']::text[],
  updated_at = now()
where product_key in (
  'caminho_3_cartas',
  'sinais_do_amor',
  'energia_da_semana',
  'mapa_do_momento',
  'tirada_diamante',
  'passaro_voando',
  'a_chave',
  'o_espelho',
  'cruz_celta',
  'relacionar',
  'o_paradoxo'
);

update public.oracle_products
set
  included_in = array[]::text[],
  updated_at = now()
where product_key = 'clareza_urgente';

with active_circle_entitlements as (
  select
    entitlement.user_id,
    entitlement.source,
    entitlement.expires_at,
    entitlement.usage_limit,
    entitlement.usage_count,
    entitlement.metadata
  from public.user_entitlements as entitlement
  where entitlement.product_key = 'circulo_do_universo'
    and entitlement.status = 'active'
    and (entitlement.expires_at is null or entitlement.expires_at > now())
),
included_products as (
  select unnest(array[
    'caminho_3_cartas',
    'sinais_do_amor',
    'energia_da_semana',
    'mapa_do_momento',
    'tirada_diamante',
    'passaro_voando',
    'a_chave',
    'o_espelho',
    'cruz_celta',
    'relacionar',
    'o_paradoxo'
  ]::text[]) as product_key
)
insert into public.user_entitlements (
  user_id,
  product_key,
  source,
  status,
  starts_at,
  expires_at,
  usage_limit,
  usage_count,
  consumed_at,
  metadata,
  created_at,
  updated_at
)
select
  circle.user_id,
  product.product_key,
  circle.source,
  'active',
  now(),
  circle.expires_at,
  circle.usage_limit,
  circle.usage_count,
  null,
  coalesce(circle.metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'included_by',
      'circulo_do_universo',
      'backfilled_by',
      '20260816123000_align_circle_included_products'
    ),
  now(),
  now()
from active_circle_entitlements as circle
cross join included_products as product
where not exists (
  select 1
  from public.user_entitlements as existing
  where existing.user_id = circle.user_id
    and existing.product_key = product.product_key
    and existing.source = circle.source
    and existing.status = 'active'
    and (existing.expires_at is null or existing.expires_at > now())
);
