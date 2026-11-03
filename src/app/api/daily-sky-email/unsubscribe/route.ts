import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const base = "https://palavrasdouniverso.com/ceu-por-email";
  if (!/^[\w-]{32,64}$/.test(token)) return NextResponse.redirect(`${base}?status=invalid`, 303);
  // Link scanners may prefetch GET requests. Require an explicit POST to opt out.
  const { data } = hasSupabaseConfig()
    ? await getSupabaseAdmin().from("daily_sky_email_subscriptions").select("locale").eq("unsubscribe_token", token).maybeSingle()
    : { data: null };
  return NextResponse.redirect(`${base}/cancelar?token=${encodeURIComponent(token)}&lang=${data?.locale === "en" ? "en" : "pt"}`, 303);
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const oneClick = (await request.text()).includes("List-Unsubscribe=One-Click");
  const base = "https://palavrasdouniverso.com/ceu-por-email";
  if (!hasSupabaseConfig() || !/^[\w-]{32,64}$/.test(token)) return NextResponse.redirect(`${base}?status=invalid`, 303);
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("daily_sky_email_subscriptions")
    .select("locale").eq("unsubscribe_token", token).maybeSingle();
  const { error } = await admin.from("daily_sky_email_subscriptions")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token);
  if (oneClick) return new Response(null, { status: error ? 503 : 200 });
  return NextResponse.redirect(`${base}?status=${error ? "error" : data ? "unsubscribed" : "invalid"}&lang=${data?.locale === "en" ? "en" : "pt"}`, 303);
}
