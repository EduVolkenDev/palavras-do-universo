alter table public.readings
  add column if not exists email text;

update public.readings as reading
set email = lower(profile.email)
from public.profiles as profile
where reading.user_id = profile.id
  and reading.email is null
  and profile.email is not null;

create index if not exists readings_email_created_idx
  on public.readings (lower(email), created_at desc)
  where email is not null;
