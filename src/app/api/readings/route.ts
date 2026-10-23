import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : 50;
  const requestedOffset = Number(url.searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(requestedOffset)
    ? Math.min(Math.max(Math.trunc(requestedOffset), 0), 1_000_000)
    : 0;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, readings: [], hasMore: false, nextOffset: offset });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("readings")
    .select("id, email, locale, theme, question, mode, spread_type, spread, interpretation, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const readings = rows.slice(0, limit);
  return NextResponse.json({
    ok: true,
    readings,
    hasMore: rows.length > limit,
    nextOffset: offset + readings.length,
  });
}
