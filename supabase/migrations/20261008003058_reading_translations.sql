-- Matches the migration version applied to the production Supabase project.
create table if not exists public.reading_translations (
  reading_id uuid not null references public.readings(id) on delete cascade,
  target_locale text not null check (target_locale in ('pt-BR', 'en')),
  source_hash text not null check (length(source_hash) = 64),
  interpretation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reading_id, target_locale)
);

alter table public.reading_translations enable row level security;
revoke all on public.reading_translations from public, anon, authenticated;
grant select, insert, update, delete on public.reading_translations to service_role;
