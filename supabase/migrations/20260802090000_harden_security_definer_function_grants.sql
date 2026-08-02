-- Keep SECURITY DEFINER helpers out of the public Data API surface.
-- The previous migration revoked anon/authenticated explicitly, but left the
-- default PUBLIC EXECUTE grant in place.

revoke all on function public.consume_user_entitlement(uuid, text)
  from public, anon, authenticated;
grant execute on function public.consume_user_entitlement(uuid, text)
  to service_role;

-- This function is invoked by the auth trigger, not by client RPC calls.
revoke all on function public.handle_new_auth_user()
  from public, anon, authenticated;
