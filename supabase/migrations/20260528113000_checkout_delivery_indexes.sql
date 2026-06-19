alter table public.oracle_products
  add column if not exists provider_price_id text,
  add column if not exists provider_product_id text;
alter table public.subscriptions
  add column if not exists provider_checkout_id text;
create unique index if not exists purchases_provider_checkout_id_idx
  on public.purchases (provider_checkout_id)
  where provider_checkout_id is not null;
create unique index if not exists subscriptions_provider_checkout_id_idx
  on public.subscriptions (provider_checkout_id)
  where provider_checkout_id is not null;
create unique index if not exists subscriptions_provider_subscription_id_idx
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists oracle_products_provider_price_idx
  on public.oracle_products (provider_price_id)
  where provider_price_id is not null;
