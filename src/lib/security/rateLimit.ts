import { createHash } from "node:crypto";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RateEntry = { count: number; resetAt: number };

const buckets = new Map<string, RateEntry>();
const MAX_BUCKETS = 10_000;

function getClientIp(request: Request) {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-real-ip"),
    process.env.NODE_ENV === "production"
      ? null
      : request.headers.get("x-forwarded-for"),
  ];

  for (const candidate of candidates) {
    const ip = candidate?.split(",")[0]?.trim();
    if (ip && /^[a-f0-9:.]+$/i.test(ip)) return ip;
  }

  return "unknown";
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

function checkMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  pruneExpiredBuckets(now);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export async function checkRateLimit(params: {
  request: Request;
  scope: string;
  limit: number;
  windowMs: number;
  /**
   * Cost-bearing anonymous endpoints must fail closed in production when the
   * distributed limiter is unavailable. A per-instance memory bucket is not
   * sufficient protection for serverless traffic.
   */
  strict?: boolean;
}) {
  const ip = getClientIp(params.request);
  const key = createHash("sha256").update(`${params.scope}:${ip}`).digest("hex");

  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
        p_key_hash: key,
        p_limit: params.limit,
        p_window_seconds: Math.max(1, Math.ceil(params.windowMs / 1000)),
      });
      if (!error && typeof data === "boolean") return data;
    } catch {
      // The decision below determines whether this endpoint may use a local fallback.
    }
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (params.strict && isProduction) return false;

  return checkMemoryRateLimit(key, params.limit, params.windowMs);
}
