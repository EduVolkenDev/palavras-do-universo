import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { createEduReadingCheckout } from "@/lib/edu-reading-checkout";

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
  return NextResponse.json({ ok: true, requests: data ?? [] });
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
    try {
      if (current.status === "payment_pending" && current.payment_url) {
        return NextResponse.json({ ok: true, request: current });
      }
      if (current.status !== "requested") {
        return NextResponse.json({ error: "This request cannot be confirmed in its current status" }, { status: 409 });
      }
      const result = await createEduReadingCheckout(id, auth.user.email ?? auth.user.id);
      const { data: updated, error: updatedError } = await supabase
        .from("edu_reading_requests")
        .select(REQUEST_FIELDS)
        .eq("id", id)
        .single();
      if (updatedError || !updated) {
        return NextResponse.json({ error: updatedError?.message ?? "Could not reload request" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, request: updated, paymentUrl: result.paymentUrl });
    } catch (caught) {
      return NextResponse.json(
        { error: caught instanceof Error ? caught.message : "Could not confirm reading request" },
        { status: 409 }
      );
    }
  }

  const nextStatus = action === "decline" ? "declined" : "cancelled";
  const allowedStatuses = action === "decline"
    ? ["requested"]
    : ["requested", "confirmed_pending_payment", "payment_pending"];
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
