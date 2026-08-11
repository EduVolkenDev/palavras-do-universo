-- Reserve the daily free reading atomically, including the anonymous browser
-- identity that may later be linked to an authenticated account.
create or replace function public.claim_free_reading(
  p_user_id text,
  p_day date,
  p_alias_user_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used integer;
  lock_key bigint;
begin
  if nullif(trim(p_user_id), '') is null then
    return false;
  end if;

  select hashtextextended(
    format(
      'palavras-free:%s:%s:%s',
      p_day,
      least(p_user_id, coalesce(nullif(trim(p_alias_user_id), ''), p_user_id)),
      greatest(p_user_id, coalesce(nullif(trim(p_alias_user_id), ''), p_user_id))
    ),
    0
  )
  into lock_key;

  perform pg_advisory_xact_lock(lock_key);

  select greatest(
    coalesce(
      (
        select free_readings_used
        from public.usage_daily
        where user_id = p_user_id and day = p_day
      ),
      0
    ),
    coalesce(
      (
        select free_readings_used
        from public.usage_daily
        where user_id = nullif(trim(p_alias_user_id), '') and day = p_day
      ),
      0
    )
  )
  into current_used;

  if current_used >= 1 then
    return false;
  end if;

  insert into public.usage_daily (user_id, day, free_readings_used, updated_at)
  values (p_user_id, p_day, 1, now())
  on conflict (user_id, day) do update
    set free_readings_used = 1,
        updated_at = now();

  if nullif(trim(p_alias_user_id), '') is not null
     and p_alias_user_id <> p_user_id then
    insert into public.usage_daily (user_id, day, free_readings_used, updated_at)
    values (p_alias_user_id, p_day, 1, now())
    on conflict (user_id, day) do update
      set free_readings_used = 1,
          updated_at = now();
  end if;

  return true;
end;
$$;

revoke all on function public.claim_free_reading(text, date, text) from public;
grant execute on function public.claim_free_reading(text, date, text) to service_role;
