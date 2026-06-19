create extension if not exists pgcrypto;
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
alter table public.profiles
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists locale text not null default 'pt-BR',
  add column if not exists timezone text not null default 'Europe/Lisbon',
  add column if not exists onboarding_status text not null default 'local',
  add column if not exists consent_version text,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists last_seen_at timestamptz;
alter table public.usage_daily
  add column if not exists plan_snapshot text not null default 'free',
  add column if not exists last_reading_at timestamptz;
alter table public.readings
  add column if not exists intent_key text,
  add column if not exists sanitized_question text,
  add column if not exists prompt_version text not null default 'pdu-v1',
  add column if not exists ai_model text,
  add column if not exists safety_flags jsonb not null default '{}'::jsonb,
  add column if not exists share_token text unique,
  add column if not exists is_deleted boolean not null default false;
alter table public.saved_messages
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_favorite boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();
alter table public.subscriptions
  add column if not exists product_key text,
  add column if not exists price_cents int,
  add column if not exists currency text not null default 'BRL',
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.purchases
  add column if not exists provider_payment_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.oracle_products (
  product_key text primary key,
  title text not null,
  product_type text not null,
  status text not null default 'draft',
  price_cents int,
  currency text not null default 'BRL',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_key text not null references public.oracle_products(product_key),
  source text not null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  user_id text references public.profiles(id) on delete set null,
  product_key text references public.oracle_products(product_key),
  status text not null default 'received',
  amount_cents int,
  currency text not null default 'BRL',
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);
create table if not exists public.ritual_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  ritual_date date not null default current_date,
  intention text,
  emotional_weather text,
  prompt text,
  note text,
  source text not null default 'daily',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.reading_feedback (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  resonance_score smallint,
  saved boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_onboarding_status_check') then
    alter table public.profiles add constraint profiles_onboarding_status_check
      check (onboarding_status in ('local', 'started', 'complete'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oracle_products_product_type_check') then
    alter table public.oracle_products add constraint oracle_products_product_type_check
      check (product_type in ('free', 'one_time', 'subscription'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oracle_products_status_check') then
    alter table public.oracle_products add constraint oracle_products_status_check
      check (status in ('draft', 'active', 'coming_soon', 'archived'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_entitlements_source_check') then
    alter table public.user_entitlements add constraint user_entitlements_source_check
      check (source in ('free', 'purchase', 'subscription', 'admin', 'trial'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_entitlements_status_check') then
    alter table public.user_entitlements add constraint user_entitlements_status_check
      check (status in ('pending', 'active', 'expired', 'revoked'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'reading_feedback_resonance_score_check') then
    alter table public.reading_feedback add constraint reading_feedback_resonance_score_check
      check (resonance_score is null or resonance_score between 1 and 5);
  end if;
end;
$$;
insert into public.oracle_products (product_key, title, product_type, status, price_cents, currency, metadata)
values
  ('mensagem_do_dia', 'Mensagem do Dia', 'free', 'active', 0, 'BRL', '{"mode":"daily"}'),
  ('carta_do_dia', 'Carta do Dia', 'free', 'active', 0, 'BRL', '{"mode":"daily_card"}'),
  ('caminho_3_cartas', 'Caminho das 3 Cartas', 'one_time', 'active', null, 'BRL', '{"spread":"situation_shadow_direction"}'),
  ('sinais_do_amor', 'Sinais do Amor', 'one_time', 'active', null, 'BRL', '{"theme":"love"}'),
  ('energia_da_semana', 'Energia da Semana', 'subscription', 'coming_soon', null, 'BRL', '{"cadence":"weekly"}'),
  ('mapa_do_momento', 'Mapa do Momento', 'subscription', 'coming_soon', null, 'BRL', '{"mode":"profile"}'),
  ('circulo_do_universo', 'Círculo do Universo', 'subscription', 'active', 2990, 'BRL', '{"tier":"premium"}')
on conflict (product_key) do update
set
  title = excluded.title,
  product_type = excluded.product_type,
  status = excluded.status,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  metadata = public.oracle_products.metadata || excluded.metadata,
  updated_at = now();
create index if not exists profiles_auth_user_id_idx
  on public.profiles (auth_user_id);
create index if not exists readings_user_intent_created_idx
  on public.readings (user_id, intent_key, created_at desc);
create index if not exists readings_share_token_idx
  on public.readings (share_token)
  where share_token is not null;
create index if not exists saved_messages_favorite_idx
  on public.saved_messages (user_id, is_favorite, created_at desc);
create index if not exists oracle_products_status_idx
  on public.oracle_products (status, product_type);
create index if not exists user_entitlements_user_status_idx
  on public.user_entitlements (user_id, status, expires_at);
create index if not exists user_entitlements_product_idx
  on public.user_entitlements (product_key, status);
create index if not exists payment_events_user_created_idx
  on public.payment_events (user_id, created_at desc);
create index if not exists ritual_entries_user_date_idx
  on public.ritual_entries (user_id, ritual_date desc);
create unique index if not exists reading_feedback_reading_user_idx
  on public.reading_feedback (reading_id, user_id);
create or replace view public.active_entitlements as
select
  e.id,
  e.user_id,
  e.product_key,
  p.title,
  p.product_type,
  e.source,
  e.status,
  e.starts_at,
  e.expires_at,
  e.metadata
from public.user_entitlements e
join public.oracle_products p on p.product_key = e.product_key
where e.status = 'active'
  and (e.expires_at is null or e.expires_at > now());
alter table public.app_settings enable row level security;
alter table public.oracle_products enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.payment_events enable row level security;
alter table public.ritual_entries enable row level security;
alter table public.reading_feedback enable row level security;
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'profiles',
    'saved_messages',
    'subscriptions',
    'purchases',
    'app_settings',
    'oracle_products',
    'user_entitlements',
    'ritual_entries'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', tbl, tbl);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      tbl,
      tbl
    );
  end loop;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_settings' and policyname = 'app_settings_select_public') then
    create policy app_settings_select_public on public.app_settings
      for select
      using (is_public);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'oracle_products' and policyname = 'oracle_products_select_public') then
    create policy oracle_products_select_public on public.oracle_products
      for select
      using (status in ('active', 'coming_soon'));
  end if;
end;
$$;
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'usage_daily',
    'readings',
    'saved_messages',
    'subscriptions',
    'purchases',
    'user_entitlements',
    'ritual_entries',
    'reading_feedback'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_select_own'
    ) then
      execute format(
        'create policy %I on public.%I for select using (exists (select 1 from public.profiles p where p.id = %I.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)))',
        tbl || '_select_own',
        tbl,
        tbl
      );
    end if;
  end loop;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own') then
    create policy profiles_select_own on public.profiles
      for select
      using (auth_user_id = auth.uid() or id = auth.uid()::text);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own') then
    create policy profiles_insert_own on public.profiles
      for insert
      with check (auth_user_id = auth.uid() or id = auth.uid()::text);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own') then
    create policy profiles_update_own on public.profiles
      for update
      using (auth_user_id = auth.uid() or id = auth.uid()::text)
      with check (auth_user_id = auth.uid() or id = auth.uid()::text);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_messages' and policyname = 'saved_messages_update_own') then
    create policy saved_messages_update_own on public.saved_messages
      for update
      using (exists (select 1 from public.profiles p where p.id = saved_messages.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)))
      with check (exists (select 1 from public.profiles p where p.id = saved_messages.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ritual_entries' and policyname = 'ritual_entries_insert_own') then
    create policy ritual_entries_insert_own on public.ritual_entries
      for insert
      with check (exists (select 1 from public.profiles p where p.id = ritual_entries.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ritual_entries' and policyname = 'ritual_entries_update_own') then
    create policy ritual_entries_update_own on public.ritual_entries
      for update
      using (exists (select 1 from public.profiles p where p.id = ritual_entries.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)))
      with check (exists (select 1 from public.profiles p where p.id = ritual_entries.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reading_feedback' and policyname = 'reading_feedback_insert_own') then
    create policy reading_feedback_insert_own on public.reading_feedback
      for insert
      with check (exists (select 1 from public.profiles p where p.id = reading_feedback.user_id and (p.auth_user_id = auth.uid() or p.id = auth.uid()::text)));
  end if;
end;
$$;
