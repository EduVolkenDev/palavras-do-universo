alter table public.profiles
  add column if not exists reading_profile jsonb not null default '{}'::jsonb,
  add column if not exists profile_completed_at timestamptz;

create index if not exists profiles_onboarding_status_idx
  on public.profiles (onboarding_status, profile_completed_at desc);
