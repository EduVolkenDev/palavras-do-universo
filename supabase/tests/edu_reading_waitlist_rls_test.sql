begin;
select plan(5);

select ok(
  exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'edu_reading_waitlist'
      and relation.relrowsecurity
  ),
  'waitlist keeps RLS enabled'
);

select ok(
  not has_table_privilege('anon', 'public.edu_reading_waitlist', 'select, insert, update, delete'),
  'anon cannot access waitlist contacts'
);

select ok(
  not has_table_privilege('authenticated', 'public.edu_reading_waitlist', 'select, insert, update, delete'),
  'authenticated users cannot access waitlist contacts directly'
);

select ok(
  has_table_privilege('service_role', 'public.edu_reading_waitlist', 'select, insert, update, delete'),
  'server service role can manage waitlist contacts'
);

insert into public.edu_reading_waitlist (email, locale)
values ('waitlist-test@palavrasdouniverso.com', 'pt-BR');

select throws_ok(
  $$insert into public.edu_reading_waitlist (email, locale) values ('waitlist-test@palavrasdouniverso.com', 'en')$$,
  '23505',
  null,
  'the same address cannot be added twice'
);

select * from finish();
rollback;
