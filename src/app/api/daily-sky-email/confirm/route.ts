import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const base = "https://palavrasdouniverso.com/ceu-por-email";
  if (!hasSupabaseConfig() || !/^[\w-]{32,64}$/.test(token)) {
    return NextResponse.redirect(`${base}?status=invalid`, 303);
  }
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("daily_sky_email_subscriptions")
    .select("id,confirmation_expires_at,status,locale")
    .eq("confirmation_token_hash", hash).maybeSingle();
  if (error || !data || data.status !== "pending" || !data.confirmation_expires_at || new Date(data.confirmation_expires_at) <= new Date()) {
    return NextResponse.redirect(`${base}?status=invalid`, 303);
  }
  const { data: updated, error: updateError } = await admin.from("daily_sky_email_subscriptions")
    .update({ status: "active", confirmed_at: new Date().toISOString(), confirmation_token_hash: null, confirmation_expires_at: null, updated_at: new Date().toISOString() })
    .eq("id", data.id).eq("status", "pending").eq("confirmation_token_hash", hash)
    .select("id").maybeSingle();
  return NextResponse.redirect(`${base}?status=${updateError ? "error" : updated ? "confirmed" : "invalid"}&lang=${data.locale === "en" ? "en" : "pt"}`, 303);
}

// Email security scanners may visit links. Confirmation requires an explicit POST.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const base = "https://palavrasdouniverso.com/ceu-por-email";
  if (!/^[\w-]{32,64}$/.test(token)) return NextResponse.redirect(`${base}?status=invalid`, 303);
  return NextResponse.redirect(`${base}/confirmar?token=${encodeURIComponent(token)}`);
}
