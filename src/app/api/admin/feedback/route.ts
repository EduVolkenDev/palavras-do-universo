import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { readJsonBody } from "@/lib/http/request";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const FEEDBACK_STATUSES = new Set(["new", "reviewed", "published", "archived"]);

type AdminFeedbackBody = {
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

export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("site_feedback")
    .select(
      "id, created_at, source, resonance_score, message, display_name, allow_testimonial, locale, status, reading_id, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, feedback: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const parsed = await readJsonBody<AdminFeedbackBody>(request);
  if (!parsed.ok) return parsed.response;

  const action = String(parsed.body.action ?? "").trim().toLowerCase();
  const feedbackId = String(parsed.body.id ?? "").trim();
  const status = String(parsed.body.status ?? "").trim().toLowerCase();

  if (action !== "status" || !feedbackId || !FEEDBACK_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid feedback action" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("site_feedback")
    .update({ status })
    .eq("id", feedbackId)
    .select(
      "id, created_at, source, resonance_score, message, display_name, allow_testimonial, locale, status, reading_id, user_id"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, feedback: data });
}
