-- Keep the original text recoverable while repairing the legacy fallback.
create schema if not exists pdu_maintenance;
revoke all on schema pdu_maintenance from public, anon, authenticated;

create table if not exists pdu_maintenance.legacy_reading_repair_backup (
  batch_id uuid not null,
  reading_id uuid not null references public.readings(id) on delete cascade,
  original_reading jsonb not null,
  original_saved_messages jsonb not null default '[]'::jsonb,
  repaired_interpretation text not null,
  created_at timestamptz not null default now(),
  primary key (batch_id, reading_id)
);

alter table pdu_maintenance.legacy_reading_repair_backup enable row level security;
revoke all on pdu_maintenance.legacy_reading_repair_backup from public, anon, authenticated;
