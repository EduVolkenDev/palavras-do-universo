-- Birth data belongs to Astrology, not to the reading-profile preferences.
-- Keep the reported civil time and its resolved timezone context auditable.

create table if not exists public.astrology_birth_profiles (
  user_id text primary key references public.profiles(id) on delete cascade,
  local_date date not null,
  local_time time without time zone not null,
  time_input_mode text not null default 'local-clock',
  timezone text not null,
  location_label text not null,
  country_code text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  elevation_meters numeric(8, 2),
  precision text not null,
  time_resolution jsonb not null,
  calculation_version text not null default 'birth-time-iana-v1',
  consent_granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint astrology_birth_profiles_time_input_mode_check
    check (time_input_mode in ('local-clock')),
  constraint astrology_birth_profiles_precision_check
    check (precision in ('exact', 'approximate', 'unknown')),
  constraint astrology_birth_profiles_country_code_check
    check (country_code = upper(country_code) and char_length(country_code) = 2),
  constraint astrology_birth_profiles_latitude_check
    check (latitude between -90 and 90),
  constraint astrology_birth_profiles_longitude_check
    check (longitude between -180 and 180),
  constraint astrology_birth_profiles_time_resolution_object_check
    check (jsonb_typeof(time_resolution) = 'object')
);

create index if not exists astrology_birth_profiles_updated_idx
  on public.astrology_birth_profiles (updated_at desc);

alter table public.astrology_birth_profiles enable row level security;

drop policy if exists "astrology_birth_profiles_select_own" on public.astrology_birth_profiles;
create policy "astrology_birth_profiles_select_own" on public.astrology_birth_profiles
  for select using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = astrology_birth_profiles.user_id
        and (profile.auth_user_id = auth.uid() or profile.id = auth.uid()::text)
    )
  );

drop policy if exists "astrology_birth_profiles_insert_own" on public.astrology_birth_profiles;
create policy "astrology_birth_profiles_insert_own" on public.astrology_birth_profiles
  for insert with check (
    exists (
      select 1
      from public.profiles profile
      where profile.id = astrology_birth_profiles.user_id
        and (profile.auth_user_id = auth.uid() or profile.id = auth.uid()::text)
    )
  );

drop policy if exists "astrology_birth_profiles_update_own" on public.astrology_birth_profiles;
create policy "astrology_birth_profiles_update_own" on public.astrology_birth_profiles
  for update using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = astrology_birth_profiles.user_id
        and (profile.auth_user_id = auth.uid() or profile.id = auth.uid()::text)
    )
  ) with check (
    exists (
      select 1
      from public.profiles profile
      where profile.id = astrology_birth_profiles.user_id
        and (profile.auth_user_id = auth.uid() or profile.id = auth.uid()::text)
    )
  );

drop policy if exists "astrology_birth_profiles_delete_own" on public.astrology_birth_profiles;
create policy "astrology_birth_profiles_delete_own" on public.astrology_birth_profiles
  for delete using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = astrology_birth_profiles.user_id
        and (profile.auth_user_id = auth.uid() or profile.id = auth.uid()::text)
    )
  );
