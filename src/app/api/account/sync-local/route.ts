import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";

type LocalMessage = {
  id?: unknown;
  message_type?: unknown;
  payload?: unknown;
  created_at?: unknown;
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_BYTES = 100_000;
const MAX_REQUEST_BYTES = 600_000;

function normalizeMessage(value: unknown) {
  if (typeof value !== "object" || value === null) return null;

  const message = value as LocalMessage;
  const clientKey = typeof message.id === "string" ? message.id.trim() : "";
  const messageType =
    typeof message.message_type === "string" ? message.message_type : "";
  const createdAt =
    typeof message.created_at === "string" &&
    Number.isFinite(Date.parse(message.created_at))
      ? message.created_at
      : new Date().toISOString();

  if (!/^local_[a-z0-9]+$/i.test(clientKey) || clientKey.length > 80) {
    return null;
  }
  if (messageType !== "daily_card" && messageType !== "reading") return null;
  if (typeof message.payload !== "object" || message.payload === null) return null;
  if (JSON.stringify(message.payload).length > MAX_MESSAGE_BYTES) return null;

  return {
    client_key: clientKey,
    reading_id: null,
    message_type: messageType,
    payload: message.payload,
    created_at: createdAt,
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Sync payload too large" }, { status: 413 });
  }

  const parsed = await readJsonBody<{ messages?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  if (JSON.stringify(body).length > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Sync payload too large" }, { status: 413 });
  }
  if (!Array.isArray(body.messages) || body.messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
  }

  const normalized = body.messages
    .map(normalizeMessage)
    .filter((message) => message !== null);

  if (!normalized.length) {
    return NextResponse.json({ ok: true, syncedKeys: [] });
  }

  await ensureSupabaseProfile(auth.user.id);
  const supabase = getSupabaseAdmin();
  const rows = normalized.map((message) => ({
    ...message,
    user_id: auth.user.id,
  }));
  const { error } = await supabase.from("saved_messages").upsert(rows, {
    onConflict: "user_id,client_key",
    ignoreDuplicates: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    syncedKeys: normalized.map((message) => message.client_key),
  });
}
