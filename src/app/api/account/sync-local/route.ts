import { createHash } from "node:crypto";
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
  reading_id?: unknown;
  message_type?: unknown;
  payload?: unknown;
  created_at?: unknown;
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_BYTES = 100_000;
const MAX_REQUEST_BYTES = 600_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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
  if (
    messageType !== "daily_card" &&
    messageType !== "reading" &&
    messageType !== "practice"
  ) return null;
  if (typeof message.payload !== "object" || message.payload === null) return null;
  if (JSON.stringify(message.payload).length > MAX_MESSAGE_BYTES) return null;

  return {
    client_key: clientKey,
    reading_id: cleanReadingId(message.reading_id),
    message_type: messageType,
    payload: message.payload,
    created_at: createdAt,
  };
}

function cleanReadingId(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    clean
  )
    ? clean
    : null;
}

function stableImportedReadingId(userId: string, clientKey: string) {
  const hash = createHash("sha256")
    .update(`${userId}:${clientKey}`)
    .digest("hex");
  const normalized = `${hash.slice(0, 12)}4${hash.slice(13, 16)}8${hash.slice(17, 32)}`;
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
}

function asText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function localReadingRow(params: {
  message: ReturnType<typeof normalizeMessage>;
  readingId: string;
  userId: string;
  email?: string | null;
}) {
  const message = params.message;
  const payload = message?.payload;
  if (!message || !isRecord(payload) || message.message_type !== "reading") {
    return null;
  }

  const question = asText(payload.question, 500);
  const interpretation = asText(payload.result, 20_000);
  const spread = Array.isArray(payload.spreadCards)
    ? payload.spreadCards.slice(0, 20)
    : [];
  if (!question || !interpretation || !spread.length) return null;

  return {
    id: params.readingId,
    user_id: params.userId,
    email:
      typeof params.email === "string" && params.email.includes("@")
        ? params.email.trim().toLowerCase()
        : null,
    locale: asText(payload.locale, 12).startsWith("en") ? "en" : "pt-BR",
    theme: asText(payload.theme, 80) || "love",
    question,
    sanitized_question: question,
    mode: "LOCAL_IMPORT",
    intent_key: asText(payload.productKey, 80) || null,
    spread_type: asText(payload.spreadType, 100) || "situation_obstacle_direction",
    spread,
    interpretation,
    created_at: message.created_at,
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
  const clientKeys = normalized.map((message) => message.client_key);
  const { data: existingMessages, error: existingMessagesError } = await supabase
    .from("saved_messages")
    .select("client_key, reading_id")
    .eq("user_id", auth.user.id)
    .in("client_key", clientKeys);
  if (existingMessagesError) {
    return NextResponse.json({ error: existingMessagesError.message }, { status: 500 });
  }

  const existingReadingByClientKey = new Map<string, string | null>(
    (existingMessages ?? [])
      .filter((message) => typeof message.client_key === "string")
      .map((message) => [message.client_key as string, cleanReadingId(message.reading_id)])
  );
  const requestedReadingIds = normalized
    .map((message) => message.reading_id)
    .filter((id): id is string => Boolean(id));
  const ownedReadingIds = new Set<string>();
  if (requestedReadingIds.length) {
    const { data: ownedReadings, error: ownedReadingsError } = await supabase
      .from("readings")
      .select("id")
      .eq("user_id", auth.user.id)
      .in("id", requestedReadingIds);
    if (ownedReadingsError) {
      return NextResponse.json({ error: ownedReadingsError.message }, { status: 500 });
    }
    for (const reading of ownedReadings ?? []) {
      if (typeof reading.id === "string") ownedReadingIds.add(reading.id);
    }
  }

  const targetReadingId = (message: (typeof normalized)[number]) =>
    existingReadingByClientKey.get(message.client_key) ||
    (message.reading_id && ownedReadingIds.has(message.reading_id)
      ? message.reading_id
      : stableImportedReadingId(auth.user.id, message.client_key));

  const readingEntries = normalized
    .map((message) => {
      const reading = localReadingRow({
        message,
        readingId: targetReadingId(message),
        userId: auth.user.id,
        email: auth.user.email,
      });
      return reading ? { clientKey: message.client_key, reading } : null;
    })
    .filter((entry): entry is { clientKey: string; reading: NonNullable<ReturnType<typeof localReadingRow>> } => Boolean(entry));
  const readingRows = readingEntries.map((entry) => entry.reading);

  if (readingRows.length) {
    const { error: readingsError } = await supabase
      .from("readings")
      .upsert(readingRows, { onConflict: "id" });
    if (readingsError) {
      return NextResponse.json({ error: readingsError.message }, { status: 500 });
    }
  }

  const importedReadingByClientKey = new Map(
    readingEntries.map((entry) => [entry.clientKey, entry.reading.id])
  );
  const rows = normalized.map((message) => ({
    ...message,
    reading_id:
      importedReadingByClientKey.get(message.client_key) ??
      (message.reading_id && ownedReadingIds.has(message.reading_id)
        ? message.reading_id
        : null),
    user_id: auth.user.id,
  }));
  const { error } = await supabase.from("saved_messages").upsert(rows, {
    onConflict: "user_id,client_key",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    syncedKeys: normalized.map((message) => message.client_key),
  });
}
