import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, readings: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("readings")
    .select("id, locale, theme, question, mode, spread_type, spread, interpretation, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, readings: data ?? [] });
}
