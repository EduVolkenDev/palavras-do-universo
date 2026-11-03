-- A separate, verified consent for the daily sky email. Existing marketing
-- preferences do not subscribe anyone to this new publication.
create table if not exists public.daily_sky_email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en')),
  timezone text not null default 'Europe/London',
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  confirmation_token_hash text,
  confirmation_expires_at timestamptz,
  unsubscribe_token text not null unique,
  consent_source text not null default 'daily-sky-form',
  consent_version text not null,
  consent_text text not null,
  confirmation_message_id text,
  consented_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_sky_email_normalized_email check (email = lower(btrim(email)))
);

create index if not exists daily_sky_email_active_idx
  on public.daily_sky_email_subscriptions (status, timezone, id)
  where status = 'active';
create index if not exists daily_sky_email_confirmation_idx
  on public.daily_sky_email_subscriptions (confirmation_token_hash)
  where confirmation_token_hash is not null;

create table if not exists public.daily_sky_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.daily_sky_email_subscriptions(id) on delete cascade,
  local_date date not null,
  status text not null default 'processing' check (status in ('processing', 'accepted', 'failed')),
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (subscription_id, local_date)
);

create index if not exists daily_sky_email_deliveries_date_idx
  on public.daily_sky_email_deliveries (local_date, status);

alter table public.daily_sky_email_subscriptions enable row level security;
alter table public.daily_sky_email_deliveries enable row level security;
revoke all on public.daily_sky_email_subscriptions from anon, authenticated;
revoke all on public.daily_sky_email_deliveries from anon, authenticated;
grant all on public.daily_sky_email_subscriptions to service_role;
grant all on public.daily_sky_email_deliveries to service_role;

-- Claim only unsent recipients, so recurring scheduler calls continue through
-- the list instead of scanning the same first page forever.
create or replace function public.claim_daily_sky_email_batch(p_date date, p_limit integer default 20)
returns table (delivery_id uuid, subscription_id uuid, email text, locale text, unsubscribe_token text)
language sql security definer set search_path = '' as $$
  with claimed as (
    insert into public.daily_sky_email_deliveries (subscription_id, local_date)
    select s.id, p_date
    from public.daily_sky_email_subscriptions s
    where s.status = 'active'
      and s.timezone = 'Europe/London'
      and not exists (
        select 1 from public.daily_sky_email_deliveries d
        where d.subscription_id = s.id and d.local_date = p_date
      )
    order by s.id
    limit least(greatest(p_limit, 1), 25)
    on conflict (subscription_id, local_date) do nothing
    returning id, subscription_id
  )
  select c.id, s.id, s.email, s.locale, s.unsubscribe_token
  from claimed c join public.daily_sky_email_subscriptions s on s.id = c.subscription_id;
$$;
revoke all on function public.claim_daily_sky_email_batch(date, integer) from public, anon, authenticated;
grant execute on function public.claim_daily_sky_email_batch(date, integer) to service_role;
