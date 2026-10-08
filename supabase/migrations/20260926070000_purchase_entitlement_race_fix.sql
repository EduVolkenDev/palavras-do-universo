-- Race-condition fix for purchase entitlement grants.
--
-- Background: POST /api/stripe/webhook and POST /api/checkout/confirm could run
-- fulfillCheckoutSession() concurrently for the same checkout session.
-- grantEntitlements() used read-then-write (select + maybeSingle, then insert)
-- with no uniqueness guarantee, so two concurrent executions could both see
-- "no row" and both insert -> 2 uses granted for 1 payment.
--
-- This migration:
--   1. Merges provable race duplicates (same checkout_session_id in metadata).
--   2. Adds a partial unique index enforcing one purchase row per
--      (user_id, product_key, source). The index is intentionally partial:
--      source='admin' (vouchers) legitimately holds several rows per
--      (user_id, product_key), one per voucher.
--   3. Adds grant_purchase_entitlement(): a transactional RPC that performs the
--      grant atomically (SELECT ... FOR UPDATE + insert with a
--      unique_violation retry loop), so concurrent webhook/confirm executions
--      converge on a single row. Same checkout_session_id replays are
--      idempotent and never increment usage_limit twice.

-- ---------------------------------------------------------------------------
-- 1. Merge provable race duplicates.
--
-- Genuine sequential purchases UPDATE the single row (usage_limit + 1), so two
-- rows for the same (user_id, product_key, source='purchase') can only come
-- from the race -- and both carry the SAME checkout_session_id in metadata.
-- Groups whose rows disagree on checkout_session_id (or lack it) are left
-- untouched and abort the migration with a clear message: resolve them with
-- scripts/cleanup-duplicate-entitlements.mjs first.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_keep_id uuid;
  v_deleted int;
  v_max_count int;
  v_kept_consumed timestamptz;
  v_group_consumed timestamptz;
  v_now timestamptz := now();
  v_ambiguous int := 0;
begin
  for r in
    select user_id, product_key, count(*) as n
    from public.user_entitlements
    where source = 'purchase'
    group by user_id, product_key
    having count(*) > 1
  loop
    if exists (
      select 1
      from public.user_entitlements e
      where e.user_id = r.user_id
        and e.product_key = r.product_key
        and e.source = 'purchase'
      group by e.user_id, e.product_key
      having count(distinct (e.metadata ->> 'checkout_session_id')) > 1
          or bool_or((e.metadata ->> 'checkout_session_id') is null)
    ) then
      v_ambiguous := v_ambiguous + 1;
      raise notice 'Ambiguous duplicate group left untouched: user_id=%, product_key=%',
        r.user_id, r.product_key;
      continue;
    end if;

    -- Keep the richest row (highest usage_limit, tie -> oldest). In the pure
    -- race both rows carry usage_limit = previous + 1, so MAX is exact.
    -- Consumption may have happened against either duplicate row afterwards,
    -- so the kept row inherits the HIGHEST usage_count of the group: we must
    -- never resurrect an already-consumed use.
    select coalesce(max(e.usage_count), 0), min(e.consumed_at)
      into v_max_count, v_group_consumed
    from public.user_entitlements e
    where e.user_id = r.user_id
      and e.product_key = r.product_key
      and e.source = 'purchase';

    select e.id, e.consumed_at into v_keep_id, v_kept_consumed
    from public.user_entitlements e
    where e.user_id = r.user_id
      and e.product_key = r.product_key
      and e.source = 'purchase'
    order by coalesce(e.usage_limit, 0) desc, e.created_at asc
    limit 1;

    delete from public.user_entitlements e
    where e.user_id = r.user_id
      and e.product_key = r.product_key
      and e.source = 'purchase'
      and e.id <> v_keep_id;
    get diagnostics v_deleted = row_count;

    update public.user_entitlements
    set usage_count = v_max_count,
        consumed_at = case
          when v_max_count >= coalesce(usage_limit, 0) and coalesce(usage_limit, 0) > 0
            then coalesce(v_kept_consumed, v_group_consumed, v_now)
          else null
        end,
        updated_at = v_now
    where id = v_keep_id;
    raise notice 'Merged % duplicate purchase entitlement row(s) for user_id=%, product_key=% (kept %, usage_count=%)',
      v_deleted, r.user_id, r.product_key, v_keep_id, v_max_count;
  end loop;

  if v_ambiguous > 0 then
    raise exception 'Found % ambiguous duplicate entitlement group(s); resolve them manually (see scripts/cleanup-duplicate-entitlements.mjs) before this migration can apply the unique index.', v_ambiguous;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Structural guarantee: one purchase row per (user_id, product_key, source).
-- ---------------------------------------------------------------------------
create unique index if not exists user_entitlements_purchase_unique
  on public.user_entitlements (user_id, product_key, source)
  where source = 'purchase';

