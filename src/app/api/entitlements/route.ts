import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, entitlements: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("available_entitlements")
    .select(
      "id, product_key, title, product_type, access_model, source, starts_at, expires_at, usage_limit, usage_count"
    )
    .eq("user_id", auth.user.id)
    .order("starts_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entitlements: data ?? [] });
}
