import { NextResponse } from "next/server";
import {
  ensureSupabaseProfile,
  getAuthenticatedUser,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";

type SubscribeBody = {
  subscription?: unknown;
};

function isValidSubscription(v: unknown): v is PushSubscriptionJSON {
  if (typeof v !== "object" || v === null) return false;
  const record = v as Record<string, unknown>;
  const endpoint = record.endpoint;
  const keys = record.keys;
  if (typeof endpoint !== "string" || endpoint.length > 2_048) return false;

  try {
    if (new URL(endpoint).protocol !== "https:") return false;
  } catch {
    return false;
  }

  if (typeof keys !== "object" || keys === null) return false;
  const pushKeys = keys as Record<string, unknown>;
  return (
    typeof pushKeys.p256dh === "string" &&
    pushKeys.p256dh.length > 0 &&
    pushKeys.p256dh.length <= 512 &&
    typeof pushKeys.auth === "string" &&
    pushKeys.auth.length > 0 &&
    pushKeys.auth.length <= 512
  );
}

export async function POST(request: Request) {
  if (
    !(await checkRateLimit({
      request,
      scope: "push-subscribe",
      limit: 20,
      windowMs: 60 * 60 * 1_000,
    }))
  ) {
    return NextResponse.json({ error: "Too many subscription attempts" }, { status: 429 });
  }

  const parsed = await readJsonBody<SubscribeBody>(request);
  if (!parsed.ok) return parsed.response;

  const { subscription } = parsed.body ?? {};
  if (!isValidSubscription(subscription)) {
    return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    // Dev mode — just acknowledge
    return NextResponse.json({ ok: true });
  }

  const user = await getAuthenticatedUser();
  const supabase = getSupabaseAdmin();

  if (user) {
    // Authenticated: store on profile row
    await ensureSupabaseProfile(user.id);
    const { error } = await supabase
      .from("profiles")
      .update({
        push_subscription: subscription,
        push_subscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("[push/subscribe] profile update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Anonymous: store in dedicated table (endpoint is the natural key)
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: (subscription as { endpoint: string }).endpoint,
          subscription,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("[push/subscribe] anon upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (
    !(await checkRateLimit({
      request,
      scope: "push-unsubscribe",
      limit: 20,
      windowMs: 60 * 60 * 1_000,
    }))
  ) {
    return NextResponse.json({ error: "Too many subscription attempts" }, { status: 429 });
  }

  const parsed = await readJsonBody<SubscribeBody>(request);
  if (!parsed.ok) return parsed.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true });
  }

  const { subscription } = parsed.body ?? {};
  if (!isValidSubscription(subscription)) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const user = await getAuthenticatedUser();
  const supabase = getSupabaseAdmin();

  if (user) {
    await supabase
      .from("profiles")
      .update({ push_subscription: null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  } else {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", (subscription as { endpoint: string }).endpoint);
  }

  return NextResponse.json({ ok: true });
}