-- ---------------------------------------------------------------------------
-- 3. Transactional grant RPC.
--
-- Called by the app (service_role) instead of read-then-write. Concurrent
-- callers for the same logical row serialize here:
--   * SELECT ... FOR UPDATE takes the row lock when the row exists;
--   * when it does not exist, the unique index serializes the two inserts --
--     the loser gets unique_violation, loops, and then sees the winner's row.
-- A replay of the same checkout_session_id never increments usage_limit.
-- ---------------------------------------------------------------------------
create or replace function public.grant_purchase_entitlement(
  p_user_id text,
  p_product_key text,
  p_checkout_session_id text,
  p_payment_intent_id text default null,
  p_currency text default null,
  p_market text default null,
  p_attribution jsonb default null,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_usage_limit int;
  v_usage_count int;
  v_consumed_at timestamptz;
  v_existing_session text;
  v_old_metadata jsonb;
  v_metadata jsonb;
  v_now timestamptz := now();
begin
  if nullif(trim(coalesce(p_user_id, '')), '') is null
     or nullif(trim(coalesce(p_product_key, '')), '') is null then
    raise exception 'grant_purchase_entitlement: user_id and product_key are required';
  end if;

  -- The whole idempotency contract rests on the checkout session id: without
  -- it, a retry could not be distinguished from a new purchase. Fail closed
  -- instead of silently double-granting.
  if nullif(trim(coalesce(p_checkout_session_id, '')), '') is null then
    raise exception 'grant_purchase_entitlement: checkout_session_id is required';
  end if;

  v_metadata := jsonb_build_object(
    'checkout_session_id', p_checkout_session_id,
    'payment_intent_id', p_payment_intent_id,
    'currency', p_currency,
    'market', p_market,
    'attribution', p_attribution
  );

  loop
    select e.id, e.usage_limit, e.usage_count, e.consumed_at,
           e.metadata ->> 'checkout_session_id', e.metadata
      into v_id, v_usage_limit, v_usage_count, v_consumed_at, v_existing_session,
           v_old_metadata
    from public.user_entitlements e
    where e.user_id = p_user_id
      and e.product_key = p_product_key
      and e.source = 'purchase'
    for update;

    if found then
      if v_existing_session is not null
         and p_checkout_session_id is not null
         and v_existing_session = p_checkout_session_id then
        -- Idempotent replay of the same purchase (webhook x confirm racing,
        -- Stripe redelivery, manual reprocess): never increment twice.
        update public.user_entitlements
        set updated_at = v_now
        where id = v_id;
        return jsonb_build_object(
          'granted', false,
          'reason', 'same_session',
          'entitlement_id', v_id,
          'usage_limit', v_usage_limit
        );
      end if;

      -- A new, distinct purchase for this product: increment the allowance.
      -- The superseded session is appended to purchase_history so the row
      -- keeps an audit trail instead of losing prior payment references.
      v_usage_limit := coalesce(v_usage_limit, 0) + 1;
      v_usage_count := coalesce(v_usage_count, 0);
      update public.user_entitlements
      set status = 'active',
          starts_at = v_now,
          expires_at = p_expires_at,
          usage_limit = v_usage_limit,
          consumed_at = case
            when v_usage_count < v_usage_limit then null
            else v_consumed_at
          end,
          metadata = v_metadata || jsonb_build_object(
            'purchase_history',
            -- jsonb || with a mixed array/object RHS is version-sensitive;
            -- always concatenate two arrays so the history stays an array.
            case
              when jsonb_typeof(v_old_metadata -> 'purchase_history') = 'array'
                then v_old_metadata -> 'purchase_history'
              else '[]'::jsonb
            end
              || jsonb_build_array(
                   jsonb_build_object(
                     'checkout_session_id', v_existing_session,
                     'payment_intent_id', v_old_metadata ->> 'payment_intent_id',
                     'granted_at', v_now
                   )
                 )
          ),
          updated_at = v_now
      where id = v_id;
      return jsonb_build_object(
        'granted', true,
        'reason', 'incremented',
        'entitlement_id', v_id,
        'usage_limit', v_usage_limit
      );
    end if;

    begin
      insert into public.user_entitlements (
        user_id, product_key, source, status, starts_at, expires_at,
        usage_limit, usage_count, consumed_at, metadata, updated_at
      ) values (
        p_user_id, p_product_key, 'purchase', 'active', v_now, p_expires_at,
        1, 0, null, v_metadata, v_now
      )
      returning id into v_id;

      return jsonb_build_object(
        'granted', true,
        'reason', 'created',
        'entitlement_id', v_id,
        'usage_limit', 1
      );
    exception when unique_violation then
      -- Lost the insert race for this (user_id, product_key, source).
      -- Loop back: the winner's row is now visible and SELECT ... FOR UPDATE
      -- will serialize on it.
    end;
  end loop;
end;
$$;

revoke all on function public.grant_purchase_entitlement(text, text, text, text, text, text, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.grant_purchase_entitlement(text, text, text, text, text, text, jsonb, timestamptz)
  to service_role;
