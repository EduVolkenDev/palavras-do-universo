-- Atomic, privacy-preserving rate limits for serverless API instances.

create table if not exists public.api_rate_limits (
  key_hash text primary key,
  request_count integer not null default 0 check (request_count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if length(p_key_hash) <> 64 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.api_rate_limits (
    key_hash,
    request_count,
    reset_at,
    updated_at
  )
  values (
    p_key_hash,
    1,
    now() + make_interval(secs => p_window_seconds),
    now()
  )
  on conflict (key_hash) do update
  set
    request_count = case
      when api_rate_limits.reset_at <= now() then 1
      else api_rate_limits.request_count + 1
    end,
    reset_at = case
      when api_rate_limits.reset_at <= now()
        then now() + make_interval(secs => p_window_seconds)
      else api_rate_limits.reset_at
    end,
    updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;
