-- Turns symbolic guidance into concrete, privately tracked actions.

create table if not exists public.impact_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  client_key text not null,
  action_key text not null,
  action_title text not null,
  area text not null check (area in ('self', 'relationships', 'community', 'planet')),
  plan text not null,
  status text not null default 'committed' check (status in ('committed', 'completed')),
  source_reading_id uuid references public.readings(id) on delete set null,
  invited_by text,
  reflection text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists impact_commitments_user_client_key_idx
  on public.impact_commitments (user_id, client_key);
create index if not exists impact_commitments_user_created_idx
  on public.impact_commitments (user_id, created_at desc);

alter table public.impact_commitments enable row level security;

drop policy if exists "impact_commitments_select_own" on public.impact_commitments;
create policy "impact_commitments_select_own" on public.impact_commitments
  for select using (user_id = auth.uid()::text);

drop policy if exists "impact_commitments_insert_own" on public.impact_commitments;
create policy "impact_commitments_insert_own" on public.impact_commitments
  for insert with check (user_id = auth.uid()::text);

drop policy if exists "impact_commitments_update_own" on public.impact_commitments;
create policy "impact_commitments_update_own" on public.impact_commitments
  for update using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
