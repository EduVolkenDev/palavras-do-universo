import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { sendSkyEmail, skyEmailConfigured } from "@/lib/daily-sky-email/mailer";
import { SKY_EMAIL_CONSENT, SKY_EMAIL_CONSENT_VERSION, type SkyEmailLocale } from "@/lib/daily-sky-email/consent";

export const runtime = "nodejs";
const BASE = "https://palavrasdouniverso.com";

type Body = { email?: unknown; locale?: unknown; consent?: unknown; website?: unknown };
const result = (code: string, status = 200) => NextResponse.json({ code }, { status });

export async function POST(request: Request) {
  if (!(await checkRateLimit({ request, scope: "daily-sky-email", limit: 4, windowMs: 60 * 60 * 1000, strict: true }))) {
    return result("RATE_LIMITED", 429);
  }
  if (!hasSupabaseConfig() || !skyEmailConfigured()) return result("UNAVAILABLE", 503);
  const parsed = await readJsonBody<Body>(request);
  if (!parsed.ok) return result("INVALID_REQUEST", 400);
  if (String(parsed.body.website ?? "").trim()) return result("CHECK_EMAIL");
  const email = typeof parsed.body.email === "string" ? parsed.body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return result("INVALID_EMAIL", 400);
  if (parsed.body.consent !== true) return result("CONSENT_REQUIRED", 400);
  const locale: SkyEmailLocale = parsed.body.locale === "en" ? "en" : "pt-BR";
  const admin = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await admin.from("daily_sky_email_subscriptions")
    .select("id,status,confirmed_at").eq("email", email).maybeSingle();
  if (lookupError) return result("UNAVAILABLE", 503);
  if (existing?.status === "active") return result("CHECK_EMAIL");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const unsubscribeToken = randomBytes(32).toString("base64url");
  const now = new Date();
  const record = {
    email, locale, timezone: "Europe/London", status: "pending",
    confirmation_token_hash: tokenHash,
    confirmation_expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    unsubscribe_token: unsubscribeToken,
    consent_source: "daily-sky-form", consented_at: now.toISOString(),
    consent_version: SKY_EMAIL_CONSENT_VERSION, consent_text: SKY_EMAIL_CONSENT[locale],
    confirmation_message_id: null,
    confirmed_at: null, unsubscribed_at: null, updated_at: now.toISOString(),
  };
  const { data: savedRecord, error: saveError } = existing
    ? await admin.from("daily_sky_email_subscriptions").update(record).eq("id", existing.id).eq("status", existing.status).select("id").maybeSingle()
    : await admin.from("daily_sky_email_subscriptions").insert(record);
  if (saveError) return result("UNAVAILABLE", 503);
  if (existing && !savedRecord) return result("CHECK_EMAIL");

  const confirmUrl = `${BASE}/api/daily-sky-email/confirm?token=${encodeURIComponent(token)}`;
  try {
    const messageId = await sendSkyEmail({
      to: email, locale, tag: "daily-sky-confirmation",
      subject: locale === "en" ? "Confirm your daily sky email" : "Confirme seu céu por e-mail",
      paragraphs: locale === "en"
        ? ["You asked to receive a short, thoughtful note about the sky each morning.", "Confirm your address to complete sign-up. Newsletter delivery has not started yet. This link is valid for 24 hours. If this wasn't you, simply ignore this email."]
        : ["Você pediu para receber uma nota breve e cuidadosa sobre o céu todas as manhãs.", "Confirme seu endereço para concluir a inscrição. Os envios do boletim ainda não começaram. Este link vale por 24 horas. Se não foi você, apenas ignore este e-mail."],
      unsubscribeUrl: `${BASE}/api/daily-sky-email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
      action: { label: locale === "en" ? "Confirm my subscription" : "Confirmar minha inscrição", url: confirmUrl },
    });
    const { error: receiptError } = await admin.from("daily_sky_email_subscriptions")
      .update({ confirmation_message_id: messageId }).eq("email", email).eq("confirmation_token_hash", tokenHash);
    if (receiptError) console.error("Daily sky confirmation receipt could not be stored");
  } catch (error) {
    console.error("Daily sky confirmation delivery failed", error instanceof Error ? error.message : "unknown error");
    return result("DELIVERY_UNAVAILABLE", 503);
  }
  return result("CHECK_EMAIL", 201);
}
