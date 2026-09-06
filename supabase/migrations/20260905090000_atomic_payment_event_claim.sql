-- A webhook can be delivered more than once and can run concurrently on
-- serverless instances. Claiming the event in one transaction makes
-- fulfillment idempotent before any entitlement is changed.

alter table public.payment_events
  add column if not exists processing_started_at timestamptz,
  add column if not exists attempt_count integer not null default 0;

create or replace function public.claim_payment_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_user_id text,
  p_product_key text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  did_claim boolean := false;
begin
  if nullif(trim(p_provider), '') is null
     or nullif(trim(p_provider_event_id), '') is null
     or nullif(trim(p_event_type), '') is null then
    return false;
  end if;

  insert into public.payment_events (
    provider,
    provider_event_id,
    event_type,
    user_id,
    product_key,
    status,
    payload
  ) values (
    trim(p_provider),
    trim(p_provider_event_id),
    trim(p_event_type),
    nullif(trim(p_user_id), ''),
    nullif(trim(p_product_key), ''),
    'received',
    coalesce(p_payload, '{}'::jsonb)
  ) on conflict (provider, provider_event_id) do nothing;

  update public.payment_events
  set
    status = 'processing',
    processing_started_at = now(),
    attempt_count = payment_events.attempt_count + 1
  where provider = trim(p_provider)
    and provider_event_id = trim(p_provider_event_id)
    and (
      status in ('received', 'failed')
      or (
        status = 'processing'
        and processing_started_at < now() - interval '10 minutes'
      )
    )
  returning true into did_claim;

  return coalesce(did_claim, false);
end;
$$;

revoke all on function public.claim_payment_event(text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.claim_payment_event(text, text, text, text, text, jsonb)
  to service_role;
