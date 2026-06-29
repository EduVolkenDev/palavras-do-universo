create table if not exists public.voucher_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  kind text not null check (kind in ('invite', 'discount', 'hybrid')),
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'cancelled', 'deleted')),
  target_email text,
  target_user_id text references public.profiles(id) on delete set null,
  transferable boolean not null default false,
  max_uses integer not null default 1 check (max_uses >= 1),
  times_used integer not null default 0 check (times_used >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  last_redeemed_at timestamptz,
  product_key text references public.oracle_products(product_key) on delete set null,
  eligible_product_keys text[] not null default '{}',
  grant_product_keys text[] not null default '{}',
  grant_usage_limit integer,
  grant_expires_days integer,
  discount_percent integer check (discount_percent is null or (discount_percent >= 1 and discount_percent <= 100)),
  metadata jsonb not null default '{}'::jsonb,
  created_by text references public.profiles(id) on delete set null,
  last_updated_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voucher_codes_status_created_idx
  on public.voucher_codes (status, created_at desc);
create index if not exists voucher_codes_target_email_idx
  on public.voucher_codes (lower(target_email))
  where target_email is not null;
create index if not exists voucher_codes_target_user_idx
  on public.voucher_codes (target_user_id)
  where target_user_id is not null;

create table if not exists public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.voucher_codes(id) on delete cascade,
  user_id text references public.profiles(id) on delete set null,
  email text,
  product_key text references public.oracle_products(product_key) on delete set null,
  checkout_session_id text,
  status text not null default 'redeemed' check (status in ('pending_checkout', 'redeemed', 'transferred', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voucher_redemptions_voucher_created_idx
  on public.voucher_redemptions (voucher_id, created_at desc);
create index if not exists voucher_redemptions_user_idx
  on public.voucher_redemptions (user_id, created_at desc)
  where user_id is not null;
create unique index if not exists voucher_redemptions_session_idx
  on public.voucher_redemptions (checkout_session_id)
  where checkout_session_id is not null;

alter table public.voucher_codes enable row level security;
alter table public.voucher_redemptions enable row level security;

drop trigger if exists voucher_codes_set_updated_at on public.voucher_codes;
create trigger voucher_codes_set_updated_at
before update on public.voucher_codes
for each row execute function public.set_updated_at();

drop trigger if exists voucher_redemptions_set_updated_at on public.voucher_redemptions;
create trigger voucher_redemptions_set_updated_at
before update on public.voucher_redemptions
for each row execute function public.set_updated_at();

create or replace function public.increment_voucher_usage(p_voucher_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.voucher_codes
     set times_used = times_used + 1,
         last_redeemed_at = now(),
         updated_at = now()
   where id = p_voucher_id
     and status = 'active'
     and (expires_at is null or expires_at > now())
     and times_used < max_uses;

  return found;
end;
$$;

revoke all on function public.increment_voucher_usage(uuid) from public, anon, authenticated;
