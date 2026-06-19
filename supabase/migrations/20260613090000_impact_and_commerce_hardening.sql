-- Hardens impact chains and commercial delivery for launch.

alter table public.impact_commitments
  add column if not exists beneficiary text not null default '',
  add column if not exists first_step text not null default '',
  add column if not exists scheduled_for timestamptz,
  add column if not exists deferred_until timestamptz,
  add column if not exists cancelled_reason text not null default '',
  add column if not exists public_token uuid unique,
  add column if not exists public_completion_secret uuid,
  add column if not exists root_chain_token uuid,
  add column if not exists parent_public_token uuid;

alter table public.impact_commitments
  alter column public_token set default gen_random_uuid(),
  alter column public_completion_secret set default gen_random_uuid();

update public.impact_commitments
set public_token = gen_random_uuid()
where public_token is null;

update public.impact_commitments
set public_completion_secret = gen_random_uuid()
where public_completion_secret is null;

update public.impact_commitments
set root_chain_token = public_token
where root_chain_token is null;

alter table public.impact_commitments
  alter column public_token set not null,
  alter column public_completion_secret set not null,
  alter column root_chain_token set not null;

alter table public.impact_commitments
  drop constraint if exists impact_commitments_status_check;
alter table public.impact_commitments
  add constraint impact_commitments_status_check
  check (status in ('committed', 'completed', 'deferred', 'cancelled'));

create index if not exists impact_commitments_root_chain_idx
  on public.impact_commitments (root_chain_token, status);

create table if not exists public.impact_public_participations (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  completion_secret uuid not null default gen_random_uuid(),
  root_chain_token uuid not null,
  parent_public_token uuid,
  action_key text not null,
  action_title text not null,
  area text not null check (area in ('self', 'relationships', 'community', 'planet')),
  status text not null default 'committed' check (status in ('committed', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists impact_public_participations_root_idx
  on public.impact_public_participations (root_chain_token, status);

alter table public.impact_public_participations enable row level security;
revoke all on public.impact_public_participations from anon, authenticated;

create or replace function public.consume_user_entitlement(
  p_entitlement_id uuid,
  p_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_id uuid;
begin
  update public.user_entitlements
  set
    usage_count = usage_count + 1,
    consumed_at = case
      when usage_limit is not null and usage_count + 1 >= usage_limit then now()
      else null
    end,
    updated_at = now()
  where id = p_entitlement_id
    and user_id = p_user_id
    and status = 'active'
    and (expires_at is null or expires_at > now())
    and (usage_limit is null or usage_count < usage_limit)
  returning id into affected_id;

  return affected_id is not null;
end;
$$;

revoke all on function public.consume_user_entitlement(uuid, text) from anon, authenticated;
