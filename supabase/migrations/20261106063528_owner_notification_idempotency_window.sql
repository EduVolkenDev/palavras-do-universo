create or replace function public.claim_owner_payment_notification(p_key text,p_event_id text,p_event_type text,p_recipient text)
returns text language plpgsql security invoker set search_path = '' as $$
declare item public.owner_payment_notifications; begin
 insert into public.owner_payment_notifications(notification_key,event_id,event_type,recipient)
 values(p_key,p_event_id,p_event_type,p_recipient) on conflict do nothing returning * into item;
 if found then return 'claimed'; end if;
 select * into item from public.owner_payment_notifications where notification_key=p_key for update;
 if item.status='accepted' then return 'accepted'; end if;
 if item.status='review' then return 'review'; end if;
 if item.status='sending' and item.attempted_at > now()-interval '2 minutes' then return 'busy'; end if;
 -- A crashed sender can have been accepted by the provider. Never resend it
 -- after the provider's 15-minute idempotency window has elapsed.
 if item.status='sending' and item.created_at < now()-interval '14 minutes' then
  update public.owner_payment_notifications set status='review',error_code='AMBIGUOUS_DELIVERY' where notification_key=p_key;
  return 'review';
 end if;
 update public.owner_payment_notifications set status='sending',attempt_count=attempt_count+1,attempted_at=now(),error_code=null where notification_key=p_key;
 return 'claimed';
end $$;
