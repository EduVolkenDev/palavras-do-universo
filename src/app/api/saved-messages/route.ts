import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";

type SaveMessageBody = {
  clientKey?: unknown;
  readingId?: unknown;
  messageType?: unknown;
  payload?: unknown;
};

function asClientKey(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return /^local_[a-z0-9]+$/i.test(clean) && clean.length <= 80 ? clean : null;
}

function isAllowedMessageType(value: string) {
  return value === "daily_card" || value === "reading";
}

function isPayloadAllowed(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return false;
  return JSON.stringify(payload).length <= 100_000;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, messages: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("saved_messages")
    .select("id, reading_id, message_type, payload, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messages: data ?? [] });
}

export async function POST(req: Request) {
  const parsed = await readJsonBody<SaveMessageBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const requestedReadingId =
    typeof body.readingId === "string" && body.readingId
      ? body.readingId
      : null;
  const messageType =
    typeof body.messageType === "string" && body.messageType
      ? body.messageType
      : "reading";
  const clientKey = asClientKey(body.clientKey);

  if (!isAllowedMessageType(messageType) || !isPayloadAllowed(body.payload)) {
    return NextResponse.json({ error: "Invalid saved message" }, { status: 400 });
  }

  await ensureSupabaseProfile(auth.user.id);

  const supabase = getSupabaseAdmin();
  let readingId: string | null = null;
  if (requestedReadingId) {
    const { data: ownedReading } = await supabase
      .from("readings")
      .select("id")
      .eq("id", requestedReadingId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    readingId = typeof ownedReading?.id === "string" ? ownedReading.id : null;
  }

  const { data, error } = await supabase
    .from("saved_messages")
    .upsert({
      user_id: auth.user.id,
      reading_id: readingId,
      message_type: messageType,
      payload: body.payload ?? {},
      client_key: clientKey,
    }, {
      onConflict: "user_id,client_key",
      ignoreDuplicates: true,
    })
    .select("id, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, savedMessage: data });
}
