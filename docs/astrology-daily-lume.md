# Daily personalized astrology by Lume

## Product boundary

- Only active `circulo_do_universo` subscribers (and the established owner bypass) receive personalized daily Lume output. Buying `mapa_astral` alone does not unlock it.
- `GET /api/astrology/daily` continues to calculate the current astronomical positions. It does not call AI.
- `POST /api/astrology/daily/reading` generates the interpretation on the first visit for that local day, then reuses the saved answer. This is on-demand daily renewal, not an overnight cron or an email notification.
- The saved interpretation identifies its astronomical snapshot. Current calculated transits below it can refresh independently throughout the day. Lume explains up to two close aspects per tone (support, attention, amplification); the calculated view retains the complete list.
- User, local calendar date, canonical timezone, language, natal positions/precision and prompt version identify a cache entry. Changing day, language, birth calculation or timezone creates a new entry; refreshing the same day's sky does not.

## Safe activation order

1. Apply `supabase/migrations/20260927090000_lume_astrology_daily_readings.sql` to the intended database. It depends on `astrology_birth_profiles` and the existing `consume_rate_limit` function. Inspect pending migrations first; do not blindly apply unrelated migrations.
2. Verify table/RPC permissions: authenticated/anonymous clients cannot read the table or claim a generation. Only the server service role can. Do not add a direct client SELECT policy.
3. Keep provider credentials private; reuse the established `ANTHROPIC_API_KEY` and optional `LUME_AI_MODEL`. The existing VOLYNX gateway remains opt-in through its private configuration.
4. Deploy the route and UI together. Validate authenticated free, map-only, active Circle and expired Circle accounts against the intended deployment, then verify a real generated/saved answer is reused after reload.

Migration application and publication are separate activation steps: verify both against the intended environment. Missing storage returns a safe unavailable state, never a fabricated success.

## Reliability and privacy

- A database-owned 90-second lease and unique claim token prevent simultaneous requests from generating duplicates or late workers overwriting a replacement. No output is delivered as ready before persistence succeeds.
- Three attempts maximum per cache entry, five-minute failure backoff, and six generation attempts per user per rolling 24-hour window bound provider cost. Switching IP, language, map or timezone does not reset the user budget. Cached answers do not spend this budget.
- Circle access is checked before cache reads and again before returning an answer. Cached output cannot restore access after subscription expiry.
- AI receives derived placements, precision, house system and the selected calculated transits, not identity, email, raw birth date/place or unrelated personal reading history. Provider prose is untrusted: structured output must reference precisely the supplied aspects and passes bounded text validation before saving. It is rendered as plain text.
- Unknown birth time has no invented houses or Ascendant; its planetary noon reference and uncertainty are disclosed in the prompt and in a deterministic UI notice that does not depend on the model mentioning them. Astrology is presented as symbolic reflection, not a guaranteed prediction.
- Deleting the saved birth profile cascades to its daily readings. Browser/server responses use private, no-store caching.
- If generation, validation or persistence fails, the UI explicitly says Lume's reading is unavailable and distinguishes the still-visible calculated explanations from AI output. The retry button cannot bypass server limits.

## Validation evidence for this increment

- 35 automated contract/service tests passed, including concurrent claims, saved reuse, calendar/timezone isolation, invalid AI output, lease replacement, cost failure and entitlement guards.
- Actual migration SQL executed in isolated local PostgreSQL (PGlite): permissions, ownership fencing, retry backoff, maximum attempts, cost budget and deletion cascade passed. This is not proof of a production migration or multi-connection deployment.
- Real configured AI responses were exercised in Portuguese and English; this verifies provider connectivity/structured responses, not universal interpretive accuracy.
- Browser checks at 390px and 1440px covered ready, loading/pending, failure/retry, denial, preview and day/language changes, without horizontal overflow or uncaught page exceptions.
- A temporary QA page used mocked API responses and was removed before release checks. Browser fixtures are not authenticated end-to-end production evidence.

Operational dependencies remain database availability, valid provider credentials, provider latency and interpretation quality. Do not promise 100% uptime or error-free generated prose.
