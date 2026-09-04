import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

type SiteEventBody = {
  eventType?: unknown;
  severity?: unknown;
  source?: unknown;
  route?: unknown;
  path?: unknown;
  locale?: unknown;
  anonymousId?: unknown;
  readingId?: unknown;
  productKey?: unknown;
  message?: unknown;
  errorName?: unknown;
  stack?: unknown;
  lastAction?: unknown;
  viewport?: unknown;
  scroll?: unknown;
  context?: unknown;
};

const EVENT_SEVERITIES = new Set(["debug", "info", "warning", "error", "fatal"]);
const MAX_TEXT = {
  eventType: 120,
  source: 80,
  route: 260,
  path: 260,
  locale: 12,
  anonymousId: 120,
  productKey: 80,
  message: 1_200,
  errorName: 160,
  stack: 4_000,
  lastAction: 700,
  userAgent: 500,
};

function scrubText(value: string) {
  return value
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9_=-]{8,}\b/g, "[redacted_key]")
    .replace(/\bwhsec_[A-Za-z0-9_=-]{8,}\b/g, "[redacted_webhook_secret]")
    .replace(/\bsk-ant-api03-[A-Za-z0-9_-]{8,}\b/g, "[redacted_api_key]");
}

function asText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return scrubText(value.trim().replace(/\s+/g, " ")).slice(0, maxLength);
}

function asMessage(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return scrubText(
    value
      .trim()
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
  ).slice(0, maxLength);
}

function asUuid(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(clean)
    ? clean
    : null;
}

function asProductKey(value: unknown) {
  const clean = asText(value, MAX_TEXT.productKey).toLowerCase();
  return /^[a-z0-9_:-]{2,80}$/.test(clean) ? clean : null;
}

function asEventType(value: unknown) {
  const clean = asText(value, MAX_TEXT.eventType).toLowerCase();
  return /^[a-z0-9_.:/-]{2,120}$/.test(clean) ? clean : "client.event";
}

function asJson(value: unknown, depth = 0): unknown {
  if (value === null) return null;
  if (["number", "boolean"].includes(typeof value)) return value;
  if (typeof value === "string") return scrubText(value).slice(0, 500);
  if (depth >= 4) return "[truncated]";

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => asJson(item, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 30);
    return Object.fromEntries(
      entries.map(([key, item]) => [asText(key, 80) || "key", asJson(item, depth + 1)])
    );
  }

  return String(value).slice(0, 200);
}

function getCookieValue(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name && value.length) return decodeURIComponent(value.join("="));
  }
  return "";
}

function responseAccepted(ok: boolean, extra?: Record<string, unknown>) {
  const response = NextResponse.json({ ok, accepted: ok, ...extra }, { status: 202 });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function POST(request: Request) {
  const parsed = await readJsonBody<SiteEventBody>(request);
  if (!parsed.ok) return parsed.response;

  if (
    !(await checkRateLimit({
      request,
      scope: "site-events",
      limit: 80,
      windowMs: 60 * 60 * 1_000,
    }))
  ) {
    return responseAccepted(false, { rateLimited: true });
  }

  if (!hasSupabaseConfig()) {
    return responseAccepted(false, { configured: false });
  }

  const body = parsed.body;
  const authenticatedUser = await getAuthenticatedUser();
  const severity = asText(body.severity, 20).toLowerCase();
  const anonymousId =
    asText(body.anonymousId, MAX_TEXT.anonymousId) ||
    asText(getCookieValue(request, "pdu_reader_id"), MAX_TEXT.anonymousId) ||
    null;

  const { error } = await getSupabaseAdmin().from("site_events").insert({
    event_type: asEventType(body.eventType),
    severity: EVENT_SEVERITIES.has(severity) ? severity : "info",
    source: asText(body.source, MAX_TEXT.source) || "client",
    route: asText(body.route, MAX_TEXT.route) || null,
    path: asText(body.path, MAX_TEXT.path) || null,
    locale: asText(body.locale, MAX_TEXT.locale) || null,
    user_id: authenticatedUser?.id ?? null,
    anonymous_id: anonymousId,
    reading_id: asUuid(body.readingId),
    product_key: asProductKey(body.productKey),
    message: asMessage(body.message, MAX_TEXT.message) || null,
    error_name: asText(body.errorName, MAX_TEXT.errorName) || null,
    stack: asMessage(body.stack, MAX_TEXT.stack) || null,
    last_action: asText(body.lastAction, MAX_TEXT.lastAction) || null,
    viewport: asJson(body.viewport) ?? {},
    scroll: asJson(body.scroll) ?? {},
    context: asJson(body.context) ?? {},
    user_agent: asText(request.headers.get("user-agent"), MAX_TEXT.userAgent) || null,
  });

  if (error) {
    console.error("Site event persistence failed:", error.message);
    return responseAccepted(false, { persisted: false });
  }

  return responseAccepted(true);
}
