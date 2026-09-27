import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyReadingInput, SavedDailyReading } from "./daily-reading";
import { DAILY_READING_RETRY_SECONDS, DAILY_READING_VERSION } from "./daily-reading";
import type { DailyReadingStore } from "./daily-reading-service";

export function createDailyReadingStore(supabase: SupabaseClient, input: DailyReadingInput): DailyReadingStore {
  const table = "astrology_daily_readings";
  return {
    async read(key) {
      const { data, error } = await supabase.from(table).select("reading")
        .eq("cache_key", key).eq("user_id", input.userId).eq("status", "ready").maybeSingle();
      if (error) throw error;
      return data?.reading as SavedDailyReading | null ?? null;
    },
    async claim(key, token) {
      const { data, error } = await supabase.rpc("claim_astrology_daily_reading", {
        p_cache_key: key, p_user_id: input.userId, p_local_date: input.sky.localDate,
        p_timezone: input.sky.timezone, p_locale: input.locale, p_version: DAILY_READING_VERSION,
        p_claim_token: token,
      });
      if (error) throw error;
      return data === true;
    },
    async allowGeneration() {
      // User-scoped, not IP-scoped. Locale, chart edits and travel cannot bypass the cost bound.
      const key = createHash("sha256").update(`astrology-daily-ai:${input.userId}`).digest("hex");
      const { data, error } = await supabase.rpc("consume_rate_limit", { p_key_hash: key, p_limit: 6, p_window_seconds: 86_400 });
      return !error && data === true;
    },
    async complete(key, token, reading) {
      const { data, error } = await supabase.from(table).update({ status: "ready", reading, claim_token: null, lease_until: null })
        .eq("cache_key", key).eq("user_id", input.userId).eq("claim_token", token).eq("status", "processing")
        .gt("lease_until", new Date().toISOString()).select("cache_key").maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    async fail(key, token) {
      const { error } = await supabase.from(table).update({
        status: "failed", claim_token: null, lease_until: null,
        retry_after: new Date(Date.now() + DAILY_READING_RETRY_SECONDS * 1_000).toISOString(),
      }).eq("cache_key", key).eq("user_id", input.userId).eq("claim_token", token).eq("status", "processing");
      if (error) throw error;
    },
    async retryAfter(key) {
      const { data, error } = await supabase.from(table).select("status, retry_after, attempt_count")
        .eq("cache_key", key).eq("user_id", input.userId).maybeSingle();
      if (error) throw error;
      if (data?.status === "processing") return 4;
      if (data?.attempt_count >= 3) return 86_400;
      return Math.max(5, Math.ceil((Date.parse(data?.retry_after ?? "") - Date.now()) / 1_000) || DAILY_READING_RETRY_SECONDS);
    },
  };
}
