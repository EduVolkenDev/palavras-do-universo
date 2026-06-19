alter table public.user_entitlements
  add column if not exists usage_limit int,
  add column if not exists usage_count int not null default 0,
  add column if not exists consumed_at timestamptz;
create index if not exists user_entitlements_available_idx
  on public.user_entitlements (user_id, product_key, status, usage_count, usage_limit);
create or replace view public.available_entitlements as
select
  e.id,
  e.user_id,
  e.product_key,
  p.title,
  p.product_type,
  p.access_model,
  e.source,
  e.status,
  e.starts_at,
  e.expires_at,
  e.usage_limit,
  e.usage_count,
  e.consumed_at,
  e.metadata
from public.user_entitlements e
join public.oracle_products p on p.product_key = e.product_key
where e.status = 'active'
  and (e.expires_at is null or e.expires_at > now())
  and (e.usage_limit is null or e.usage_count < e.usage_limit);
