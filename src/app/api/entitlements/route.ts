import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { getOwnerEntitlements } from "@/lib/product/ownerAccess";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const ownerEntitlements = getOwnerEntitlements(auth.user);

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, entitlements: ownerEntitlements });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("available_entitlements")
    .select(
      "id, product_key, title, product_type, access_model, source, status, starts_at, expires_at, usage_limit, usage_count"
    )
    .eq("user_id", auth.user.id)
    .order("starts_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const existing = new Set((data ?? []).map((item) => item.product_key));
  const entitlements = [
    ...ownerEntitlements.filter((item) => !existing.has(item.product_key)),
    ...(data ?? []),
  ];

  return NextResponse.json({ ok: true, entitlements });
}
