import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { hasCircleAstrologyAccess } from "@/lib/astrology/server-access";
import { cleanPersonalText, daysSince, isDailyCheckIn, localDateAt, type DailyCheckIn } from "@/lib/astrology/daily-continuity";
import { isIanaTimezone } from "@/lib/astrology/birth-data";
import { ensureSupabaseProfile, getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store" };
const messageType = "daily_sky_checkin";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Payload = Omit<DailyCheckIn, "id" | "createdAt"> & { kind: "daily_sky_checkin"; version: 1 };

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers });
}

function parseRow(row: { id: string; created_at: string; payload: unknown }): DailyCheckIn | null {
  if (!row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) return null;
  const payload = row.payload as Record<string, unknown>;
  if (payload.kind !== messageType || payload.version !== 1) return null;
  const entry = { ...payload, id: row.id, createdAt: row.created_at };
  return isDailyCheckIn(entry) ? entry : null;
}

function validOptionalText(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && (!value.trim() || cleanPersonalText(value) !== null));
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
    const raw = await request.text();
    if (raw.length > 4_000) return null;
    const body: unknown = JSON.parse(raw);
    return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch { return null; }
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return response({ code: "UNAVAILABLE" }, 503);
  try {
    const requestedOffset = Number(new URL(request.url).searchParams.get("offset") ?? 0);
    const offset = Number.isSafeInteger(requestedOffset) && requestedOffset >= 0 && requestedOffset <= 1_000_000 ? requestedOffset : 0;
    const limit = 20;
    const { data, error } = await getSupabaseAdmin().from("saved_messages")
      .select("id,created_at,payload").eq("user_id", auth.user.id).eq("message_type", messageType)
      .order("created_at", { ascending: false }).range(offset, offset + limit);
    if (error) throw error;
    const rows = data ?? [];
    return response({ ok: true, checkIns: rows.slice(0, limit).map(parseRow).filter(Boolean),
      hasMore: rows.length > limit, nextOffset: offset + Math.min(rows.length, limit) });
  } catch {
    return response({ code: "CHECK_INS_UNAVAILABLE" }, 503);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return response({ code: "UNAVAILABLE" }, 503);
  const body = await readBody(request);
  const localDate = body?.localDate;
  const timezone = body?.timezone;
  const locale = body?.locale;
  const gesture = cleanPersonalText(body?.gesture);
  const reflection = cleanPersonalText(body?.reflection);
  if (typeof localDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(localDate) ||
      !isIanaTimezone(timezone) || localDate !== localDateAt(new Date(), timezone) ||
      (locale !== "pt-BR" && locale !== "en") ||
      (!gesture && !reflection) || !validOptionalText(body?.gesture) || !validOptionalText(body?.reflection)) {
    return response({ code: "INVALID_CHECK_IN" }, 400);
  }
  try {
    if (!await hasCircleAstrologyAccess(auth.user)) return response({ code: "CIRCLE_REQUIRED" }, 403);
    const supabase = getSupabaseAdmin();
    const { data: daily, error: dailyError } = await supabase.from("astrology_daily_readings")
      .select("reading").eq("user_id", auth.user.id).eq("local_date", localDate)
      .eq("timezone", timezone).eq("locale", locale).eq("status", "ready")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (dailyError) throw dailyError;
    const reading = daily?.reading as { content?: { nextStep?: unknown } } | null;
    const nextStep = reading?.content?.nextStep;
    if (typeof nextStep !== "string" || !nextStep.trim()) return response({ code: "DAILY_READING_REQUIRED" }, 409);
    const clientKey = `local_daily_${createHash("sha256").update(`${auth.user.id}:${localDate}:${timezone}`).digest("hex").slice(0, 32)}`;
    const payload: Payload = {
      kind: messageType, version: 1, localDate, timezone, nextStep: nextStep.slice(0, 400),
      gesture: gesture ?? "", reflection: reflection ?? "", followupText: null, followupAt: null,
    };
    await ensureSupabaseProfile(auth.user.id, auth.user.email);
    const { error: insertError } = await supabase.from("saved_messages").upsert({
      user_id: auth.user.id, message_type: messageType, client_key: clientKey, payload,
    }, { onConflict: "user_id,client_key", ignoreDuplicates: true });
    if (insertError) throw insertError;
    const { data: row, error: readError } = await supabase.from("saved_messages")
      .select("id,created_at,payload").eq("user_id", auth.user.id).eq("client_key", clientKey).maybeSingle();
    if (readError) throw readError;
    const checkIn = row ? parseRow(row) : null;
    if (!checkIn) throw new Error("Missing saved check-in");
    return response({ ok: true, checkIn });
  } catch {
    return response({ code: "CHECK_IN_UNAVAILABLE" }, 503);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return response({ code: "UNAVAILABLE" }, 503);
  const body = await readBody(request);
  const id = body?.id;
  const followupText = cleanPersonalText(body?.followupText);
  if (typeof id !== "string" || !uuid.test(id) || !followupText) return response({ code: "INVALID_FOLLOWUP" }, 400);
  try {
    if (!await hasCircleAstrologyAccess(auth.user)) return response({ code: "CIRCLE_REQUIRED" }, 403);
    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("saved_messages")
      .select("id,created_at,payload").eq("id", id).eq("user_id", auth.user.id)
      .eq("message_type", messageType).maybeSingle();
    if (error) throw error;
    const checkIn = row ? parseRow(row) : null;
    if (!checkIn) return response({ code: "CHECK_IN_NOT_FOUND" }, 404);
    if (checkIn.followupAt) return response({ ok: true, checkIn });
    if (daysSince(checkIn.localDate, checkIn.timezone) < 2) return response({ code: "FOLLOWUP_NOT_READY" }, 409);
    const payload = { ...(row!.payload as Payload), followupText, followupAt: new Date().toISOString() };
    const { data: updated, error: updateError } = await supabase.from("saved_messages")
      .update({ payload }).eq("id", id).eq("user_id", auth.user.id)
      .eq("message_type", messageType).select("id,created_at,payload").maybeSingle();
    if (updateError || !updated) throw updateError ?? new Error("Update missing");
    return response({ ok: true, checkIn: parseRow(updated) });
  } catch {
    return response({ code: "FOLLOWUP_UNAVAILABLE" }, 503);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!hasSupabaseConfig()) return response({ code: "UNAVAILABLE" }, 503);
  const body = await readBody(request);
  const id = body?.id;
  if (typeof id !== "string" || !uuid.test(id)) return response({ code: "INVALID_CHECK_IN" }, 400);
  try {
    const { error } = await getSupabaseAdmin().from("saved_messages")
      .delete().eq("id", id).eq("user_id", auth.user.id).eq("message_type", messageType);
    if (error) throw error;
    return response({ ok: true });
  } catch {
    return response({ code: "CHECK_IN_UNAVAILABLE" }, 503);
  }
}
