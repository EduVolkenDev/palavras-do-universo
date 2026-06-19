import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { readJsonBody } from "@/lib/http/request";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { token } = await context.params;
  const supabase = getSupabaseAdmin();
  const { data: participation, error } = await supabase
    .from("impact_public_participations")
    .select("public_token,root_chain_token,action_key,action_title,area,status,created_at")
    .eq("public_token", token)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!participation) return NextResponse.json({ error: "Chain not found" }, { status: 404 });

  const { data: chain } = await supabase
    .from("impact_public_participations")
    .select("status")
    .eq("root_chain_token", participation.root_chain_token);
  return NextResponse.json({
    ok: true,
    participation,
    metrics: {
      participants: chain?.length ?? 1,
      completed: chain?.filter((item) => item.status === "completed").length ?? 0,
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  if (
    !(await checkRateLimit({
      request,
      scope: "public-impact-complete",
      limit: 30,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { token } = await context.params;
  const parsed = await readJsonBody<{ completionSecret?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const completionSecret =
    typeof body.completionSecret === "string" ? body.completionSecret : "";
  if (!isUuid(token) || !isUuid(completionSecret)) {
    return NextResponse.json({ error: "Missing completion secret" }, { status: 403 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("impact_public_participations")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("public_token", token)
    .eq("completion_secret", completionSecret)
    .select("public_token,status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Chain not found" }, { status: 404 });
  return NextResponse.json({ ok: true, participation: data });
}
