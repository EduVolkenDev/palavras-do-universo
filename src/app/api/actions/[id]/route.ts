import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const requestedStatus = cleanText(body.status, 20);
  if (!["completed", "deferred", "cancelled"].includes(requestedStatus)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("impact_commitments")
    .select("id,status")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
  }
  if (existing.status === "completed" && requestedStatus !== "completed") {
    return NextResponse.json({ error: "Completed actions cannot be reopened" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const payload =
    requestedStatus === "completed"
      ? {
          status: "completed",
          reflection: cleanText(body.reflection, 1000),
          completed_at: now,
          deferred_until: null,
          updated_at: now,
        }
      : requestedStatus === "deferred"
        ? {
            status: "deferred",
            deferred_until:
              typeof body.deferredUntil === "string" &&
              Number.isFinite(Date.parse(body.deferredUntil))
                ? body.deferredUntil
                : null,
            updated_at: now,
          }
        : {
            status: "cancelled",
            cancelled_reason: cleanText(body.reason, 500),
            updated_at: now,
          };

  const { data, error } = await supabase
    .from("impact_commitments")
    .update(payload)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, commitment: data });
}
