import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdmin, hasSupabaseConfig, ensureSupabaseProfile } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/request";

type FeedbackBody = {
  readingId?: unknown;
  source?: unknown;
  resonanceScore?: unknown;
  message?: unknown;
  displayName?: unknown;
  allowTestimonial?: unknown;
  locale?: unknown;
};

const feedbackAttempts = new Map<string, number[]>();
const MAX_MESSAGE_LENGTH = 2_000;

function isSafeAnonymousUserId(value: string) {
  return /^pdu_[a-z0-9]{12,80}$/i.test(value);
}

function getCookieValue(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name && value.length) return decodeURIComponent(value.join("="));
  }
  return "";
}

function getRateLimitKey(req: Request, userId: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwarded || req.headers.get("x-real-ip") || "unknown"}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (feedbackAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < 60 * 60 * 1_000
  );

  if (recent.length >= 3) {
    feedbackAttempts.set(key, recent);
    return true;
  }

  feedbackAttempts.set(key, [...recent, now]);
  return false;
}

function asUuid(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean)
    ? clean
    : null;
}

function asShortText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[ \t]+/g, " ").slice(0, maxLength);
}

function asMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, MAX_MESSAGE_LENGTH);
}

function asResonanceScore(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}

export async function POST(req: Request) {
  const parsed = await readJsonBody<FeedbackBody>(req);
  if (!parsed.ok) return parsed.response;

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Feedback is temporarily unavailable" },
      { status: 503 }
    );
  }

  const body = parsed.body;
  const authenticatedUser = await getAuthenticatedUser();
  const anonymousCookie = getCookieValue(req, "pdu_reader_id");
  const anonymousUserId = isSafeAnonymousUserId(anonymousCookie)
    ? anonymousCookie
    : null;
  const userId = authenticatedUser?.id ?? anonymousUserId;

  if (isRateLimited(getRateLimitKey(req, userId))) {
    return NextResponse.json(
      { error: "Você já enviou algumas mensagens. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const source = body.source === "reading" ? "reading" : body.source === "footer" ? "footer" : null;
  const message = asMessage(body.message);
  const readingId = asUuid(body.readingId);
  const resonanceScore = asResonanceScore(body.resonanceScore);
  const displayName = asShortText(body.displayName, 80);
  const allowTestimonial = body.allowTestimonial === true;
  const locale = String(body.locale ?? "pt-BR").startsWith("en") ? "en" : "pt-BR";

  if (!source || message.length < 8) {
    return NextResponse.json(
      { error: "Conte um pouco mais sobre o que essa experiência despertou em você." },
      { status: 400 }
    );
  }

  if (body.resonanceScore !== null && body.resonanceScore !== undefined && body.resonanceScore !== "" && resonanceScore === null) {
    return NextResponse.json({ error: "Escolha uma nota entre 1 e 5." }, { status: 400 });
  }

  if (readingId) {
    const supabase = getSupabaseAdmin();
    const { data: reading, error } = await supabase
      .from("readings")
      .select("id, user_id")
      .eq("id", readingId)
      .maybeSingle();

    if (error || !reading) {
      return NextResponse.json({ error: "Não foi possível reconhecer esta leitura." }, { status: 400 });
    }

    if (!userId || reading.user_id !== userId) {
      return NextResponse.json({ error: "Esta leitura não pertence a este navegador." }, { status: 403 });
    }
  }

  if (userId) await ensureSupabaseProfile(userId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_feedback")
    .insert({
      reading_id: readingId,
      user_id: userId,
      source,
      resonance_score: resonanceScore,
      message,
      display_name: allowTestimonial && displayName ? displayName : null,
      allow_testimonial: allowTestimonial,
      locale,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Feedback persistence failed:", error);
    return NextResponse.json({ error: "Não foi possível guardar seu feedback agora." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, feedbackId: data.id });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
