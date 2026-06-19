import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";

export async function POST() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig() || !hasStripeConfig()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", auth.user.id)
    .eq("provider", "stripe")
    .not("provider_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.provider_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: data.provider_customer_id,
    return_url: `${getSiteUrl()}/meu-universo`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
