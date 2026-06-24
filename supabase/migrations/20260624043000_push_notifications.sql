create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  subscription jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_push_subscriptions_endpoint
  on public.push_subscriptions (endpoint);

alter table public.push_subscriptions enable row level security;

alter table public.profiles
  add column if not exists push_subscription jsonb,
  add column if not exists push_subscribed_at timestamptz;
