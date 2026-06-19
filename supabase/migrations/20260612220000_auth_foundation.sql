-- Auth and ownership baseline for Palavras do Universo.
-- IDs are text so existing browser-local identities can be migrated later,
-- while authenticated identities use auth.uid()::text.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id text primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  theme text not null,
  question text not null,
  sanitized_question text,
  mode text not null,
  intent_key text,
  spread_type text not null,
  spread jsonb not null default '[]'::jsonb,
  interpretation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  reading_id uuid references public.readings(id) on delete set null,
  client_key text,
  message_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.saved_messages add column if not exists client_key text;

create table if not exists public.usage_daily (
  user_id text not null references public.profiles(id) on delete cascade,
  day date not null,
  free_readings_used integer not null default 0 check (free_readings_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.oracle_products (
  product_key text primary key,
  title text not null,
  product_type text not null check (product_type in ('free', 'one_time', 'subscription')),
  status text not null default 'draft',
  price_cents integer,
  currency text not null default 'BRL',
  access_model text,
  provider_price_id text,
  included_in text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_key text not null references public.oracle_products(product_key),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BRL',
  status text not null,
  provider text not null,
  provider_checkout_id text unique,
  provider_payment_id text,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  plan text not null,
  product_key text not null references public.oracle_products(product_key),
  status text not null,
  provider text not null,
  provider_checkout_id text unique,
  provider_customer_id text,
  provider_subscription_id text unique,
  price_cents integer,
  currency text not null default 'BRL',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_key text not null references public.oracle_products(product_key),
  source text not null check (source in ('purchase', 'subscription', 'admin')),
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  consumed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  user_id text,
  product_key text,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (provider, provider_event_id)
);

create index if not exists readings_user_created_idx
  on public.readings (user_id, created_at desc);
create index if not exists saved_messages_user_created_idx
  on public.saved_messages (user_id, created_at desc);
create unique index if not exists saved_messages_user_client_key_idx
  on public.saved_messages (user_id, client_key);
create index if not exists user_entitlements_user_product_idx
  on public.user_entitlements (user_id, product_key, status);
create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);
create index if not exists subscriptions_user_created_idx
  on public.subscriptions (user_id, created_at desc);

create or replace view public.available_entitlements
with (security_invoker = true)
as
select
  entitlement.id,
  entitlement.user_id,
  entitlement.product_key,
  product.title,
  product.product_type,
  product.access_model,
  entitlement.source,
  entitlement.status,
  entitlement.starts_at,
  entitlement.expires_at,
  entitlement.usage_limit,
  entitlement.usage_count,
  entitlement.consumed_at,
  entitlement.metadata
from public.user_entitlements as entitlement
join public.oracle_products as product
  on product.product_key = entitlement.product_key
where entitlement.status = 'active'
  and (entitlement.expires_at is null or entitlement.expires_at > now())
  and (
    entitlement.usage_limit is null
    or entitlement.usage_count < entitlement.usage_limit
  );

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, auth_user_id)
  values (new.id::text, new.email, new.id)
  on conflict (id) do update
    set
      email = excluded.email,
      auth_user_id = excluded.auth_user_id,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.readings enable row level security;
alter table public.saved_messages enable row level security;
alter table public.usage_daily enable row level security;
alter table public.purchases enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.oracle_products enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (
    auth_user_id = auth.uid()
    or (auth_user_id is null and id = auth.uid()::text)
  );
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "readings_select_own" on public.readings;
create policy "readings_select_own" on public.readings
  for select using (
    exists (
      select 1 from public.profiles profile
      where profile.id = readings.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "saved_messages_select_own" on public.saved_messages;
create policy "saved_messages_select_own" on public.saved_messages
  for select using (
    exists (
      select 1 from public.profiles profile
      where profile.id = saved_messages.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "saved_messages_insert_own" on public.saved_messages;
create policy "saved_messages_insert_own" on public.saved_messages
  for insert with check (
    exists (
      select 1 from public.profiles profile
      where profile.id = saved_messages.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "usage_daily_select_own" on public.usage_daily;
create policy "usage_daily_select_own" on public.usage_daily
  for select using (
    exists (
      select 1 from public.profiles profile
      where profile.id = usage_daily.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases
  for select using (
    exists (
      select 1 from public.profiles profile
      where profile.id = purchases.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (
    exists (
      select 1 from public.profiles profile
      where profile.id = subscriptions.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "entitlements_select_own" on public.user_entitlements;
create policy "entitlements_select_own" on public.user_entitlements
  for select using (
    exists (
      select 1 from public.profiles profile
      where profile.id = user_entitlements.user_id
        and (profile.auth_user_id = auth.uid() or (profile.auth_user_id is null and profile.id = auth.uid()::text))
    )
  );
drop policy if exists "products_select_active" on public.oracle_products;
create policy "products_select_active" on public.oracle_products
  for select using (status = 'active');

revoke all on public.payment_events from anon, authenticated;

insert into public.oracle_products (
  product_key,
  title,
  product_type,
  status,
  price_cents,
  currency,
  access_model,
  included_in
)
values
  ('mensagem_do_dia', 'Mensagem do Dia', 'free', 'active', 0, 'BRL', 'free', array[]::text[]),
  ('carta_do_dia', 'Carta do Dia', 'free', 'active', 0, 'BRL', 'free', array[]::text[]),
  ('clareza_urgente', 'Clareza Urgente', 'one_time', 'active', 1990, 'BRL', 'one_time', array[]::text[]),
  ('caminho_3_cartas', 'Caminho das 3 Cartas', 'one_time', 'active', 990, 'BRL', 'one_time', array[]::text[]),
  ('sinais_do_amor', 'Sinais do Amor', 'one_time', 'active', 1290, 'BRL', 'one_time', array[]::text[]),
  ('energia_da_semana', 'Energia da Semana', 'subscription', 'active', null, 'BRL', 'subscription_included', array['circulo_do_universo']::text[]),
  ('mapa_do_momento', 'Mapa do Momento', 'subscription', 'active', null, 'BRL', 'subscription_included', array['circulo_do_universo']::text[]),
  ('circulo_do_universo', 'Círculo do Universo', 'subscription', 'active', 2990, 'BRL', 'subscription', array[]::text[])
on conflict (product_key) do update set
  title = excluded.title,
  product_type = excluded.product_type,
  status = excluded.status,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  access_model = excluded.access_model,
  included_in = excluded.included_in,
  updated_at = now();
