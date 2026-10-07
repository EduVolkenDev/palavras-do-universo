import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { getStripe, hasStripeConfig } from "@/lib/stripe/server";

const REQUEST_STATUSES = new Set([
  "requested",
  "confirmed_pending_payment",
  "payment_pending",
  "paid",
  "declined",
  "expired",
  "cancelled",
]);

const REQUEST_FIELDS =
  "id, created_at, updated_at, offer_id, offer_title, client_name, client_email, intention, locale, currency, amount_cents, date_key, start_time, end_time, timezone, status, stripe_checkout_id, payment_url, confirmed_at, confirmed_by, paid_at, declined_at, notes";
const WAITLIST_FIELDS = "id, email, locale, created_at, updated_at";

type AdminBody = {
  action?: unknown;
  id?: unknown;
  notes?: unknown;
};

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function requireOwner() {
  const auth = await requireApiUser();
  if (auth.response) return auth;
  if (!isOwnerAccessUser(auth.user)) return { user: null, response: forbidden() } as const;
  return auth;
}

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const status = new URL(request.url).searchParams.get("status") ?? "";
  let query = getSupabaseAdmin()
    .from("edu_reading_requests")
    .select(REQUEST_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (REQUEST_STATUSES.has(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: waitlist, error: waitlistError } = await getSupabaseAdmin()
    .from("edu_reading_waitlist")
    .select(WAITLIST_FIELDS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (waitlistError) return NextResponse.json({ error: waitlistError.message }, { status: 500 });

  return NextResponse.json({ ok: true, requests: data ?? [], waitlist: waitlist ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const parsed = await readJsonBody<AdminBody>(request);
  if (!parsed.ok) return parsed.response;

  const action = String(parsed.body.action ?? "").trim().toLowerCase();
  const id = String(parsed.body.id ?? "").trim();
  const notes = String(parsed.body.notes ?? "").trim().slice(0, 1000);
  if (!id || !["confirm", "decline", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid reading request action" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: current, error: currentError } = await supabase
    .from("edu_reading_requests")
    .select(REQUEST_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Reading request not found" }, { status: 404 });

  if (action === "confirm") {
    if (current.status === "paid") return NextResponse.json({ ok: true, request: current });
    return NextResponse.json(
      { error: "A booking is confirmed only after Stripe reports a successful payment." },
      { status: 409 }
    );
  }

  const nextStatus = action === "decline" ? "declined" : "cancelled";
  const allowedStatuses = action === "decline"
    ? ["requested"]
    : ["requested", "confirmed_pending_payment", "payment_pending"];
  if (action === "cancel" && current.status === "payment_pending" && current.stripe_checkout_id) {
    if (!hasStripeConfig()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    try {
      const stripe = getStripe();
      const checkout = await stripe.checkout.sessions.retrieve(current.stripe_checkout_id);
      if (checkout.payment_status === "paid" || checkout.status === "complete") {
        return NextResponse.json({ error: "A paid booking cannot be cancelled here." }, { status: 409 });
      }
      if (checkout.status === "open") await stripe.checkout.sessions.expire(checkout.id);
    } catch (caught) {
      return NextResponse.json(
        { error: caught instanceof Error ? caught.message : "Could not close the Stripe Checkout." },
        { status: 409 }
      );
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("edu_reading_requests")
    .update({
      status: nextStatus,
      declined_at: action === "decline" ? new Date().toISOString() : null,
      notes: notes || current.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", allowedStatuses)
    .select(REQUEST_FIELDS)
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "This request cannot be changed in its current status" }, { status: 409 });
  return NextResponse.json({ ok: true, request: updated });
}
