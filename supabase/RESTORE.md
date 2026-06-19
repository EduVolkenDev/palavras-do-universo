# Palavras do Universo Supabase Restore

## Active Project

- Project name: `palavras-do-universo-restore`
- Project ref: `matykrddzfjcswqjanly`
- Region: `eu-west-1`
- Dashboard: `https://supabase.com/dashboard/project/matykrddzfjcswqjanly`

## Backup Inspected

- File: `/Users/eduardovolken_1/Downloads/db_cluster-16-01-2026@08-45-44.backup`
- Size: `223349` bytes
- SHA-256: `9fb2ca409f59234b5a4ed0db0cb2b29b4f6871957c4eaedf20efaef869c9acf6`
- Format: plain-text PostgreSQL cluster dump

## Result

The backup was inspected before import. It contains Supabase-managed cluster
objects and internal schemas such as `auth`, `storage`, `realtime`,
`extensions`, `graphql`, `graphql_public`, and `vault`.

No `public.*` application tables, rows, indexes, or policies for Palavras do
Universo were present in the backup. The data sections for user-facing objects
were empty; only internal migration/version tables appeared populated.

Because this is a cluster dump of Supabase internals, applying it wholesale to a
hosted Supabase project would try to recreate managed roles, schemas, event
triggers, and extensions that already exist in the new project. The safe restore
path is therefore:

1. Keep the new Supabase project active and linked.
2. Keep the app schema in `supabase/migrations/20260509050500_initial_palavras_schema.sql`.
3. Do not import the full cluster dump unless Supabase support provides a
   project-level restore path for this exact file.

## Validation

- `GET /api/health/supabase` returned `ok: true`.
- The app successfully inserted a smoke reading into `profiles`, `usage_daily`,
  and `readings`.
- Smoke data was removed afterward, leaving the app tables clean.
