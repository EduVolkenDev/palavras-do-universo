create table if not exists public.edu_reading_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id text not null,
  offer_title text not null,
  client_name text not null,
  client_email text not null,
  intention text not null default '',
  locale text not null default 'pt-BR',
  currency text not null,
  amount_cents integer not null,
  date_key date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Europe/London',
  status text not null default 'requested',
  stripe_checkout_id text,
  stripe_payment_intent_id text,
  payment_url text,
  checkout_expires_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by text,
  paid_at timestamptz,
  declined_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.edu_reading_requests
  add column if not exists checkout_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'edu_reading_requests_status_check'
  ) then
    alter table public.edu_reading_requests
      add constraint edu_reading_requests_status_check
      check (status in (
        'requested',
        'confirmed_pending_payment',
        'payment_pending',
        'paid',
        'declined',
        'expired',
        'cancelled'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'edu_reading_requests_currency_check'
  ) then
    alter table public.edu_reading_requests
      add constraint edu_reading_requests_currency_check
      check (currency in ('BRL', 'GBP'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'edu_reading_requests_amount_check'
  ) then
    alter table public.edu_reading_requests
      add constraint edu_reading_requests_amount_check
      check (amount_cents > 0);
  end if;
end;
$$;

create index if not exists edu_reading_requests_status_created_idx
  on public.edu_reading_requests (status, created_at desc);

create index if not exists edu_reading_requests_date_time_idx
  on public.edu_reading_requests (date_key, start_time);

create unique index if not exists edu_reading_requests_active_slot_idx
  on public.edu_reading_requests (date_key, start_time)
  where status in ('requested', 'confirmed_pending_payment', 'payment_pending', 'paid');

create index if not exists edu_reading_requests_payment_expiry_idx
  on public.edu_reading_requests (checkout_expires_at)
  where status = 'payment_pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'edu_reading_requests_active_time_excl'
  ) then
    alter table public.edu_reading_requests
      add constraint edu_reading_requests_active_time_excl
      exclude using gist (
        tsrange(
          date_key + start_time,
          date_key + end_time + interval '30 minutes',
          '[)'
        ) with &&
      ) where (status in ('requested', 'confirmed_pending_payment', 'payment_pending', 'paid'));
  end if;
end;
$$;

alter table public.edu_reading_requests enable row level security;

comment on table public.edu_reading_requests is
  'Reservas de atendimento humano: pagamento Stripe confirma o horário e uma reserva pendente expira automaticamente.';
