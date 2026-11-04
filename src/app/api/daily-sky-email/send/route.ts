import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { dailySkyStory, type SkyEmailLocale } from "@/lib/daily-sky-email/content";
import { sendSkyEmail, skyEmailConfigured } from "@/lib/daily-sky-email/mailer";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { inMorningWindow } from "@/lib/daily-sky-email/schedule";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || !supplied) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  if (process.env.PDU_DAILY_SKY_EMAIL_ENABLED !== "true") return NextResponse.json({ code: "SENDING_DISABLED" }, { status: 503 });
  if (!hasSupabaseConfig() || !skyEmailConfigured()) return NextResponse.json({ code: "UNAVAILABLE" }, { status: 503 });
  const now = new Date();
  const day = inMorningWindow(now);
  // The scheduler runs several times per hour; only morning runs may send.
  if (!day.due) return NextResponse.json({ code: "OUTSIDE_WINDOW", date: day.date });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("claim_daily_sky_email_batch", { p_date: day.date, p_limit: 20 });
  if (error) return NextResponse.json({ code: "DATABASE_UNAVAILABLE" }, { status: 503 });
  const rows = data ?? [];
  const counts = { considered: rows.length, accepted: 0, failed: 0 };
  // Noon UTC is a consistent astronomical snapshot, not a personal chart.
  const skyTime = new Date(`${day.date}T12:00:00.000Z`);
  async function deliver(row: (typeof rows)[number]) {
    try {
      // A user may unsubscribe while a batch is running; check again before sending.
      const { data: current, error: currentError } = await admin.from("daily_sky_email_subscriptions")
        .select("status").eq("id", row.subscription_id).single();
      if (currentError || current?.status !== "active") throw new Error("SUBSCRIPTION_NOT_ACTIVE");
      const locale: SkyEmailLocale = row.locale === "en" ? "en" : "pt-BR";
      const story = dailySkyStory(skyTime, locale);
      const messageId = await sendSkyEmail({
        to: row.email, locale, tag: "daily-sky", subject: story.subject,
        paragraphs: [story.observation, story.reflection],
        action: { label: locale === "en" ? "Explore your sky" : "Explore o seu céu", url: "https://palavrasdouniverso.com/astrologia" },
        unsubscribeUrl: `https://palavrasdouniverso.com/api/daily-sky-email/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token)}`,
      });
      const { error: updateError } = await admin.from("daily_sky_email_deliveries")
        .update({ status: "accepted", provider_message_id: messageId, sent_at: new Date().toISOString() })
        .eq("id", row.delivery_id);
      if (updateError) throw new Error("DELIVERY_LOG_UPDATE_FAILED");
      counts.accepted++;
    } catch (caught) {
      const code = caught instanceof Error ? caught.message.slice(0, 120) : "UNKNOWN";
      await admin.from("daily_sky_email_deliveries").update({ status: "failed", error_code: code }).eq("id", row.delivery_id);
      counts.failed++;
    }
  }
  // Bound provider and database concurrency to keep the Worker responsive.
  for (let offset = 0; offset < rows.length; offset += 5) {
    await Promise.all(rows.slice(offset, offset + 5).map(deliver));
  }
  return NextResponse.json({ code: "PROCESSED", date: day.date, ...counts });
}
