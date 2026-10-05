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

function isVoucherEmailInput(value: unknown): value is VoucherEmailInput {
  if (!value || typeof value !== "object") return false;
  const voucher = value as Record<string, unknown>;
  const requiredStrings = ["id", "code", "label", "share_url"];
  if (requiredStrings.some((key) => typeof voucher[key] !== "string" || !(voucher[key] as string).trim())) {
    return false;
  }
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(voucher.id as string)) return false;
  if ((voucher.code as string).length > 120 || (voucher.label as string).length > 240) return false;
  if (voucher.description !== null && typeof voucher.description !== "string") return false;
  if (typeof voucher.description === "string" && voucher.description.length > 1200) return false;
  if (voucher.kind !== "invite" && voucher.kind !== "discount" && voucher.kind !== "hybrid") return false;
  if (voucher.email_locale !== "pt-BR" && voucher.email_locale !== "en") return false;
  if (voucher.target_email !== null && typeof voucher.target_email !== "string") return false;
  if (typeof voucher.target_email === "string") {
    if (voucher.target_email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voucher.target_email)) return false;
  }
  if (voucher.recipient_name !== null && typeof voucher.recipient_name !== "string") return false;
  if (typeof voucher.recipient_name === "string" && voucher.recipient_name.length > 240) return false;
  if (voucher.primary_title !== null && typeof voucher.primary_title !== "string") return false;
  if (typeof voucher.primary_title === "string" && voucher.primary_title.length > 240) return false;
  if (voucher.grant_expires_days !== null && typeof voucher.grant_expires_days !== "number") return false;

  try {
    const shareUrl = new URL(voucher.share_url as string);
    if (shareUrl.origin !== CANONICAL_SITE || !shareUrl.pathname.startsWith("/")) return false;
  } catch {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const secret = process.env.BREVO_SMTP_KEY?.trim().replace(/^['"]|['"]$/g, "").trim();
  if (!secret) return Response.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });

  const timestamp = request.headers.get("x-pdu-timestamp") ?? "";
  const signature = request.headers.get("x-pdu-signature") ?? "";
  const timestampNumber = Number(timestamp);
  if (!/^\d{10}$/.test(timestamp) || !Number.isFinite(timestampNumber)) return unauthorized();
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > MAX_CLOCK_SKEW_SECONDS) {
    return unauthorized();
  }
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
  if (!isVoucherEmailInput(voucher)) {
    return Response.json({ ok: false }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const delivery = await sendVoucherEmailDirectlyFromNode(voucher);
  const status = delivery.status === "sent" ? 200 : delivery.status === "skipped" ? 200 : 502;
  return Response.json(
    { ok: delivery.status === "sent", delivery: delivery.status },
    { status, headers: { "cache-control": "no-store" } }
  );
}
