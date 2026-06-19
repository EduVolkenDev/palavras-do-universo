import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { getImpactAction } from "@/lib/impact/actions";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { readJsonBody } from "@/lib/http/request";

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanUuid(value: unknown) {
  const text = cleanText(value, 60);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    text
  )
    ? text
    : null;
}

export async function POST(request: Request) {
  if (
    !(await checkRateLimit({
      request,
      scope: "public-impact",
      limit: 30,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const action = getImpactAction(cleanText(body.actionKey, 80));
  if (!action) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const publicToken = cleanUuid(body.publicToken);
  const completionSecret = cleanUuid(body.completionSecret);
  const parentPublicToken = cleanUuid(body.parentPublicToken);
  let rootChainToken = cleanUuid(body.rootChainToken);

  if (parentPublicToken && !rootChainToken) {
    const { data: parent } = await supabase
      .from("impact_public_participations")
      .select("root_chain_token")
      .eq("public_token", parentPublicToken)
      .maybeSingle();
    rootChainToken = parent?.root_chain_token ?? null;
  }

  const payload = {
    action_key: action.key,
    action_title: action.title,
    area: action.area,
    parent_public_token: parentPublicToken,
    root_chain_token: rootChainToken || undefined,
  };

  let data;
  let error;
  if (publicToken) {
    if (!completionSecret) {
      return NextResponse.json(
        { error: "Missing completion secret" },
        { status: 403 }
      );
    }
    ({ data, error } = await supabase
      .from("impact_public_participations")
      .update(payload)
      .eq("public_token", publicToken)
      .eq("completion_secret", completionSecret)
      .select("public_token,completion_secret,root_chain_token,parent_public_token,status")
      .maybeSingle());
  } else {
    const generated = crypto.randomUUID();
    ({ data, error } = await supabase
      .from("impact_public_participations")
      .insert({
        ...payload,
        public_token: generated,
        root_chain_token: rootChainToken || generated,
      })
      .select("public_token,completion_secret,root_chain_token,parent_public_token,status")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Chain not found" }, { status: 404 });
  return NextResponse.json({ ok: true, participation: data });
}
