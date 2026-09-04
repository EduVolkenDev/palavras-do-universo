create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  severity text not null default 'info',
  source text not null default 'client',
  route text,
  path text,
  locale text,
  user_id text,
  anonymous_id text,
  reading_id uuid references public.readings(id) on delete set null,
  product_key text,
  message text,
  error_name text,
  stack text,
  last_action text,
  viewport jsonb not null default '{}'::jsonb,
  scroll jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  user_agent text,
  status text not null default 'new',
  resolved_at timestamptz,
  resolved_by text,
  constraint site_events_type_length check (char_length(event_type) between 2 and 120),
  constraint site_events_severity_check check (
    severity in ('debug', 'info', 'warning', 'error', 'fatal')
  ),
  constraint site_events_status_check check (
    status in ('new', 'reviewed', 'resolved', 'ignored')
  )
);

create index if not exists site_events_created_at_idx
  on public.site_events (created_at desc);

create index if not exists site_events_status_created_at_idx
  on public.site_events (status, created_at desc);

create index if not exists site_events_type_created_at_idx
  on public.site_events (event_type, created_at desc);

create index if not exists site_events_user_created_at_idx
  on public.site_events (user_id, created_at desc);

alter table public.site_events enable row level security;

revoke all on public.site_events from anon, authenticated;
