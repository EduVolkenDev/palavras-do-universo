-- Consultation maps belong to the owner account that created them.
-- They are intentionally not exposed to students or regular authenticated users.

create table if not exists public.astrology_client_maps (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  birth_data jsonb not null,
  chart jsonb not null,
  consent_granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint astrology_client_maps_student_name_check
    check (char_length(trim(student_name)) between 1 and 160),
  constraint astrology_client_maps_birth_data_object_check
    check (jsonb_typeof(birth_data) = 'object'),
  constraint astrology_client_maps_chart_object_check
    check (jsonb_typeof(chart) = 'object')
);

create index if not exists astrology_client_maps_owner_updated_idx
  on public.astrology_client_maps (owner_user_id, updated_at desc);

alter table public.astrology_client_maps enable row level security;

-- All reads and writes go through the owner-gated server routes using the
-- server-only Supabase service key. No browser role receives table access.
revoke all on table public.astrology_client_maps from anon, authenticated;
grant select, insert, update, delete on table public.astrology_client_maps to service_role;
