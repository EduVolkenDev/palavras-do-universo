import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  EDU_READING_BLOCKING_STATUSES,
  getUpcomingEduReadingAvailability,
  isEduReadingOfferId,
  type EduReadingBusySlot,
} from "@/lib/edu-reading-offers";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json(
    {
      error:
        "A agenda está sendo preparada. Tente novamente em alguns instantes.",
      code: "BOOKING_UNAVAILABLE",
    },
    { status: 503 }
  );
}

function normalizeLocale(value: string | null) {
  return value?.trim().toLowerCase().startsWith("en") ? "en" : "pt-BR";
}

function normalizeTime(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value;
}

export async function GET(request: Request) {
  const allowed = await checkRateLimit({
    request,
    scope: "edu-reading-availability",
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas atualizações da agenda. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  if (!hasSupabaseConfig()) return unavailable();

  const url = new URL(request.url);
  const offerId = url.searchParams.get("offerId");
  if (!isEduReadingOfferId(offerId)) {
    return NextResponse.json({ error: "Escolha uma leitura válida." }, { status: 400 });
  }

  const locale = normalizeLocale(url.searchParams.get("locale"));
  const now = new Date();
  const preliminary = getUpcomingEduReadingAvailability(offerId, locale, now);
  if (!preliminary.length) {
    return NextResponse.json({ ok: true, availability: [], timezone: "Europe/London" });
  }

  const dateKeys = preliminary.map((day) => day.dateKey);
  const supabase = getSupabaseAdmin();

  // Stripe will send an expiry event, but the database also clears overdue
  // holds here so a delayed webhook can never keep a time blocked forever.
  const { error: expireError } = await supabase
    .from("edu_reading_requests")
    .update({ status: "expired", updated_at: now.toISOString() })
    .eq("status", "payment_pending")
    .lt("checkout_expires_at", now.toISOString());
  if (expireError) return unavailable();

  const { data, error } = await supabase
    .from("edu_reading_requests")
    .select("date_key, start_time, end_time")
    .in("date_key", dateKeys)
    .in("status", [...EDU_READING_BLOCKING_STATUSES]);
  if (error) return unavailable();

  const busySlots: EduReadingBusySlot[] = (data ?? []).map((booking) => ({
    dateKey: booking.date_key,
    startTime: normalizeTime(booking.start_time),
    endTime: normalizeTime(booking.end_time),
  }));

  return NextResponse.json({
    ok: true,
    availability: getUpcomingEduReadingAvailability(offerId, locale, now, busySlots),
    timezone: "Europe/London",
  });
}
