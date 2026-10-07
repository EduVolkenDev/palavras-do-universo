-- Private contact list for the future opening of Edu's reading calendar.
-- All writes flow through a rate-limited server route; no browser role can
-- read or modify addresses directly.
create table public.edu_reading_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    email = lower(email)
    and char_length(email) between 3 and 254
    and email ~ E'^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
  ),
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index edu_reading_waitlist_created_at_idx
  on public.edu_reading_waitlist (created_at desc);

alter table public.edu_reading_waitlist enable row level security;
revoke all on public.edu_reading_waitlist from public, anon, authenticated;
grant select, insert, update, delete on public.edu_reading_waitlist to service_role;

comment on table public.edu_reading_waitlist is
  'Lista privada de contatos para avisar a abertura das Leituras com o Edu.';
