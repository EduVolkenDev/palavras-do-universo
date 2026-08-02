create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid references public.readings(id) on delete set null,
  user_id text references public.profiles(id) on delete set null,
  source text not null default 'footer',
  resonance_score smallint,
  message text not null,
  display_name text,
  allow_testimonial boolean not null default false,
  locale text not null default 'pt-BR',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint site_feedback_source_check check (source in ('reading', 'footer')),
  constraint site_feedback_resonance_score_check check (
    resonance_score is null or resonance_score between 1 and 5
  ),
  constraint site_feedback_message_length_check check (
    char_length(btrim(message)) between 8 and 2000
  ),
  constraint site_feedback_status_check check (status in ('new', 'reviewed', 'published', 'archived'))
);

create index if not exists site_feedback_created_idx
  on public.site_feedback (created_at desc);

create index if not exists site_feedback_reading_idx
  on public.site_feedback (reading_id, created_at desc)
  where reading_id is not null;

alter table public.site_feedback enable row level security;

-- Feedback is accepted through the server route, which validates the reading
-- owner and applies length/rate limits before using the service role.
revoke all on table public.site_feedback from anon, authenticated;
