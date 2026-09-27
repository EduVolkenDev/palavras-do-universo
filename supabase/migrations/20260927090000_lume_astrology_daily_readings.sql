-- Private, durable daily Lume output. No direct client SELECT: every read must
-- revalidate Circle access through the authenticated server route.
create table public.astrology_daily_readings (
  cache_key text primary key check (length(cache_key) = 64),
  user_id text not null references public.astrology_birth_profiles(user_id) on delete cascade,
  local_date date not null,
  timezone text not null,
  locale text not null check (locale in ('pt-BR', 'en')),
  version text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  claim_token uuid,
  lease_until timestamptz,
  retry_after timestamptz,
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  reading jsonb,
  created_at timestamptz not null default now(),
  constraint astrology_daily_readings_ready_check check ((status = 'ready') = (reading is not null))
);
create index astrology_daily_readings_user_day_idx on public.astrology_daily_readings(user_id, local_date);
alter table public.astrology_daily_readings enable row level security;
revoke all on public.astrology_daily_readings from public, anon, authenticated;
grant select, insert, update, delete on public.astrology_daily_readings to service_role;

create or replace function public.claim_astrology_daily_reading(
  p_cache_key text, p_user_id text, p_local_date date, p_timezone text,
  p_locale text, p_version text, p_claim_token uuid
)
returns boolean language plpgsql security definer set search_path = public as $$
declare did_claim boolean := false;
begin
  if p_claim_token is null or length(p_cache_key) <> 64 or p_locale not in ('pt-BR', 'en') then
    return false;
  end if;
  insert into public.astrology_daily_readings(cache_key,user_id,local_date,timezone,locale,version)
  values(p_cache_key,p_user_id,p_local_date,p_timezone,p_locale,p_version)
  on conflict(cache_key) do nothing;
  update public.astrology_daily_readings
  set status = 'processing', claim_token = p_claim_token,
      lease_until = now() + interval '90 seconds', retry_after = null,
      attempt_count = attempt_count + 1
  where cache_key = p_cache_key and user_id = p_user_id and reading is null
    and attempt_count < 3
    and (status in ('pending','failed') or (status = 'processing' and lease_until <= now()))
    and (retry_after is null or retry_after <= now())
  returning true into did_claim;
  return coalesce(did_claim, false);
end;
$$;
revoke all on function public.claim_astrology_daily_reading(text,text,date,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.claim_astrology_daily_reading(text,text,date,text,text,text,uuid) to service_role;
