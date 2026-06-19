import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { getImpactAction } from "@/lib/impact/actions";
import { readJsonBody } from "@/lib/http/request";

type ActionBody = Record<string, unknown>;

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanDate(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null;
}

function cleanUuid(value: unknown) {
  const text = cleanText(value, 60);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    text
  )
    ? text
    : null;
}

async function ownedReadingId(userId: string, value: unknown) {
  const requested = cleanText(value, 60);
  if (!requested) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("readings")
    .select("id")
    .eq("id", requested)
    .eq("user_id", userId)
    .maybeSingle();
  return typeof data?.id === "string" ? data.id : null;
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return NextResponse.json({ ok: true, commitments: [] });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("impact_commitments")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, commitments: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const parsed = await readJsonBody<ActionBody>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const clientKey = cleanText(body.clientKey, 90);
  const action = getImpactAction(cleanText(body.actionKey, 80));
  const plan = cleanText(body.plan, 500);
  if (!/^action_[a-z0-9]+$/i.test(clientKey) || !action || plan.length < 8) {
    return NextResponse.json({ error: "Invalid commitment" }, { status: 400 });
  }

  await ensureSupabaseProfile(auth.user.id);
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("impact_commitments")
    .select("id,status,created_at,public_token,public_completion_secret,root_chain_token,parent_public_token")
    .eq("user_id", auth.user.id)
    .eq("client_key", clientKey)
    .maybeSingle();

  const requestedStatus = ["completed", "deferred", "cancelled"].includes(
    cleanText(body.status, 20)
  )
    ? cleanText(body.status, 20)
    : "committed";
  const status = existing?.status === "completed" ? "completed" : requestedStatus;
  const publicToken = cleanUuid(body.publicToken) || existing?.public_token;
  const rootChainToken =
    cleanUuid(body.rootChainToken) || existing?.root_chain_token || publicToken;
  const payload = {
    user_id: auth.user.id,
    client_key: clientKey,
    action_key: action.key,
    action_title: action.title,
    area: action.area,
    plan,
    beneficiary: cleanText(body.beneficiary, 240),
    first_step: cleanText(body.firstStep, 500),
    scheduled_for: cleanDate(body.scheduledFor),
    source_reading_id: await ownedReadingId(auth.user.id, body.sourceReadingId),
    invited_by: cleanText(body.invitedBy, 90) || null,
    parent_public_token:
      cleanUuid(body.parentPublicToken) || existing?.parent_public_token || null,
    public_token: publicToken || undefined,
    public_completion_secret:
      cleanUuid(body.publicCompletionSecret) ||
      existing?.public_completion_secret ||
      undefined,
    root_chain_token: rootChainToken || undefined,
    status,
    reflection:
      status === "completed" ? cleanText(body.reflection, 1000) : "",
    deferred_until:
      status === "deferred" ? cleanDate(body.deferredUntil) : null,
    cancelled_reason:
      status === "cancelled" ? cleanText(body.cancelledReason, 500) : "",
    completed_at:
      status === "completed"
        ? existing?.status === "completed"
          ? undefined
          : new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };

  const query = existing?.id
    ? supabase.from("impact_commitments").update(payload).eq("id", existing.id)
    : supabase.from("impact_commitments").insert(payload);
  const { data, error } = await query.select("*").maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, commitment: data });
}
