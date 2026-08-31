import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

// Configure VAPID — keys must be set in env before using push
function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:contato@palavrasdouniverso.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(email, publicKey, privateKey);
  return true;
}

type PushRow = {
  endpoint: string;
  subscription: webpush.PushSubscription;
};

type ProfilePushRow = {
  push_subscription: webpush.PushSubscription | null;
};

// POST /api/push/send
// Protected by CRON_SECRET header — call this from your cron job daily at 8am
// Body: { message?: string, title?: string, url?: string }
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Push delivery is not securely configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!configureVapid()) {
    return NextResponse.json(
      { error: "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY." },
      { status: 503 }
    );
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body: { message?: unknown; title?: unknown; url?: unknown } = {};
  try {
    const parsed = (await request.json()) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
    }
    body = parsed as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const title = body.title === undefined ? "Palavras do Universo" : body.title;
  const message =
    body.message === undefined
      ? "Sua mensagem de hoje está pronta. Abra para receber."
      : body.message;
  const url = body.url === undefined ? "/" : body.url;
  if (
    typeof title !== "string" ||
    typeof message !== "string" ||
    typeof url !== "string" ||
    title.trim().length > 120 ||
    message.trim().length > 2_000 ||
    url.length > 2_048 ||
    !url.startsWith("/") ||
    url.startsWith("//")
  ) {
    return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
  }

  const payload = JSON.stringify({
    title: title.trim(),
    body: message.trim(),
    url,
    tag: "pdu-daily",
  });

  const supabase = getSupabaseAdmin();
  const results = { sent: 0, failed: 0, stale: [] as string[] };

  // 1. Authenticated users with push_subscription on profile
  const { data: profiles } = await supabase
    .from("profiles")
    .select("push_subscription")
    .not("push_subscription", "is", null) as { data: ProfilePushRow[] | null };

  // 2. Anonymous subscriptions
  const { data: anonSubs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, subscription") as { data: PushRow[] | null };

  const subscriptions: webpush.PushSubscription[] = [
    ...(profiles ?? []).map((p) => p.push_subscription).filter(Boolean) as webpush.PushSubscription[],
    ...(anonSubs ?? []).map((r) => r.subscription),
  ];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        results.sent++;
      } catch (err: unknown) {
        results.failed++;
        // 410 Gone = subscription expired, mark for cleanup
        if (typeof err === "object" && err !== null && (err as { statusCode?: number }).statusCode === 410) {
          results.stale.push((sub as { endpoint: string }).endpoint);
        }
      }
    })
  );

  // Clean up stale subscriptions
  if (results.stale.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", results.stale);
    await supabase
      .from("profiles")
      .update({ push_subscription: null })
      .in("push_subscription->endpoint", results.stale);
  }

  return NextResponse.json({ ok: true, ...results });
}

// GET /api/push/vapid-public-key — returns the public VAPID key to the frontend
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}
