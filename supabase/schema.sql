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

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
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

create index if not exists saved_messages_user_created_idx
  on public.saved_messages (user_id, created_at desc);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);
