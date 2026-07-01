create extension if not exists pgcrypto;

create table if not exists public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade unique,
  handle text not null unique,
  display_name text not null,
  headline text not null,
  bio text not null default '',
  city text,
  country text,
  avatar_url text,
  specialties text[] not null default '{}',
  languages text[] not null default '{}',
  modalities text[] not null default '{}',
  availability text not null default 'available',
  is_published boolean not null default false,
  is_verified boolean not null default false,
  response_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_offers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  pricing_model text not null default 'quote',
  price_cents int,
  social_price_cents int,
  currency text not null default 'BRL',
  duration_minutes int,
  accepts_free boolean not null default false,
  accepts_social boolean not null default false,
  status text not null default 'draft',
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_inquiries (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.professional_offers(id) on delete cascade,
  provider_user_id text not null references public.profiles(id) on delete cascade,
  client_id text references public.profiles(id) on delete set null,
  client_name text not null,
  reply_email text not null,
  subject text not null,
  brief text not null,
  budget text,
  timeline text,
  access_preference text not null default 'private',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'professional_profiles_availability_check') then
    alter table public.professional_profiles add constraint professional_profiles_availability_check
      check (availability in ('available', 'limited', 'closed'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'professional_offers_pricing_model_check') then
    alter table public.professional_offers add constraint professional_offers_pricing_model_check
      check (pricing_model in ('fixed', 'social', 'free', 'quote'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'professional_offers_status_check') then
    alter table public.professional_offers add constraint professional_offers_status_check
      check (status in ('draft', 'published', 'paused'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'professional_offers_amounts_check') then
    alter table public.professional_offers add constraint professional_offers_amounts_check
      check (
        (price_cents is null or price_cents >= 0)
        and (social_price_cents is null or social_price_cents >= 0)
        and (duration_minutes is null or duration_minutes > 0)
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'professional_inquiries_status_check') then
    alter table public.professional_inquiries add constraint professional_inquiries_status_check
      check (status in ('new', 'reviewing', 'accepted', 'declined', 'closed'));
  end if;
end;
$$;

create index if not exists professional_profiles_published_idx
  on public.professional_profiles (is_published, updated_at desc);

create index if not exists professional_profiles_handle_idx
  on public.professional_profiles (handle);

create index if not exists professional_offers_profile_status_idx
  on public.professional_offers (profile_id, status, sort_order);

create index if not exists professional_inquiries_provider_idx
  on public.professional_inquiries (provider_user_id, created_at desc);

create index if not exists professional_inquiries_client_idx
  on public.professional_inquiries (client_id, created_at desc);

alter table public.professional_profiles enable row level security;
alter table public.professional_offers enable row level security;
alter table public.professional_inquiries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_profiles'
      and policyname = 'professional_profiles_select_public'
  ) then
    create policy professional_profiles_select_public
      on public.professional_profiles
      for select
      using (is_published = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_profiles'
      and policyname = 'professional_profiles_manage_own'
  ) then
    create policy professional_profiles_manage_own
      on public.professional_profiles
      for all
      using (auth.uid()::text = user_id)
      with check (auth.uid()::text = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_offers'
      and policyname = 'professional_offers_select_public'
  ) then
    create policy professional_offers_select_public
      on public.professional_offers
      for select
      using (
        exists (
          select 1
          from public.professional_profiles p
          where p.id = profile_id
            and p.is_published = true
        )
        and status = 'published'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_offers'
      and policyname = 'professional_offers_manage_own'
  ) then
    create policy professional_offers_manage_own
      on public.professional_offers
      for all
      using (
        exists (
          select 1
          from public.professional_profiles p
          where p.id = profile_id
            and auth.uid()::text = p.user_id
        )
      )
      with check (
        exists (
          select 1
          from public.professional_profiles p
          where p.id = profile_id
            and auth.uid()::text = p.user_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_inquiries'
      and policyname = 'professional_inquiries_select_own'
  ) then
    create policy professional_inquiries_select_own
      on public.professional_inquiries
      for select
      using (
        auth.uid()::text = provider_user_id
        or auth.uid()::text = client_id
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_inquiries'
      and policyname = 'professional_inquiries_insert_authenticated'
  ) then
    create policy professional_inquiries_insert_authenticated
      on public.professional_inquiries
      for insert
      with check (
        auth.uid()::text = client_id
        and exists (
          select 1
          from public.professional_offers offer
          join public.professional_profiles profile on profile.id = offer.profile_id
          where offer.id = offer_id
            and offer.status = 'published'
            and profile.is_published = true
            and profile.user_id = provider_user_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_inquiries'
      and policyname = 'professional_inquiries_manage_provider'
  ) then
    create policy professional_inquiries_manage_provider
      on public.professional_inquiries
      for update
      using (auth.uid()::text = provider_user_id)
      with check (auth.uid()::text = provider_user_id);
  end if;
end;
$$;

create or replace function public.protect_professional_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.is_verified then
      raise exception 'Professional verification is managed by the platform';
    end if;

    if tg_op = 'UPDATE' and new.is_verified is distinct from old.is_verified then
      raise exception 'Professional verification is managed by the platform';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_professional_verification() from public, anon, authenticated;

drop trigger if exists professional_profiles_protect_verification
  on public.professional_profiles;
create trigger professional_profiles_protect_verification
before insert or update on public.professional_profiles
for each row execute function public.protect_professional_verification();

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'professional_profiles_set_updated_at'
  ) then
    null;
  else
    create trigger professional_profiles_set_updated_at
    before update on public.professional_profiles
    for each row execute function public.set_updated_at();
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'professional_offers_set_updated_at'
  ) then
    null;
  else
    create trigger professional_offers_set_updated_at
    before update on public.professional_offers
    for each row execute function public.set_updated_at();
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'professional_inquiries_set_updated_at'
  ) then
    null;
  else
    create trigger professional_inquiries_set_updated_at
    before update on public.professional_inquiries
    for each row execute function public.set_updated_at();
  end if;
end;
$$;
