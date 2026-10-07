import { createHmac, timingSafeEqual } from "node:crypto";
import {
  sendVoucherEmailDirectlyFromNode,
  type VoucherEmailInput,
} from "@/lib/email/transactional";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BODY_BYTES = 24 * 1024;
const MAX_CLOCK_SKEW_SECONDS = 120;
const CANONICAL_SITE = "https://palavrasdouniverso.com";

function unauthorized() {
  return Response.json({ ok: false }, { status: 401, headers: { "cache-control": "no-store" } });
}

function parseVoucherEmailInput(value: unknown):
  | { voucher: VoucherEmailInput; invalidFields: [] }
  | { voucher: null; invalidFields: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { voucher: null, invalidFields: ["body"] };
  }

  const input = value as Record<string, unknown>;
  const invalidFields: string[] = [];
  const requiredText = (field: string, max: number) => {
    const candidate = input[field];
    if (typeof candidate !== "string" || !candidate.trim() || candidate.length > max) {
      invalidFields.push(field);
      return "";
    }
    return candidate.trim();
  };

  const id = requiredText("id", 100);
  const code = requiredText("code", 120);
  const label = requiredText("label", 240);
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) invalidFields.push("id");
  if (code && !/^[a-zA-Z0-9_-]+$/.test(code)) invalidFields.push("code");

  const kind = input.kind;
  if (kind !== "invite" && kind !== "discount" && kind !== "hybrid") {
    invalidFields.push("kind");
  }

  const nullableText = (field: string, max: number) => {
    const candidate = input[field];
    if (candidate === undefined || candidate === null) return null;
    if (typeof candidate !== "string" || candidate.length > max) {
      invalidFields.push(field);
      return null;
    }
    return candidate.trim() || null;
  };

  const description = nullableText("description", 1200);
  const recipientName = nullableText("recipient_name", 240);
  const primaryTitle = nullableText("primary_title", 240);
  const targetEmail = nullableText("target_email", 320);
  if (targetEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    invalidFields.push("target_email");
  }

  const expiryDays = input.grant_expires_days;
  if (
    expiryDays !== undefined &&
    expiryDays !== null &&
    (typeof expiryDays !== "number" || !Number.isFinite(expiryDays))
  ) {
    invalidFields.push("grant_expires_days");
  }

  const locale = input.email_locale;
  if (locale !== undefined && locale !== "pt-BR" && locale !== "en") {
    invalidFields.push("email_locale");
  }

  if (invalidFields.length > 0) return { voucher: null, invalidFields };

  return {
    voucher: {
      id,
      code,
      label,
      description,
      kind: kind as VoucherEmailInput["kind"],
      share_url: `${CANONICAL_SITE}/voucher/${encodeURIComponent(code)}`,
      primary_title: primaryTitle,
      target_email: targetEmail,
      recipient_name: recipientName,
      grant_expires_days: typeof expiryDays === "number" ? expiryDays : null,
      email_locale: locale === "en" ? "en" : "pt-BR",
    },
    invalidFields: [],
  };
}

export async function POST(request: Request) {
  const secret = process.env.BREVO_SMTP_KEY?.trim().replace(/^['"]|['"]$/g, "").trim();
  if (!secret) return Response.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });

  const timestamp = request.headers.get("x-pdu-timestamp") ?? "";
  const signature = request.headers.get("x-pdu-signature") ?? "";
  const timestampNumber = Number(timestamp);
  if (!/^\d{10}$/.test(timestamp) || !Number.isFinite(timestampNumber)) return unauthorized();
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > MAX_CLOCK_SKEW_SECONDS) return unauthorized();
  if (!/^[a-f0-9]{64}$/i.test(signature)) return unauthorized();

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return Response.json({ ok: false }, { status: 413, headers: { "cache-control": "no-store" } });
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  const provided = Buffer.from(signature, "hex");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return unauthorized();

  let voucher: unknown;
  try {
    voucher = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  const parsed = parseVoucherEmailInput(voucher);
  if (!parsed.voucher) {
    console.error("[voucher-email] signed payload rejected", {
      invalidFields: parsed.invalidFields,
    });
    return Response.json({ ok: false }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const delivery = await sendVoucherEmailDirectlyFromNode(parsed.voucher);
  const status = delivery.status === "sent" ? 200 : delivery.status === "skipped" ? 200 : 502;
  return Response.json(
    { ok: delivery.status === "sent", delivery: delivery.status },
    { status, headers: { "cache-control": "no-store" } }
  );
}
