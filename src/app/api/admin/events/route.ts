import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const EVENT_STATUSES = new Set(["new", "reviewed", "resolved", "ignored"]);
const EVENT_SEVERITIES = new Set(["debug", "info", "warning", "error", "fatal"]);

type AdminEventBody = {
  action?: unknown;
  id?: unknown;
  status?: unknown;
};

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function requireOwner() {
  const auth = await requireApiUser();
  if (auth.response) return auth;
  if (!isOwnerAccessUser(auth.user)) {
    return { user: null, response: forbidden() } as const;
  }
  return auth;
}

function parseLimit(value: string | null) {
  const limit = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(limit)) return 150;
  return Math.min(250, Math.max(20, limit));
}

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") ?? "").toLowerCase();
  const severity = String(url.searchParams.get("severity") ?? "").toLowerCase();
  const limit = parseLimit(url.searchParams.get("limit"));

  let query = getSupabaseAdmin()
    .from("site_events")
    .select(
      "id, created_at, event_type, severity, source, route, path, locale, user_id, anonymous_id, reading_id, product_key, message, error_name, stack, last_action, viewport, scroll, context, user_agent, status, resolved_at, resolved_by"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (EVENT_STATUSES.has(status)) query = query.eq("status", status);
  if (EVENT_SEVERITIES.has(severity)) query = query.eq("severity", severity);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, events: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const parsed = await readJsonBody<AdminEventBody>(request);
  if (!parsed.ok) return parsed.response;

  const action = String(parsed.body.action ?? "").trim().toLowerCase();
  const eventId = String(parsed.body.id ?? "").trim();
  const status = String(parsed.body.status ?? "").trim().toLowerCase();

  if (action !== "status" || !eventId || !EVENT_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid event action" }, { status: 400 });
  }

  const isResolved = status === "resolved" || status === "ignored";
  const { data, error } = await getSupabaseAdmin()
    .from("site_events")
    .update({
      status,
      resolved_at: isResolved ? new Date().toISOString() : null,
      resolved_by: isResolved ? auth.user.id : null,
    })
    .eq("id", eventId)
    .select(
      "id, created_at, event_type, severity, source, route, path, locale, user_id, anonymous_id, reading_id, product_key, message, error_name, stack, last_action, viewport, scroll, context, user_agent, status, resolved_at, resolved_by"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, event: data });
}
