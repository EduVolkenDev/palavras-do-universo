alter table public.readings
  add column if not exists locale text not null default 'pt-BR';

create index if not exists readings_user_locale_created_idx
  on public.readings (user_id, locale, created_at desc);
