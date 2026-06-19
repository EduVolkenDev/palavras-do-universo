import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { fulfillCheckoutSession } from "@/lib/product/fulfillment";
import { getStripe, hasStripeConfig } from "@/lib/stripe/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) return jsonError("Supabase is not configured", 503);
  if (!hasStripeConfig()) return jsonError("Stripe is not configured", 503);

  const parsed = await readJsonBody<{ sessionId?: unknown }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const sessionId = String(body.sessionId ?? "").trim();

  if (!sessionId) return jsonError("Missing sessionId", 400);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.user_id !== auth.user.id) {
    return jsonError("Checkout session does not belong to this user", 403);
  }

  if (session.status !== "complete" || session.payment_status === "unpaid") {
    return jsonError("Checkout is not paid yet", 409);
  }

  const result = await fulfillCheckoutSession(session);
  if (!result.ok) return jsonError("Checkout cannot be fulfilled", 422);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("available_entitlements")
    .select(
      "id, product_key, title, product_type, access_model, source, starts_at, expires_at, usage_limit, usage_count"
    )
    .eq("user_id", auth.user.id)
    .order("starts_at", { ascending: false });

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({
    ok: true,
    productKey: result.productKey,
    source: result.source,
    entitlements: data ?? [],
  });
}
