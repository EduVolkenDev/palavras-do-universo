create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id text primary key,
  email text,
  display_name text,
  birth_date date,
  sun_sign text,
  favorite_themes text[] not null default '{}',
  emotional_phase text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_daily (
  user_id text not null references public.profiles(id) on delete cascade,
  day date not null,
  free_readings_used int not null default 0,
  credits_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create or replace function public.claim_free_reading(
  p_user_id text,
  p_day date,
  p_alias_user_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used integer;
  lock_key bigint;
begin
  if nullif(trim(p_user_id), '') is null then
    return false;
  end if;

  select hashtextextended(
    format(
      'palavras-free:%s:%s:%s',
      p_day,
      least(p_user_id, coalesce(nullif(trim(p_alias_user_id), ''), p_user_id)),
      greatest(p_user_id, coalesce(nullif(trim(p_alias_user_id), ''), p_user_id))
    ),
    0
  )
  into lock_key;

  perform pg_advisory_xact_lock(lock_key);

  select greatest(
    coalesce((select free_readings_used from public.usage_daily where user_id = p_user_id and day = p_day), 0),
    coalesce((select free_readings_used from public.usage_daily where user_id = nullif(trim(p_alias_user_id), '') and day = p_day), 0)
  )
  into current_used;

  if current_used >= 1 then
    return false;
  end if;

  insert into public.usage_daily (user_id, day, free_readings_used, updated_at)
  values (p_user_id, p_day, 1, now())
  on conflict (user_id, day) do update
    set free_readings_used = 1, updated_at = now();

  if nullif(trim(p_alias_user_id), '') is not null and p_alias_user_id <> p_user_id then
    insert into public.usage_daily (user_id, day, free_readings_used, updated_at)
    values (p_alias_user_id, p_day, 1, now())
    on conflict (user_id, day) do update
      set free_readings_used = 1, updated_at = now();
  end if;

  return true;
end;
$$;

revoke all on function public.claim_free_reading(text, date, text) from public;
grant execute on function public.claim_free_reading(text, date, text) to service_role;

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  email text,
  theme text not null,
  question text not null,
  mode text not null,
  spread_type text not null default 'situation_obstacle_direction',
  spread jsonb not null,
  interpretation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  reading_id uuid references public.readings(id) on delete set null,
  message_type text not null default 'reading',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  plan text not null,
  status text not null default 'inactive',
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_key text not null,
  amount_cents int not null,
  currency text not null default 'BRL',
  status text not null default 'pending',
  provider text not null default 'stripe',
  provider_checkout_id text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.usage_daily enable row level security;
alter table public.readings enable row level security;
alter table public.saved_messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.purchases enable row level security;

create index if not exists readings_user_created_idx
  on public.readings (user_id, created_at desc);

create index if not exists readings_email_created_idx
  on public.readings (lower(email), created_at desc)
  where email is not null;

create index if not exists saved_messages_user_created_idx
  on public.saved_messages (user_id, created_at desc);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);
