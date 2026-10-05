import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { normalizeProductCurrency, type ProductCurrency } from "@/lib/product/pricing";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  EDU_READING_BLOCKING_STATUSES,
  EDU_READING_OFFERS,
  getEduReadingSlot,
  getUpcomingEduReadingAvailability,
  isEduReadingSlotAvailable,
  isEduReadingOfferId,
  type EduReadingBusySlot,
  type EduReadingOffer,
} from "@/lib/edu-reading-offers";
import { createEduReadingCheckout } from "@/lib/edu-reading-checkout";

export const runtime = "nodejs";

type RequestBody = {
  name?: unknown;
  email?: unknown;
  intention?: unknown;
  offerId?: unknown;
  currency?: unknown;
  dateKey?: unknown;
  startTime?: unknown;
  locale?: unknown;
};

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeLocale(value: unknown) {
  return String(value ?? "").trim().toLowerCase().startsWith("en") ? "en" : "pt-BR";
}

function normalizeTime(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value;
}

function unavailable() {
  return NextResponse.json(
    { error: "A agenda está sendo preparada. Tente novamente em alguns instantes.", code: "BOOKING_UNAVAILABLE" },
    { status: 503 }
  );
}

function getOffer(value: unknown): EduReadingOffer | null {
  return isEduReadingOfferId(value)
    ? EDU_READING_OFFERS.find((offer) => offer.id === value) ?? null
    : null;
}

export async function POST(request: Request) {
  const allowed = await checkRateLimit({
    request,
    scope: "edu-reading-request",
    limit: 5,
    windowMs: 60 * 60 * 1000,
    strict: true,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitos pedidos em pouco tempo. Tente novamente mais tarde.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "O sistema de agenda está temporariamente indisponível.", code: "BOOKING_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const parsed = await readJsonBody<RequestBody>(request);
  if (!parsed.ok) return parsed.response;

  const name = String(parsed.body.name ?? "").trim();
  const email = normalizeEmail(parsed.body.email);
  const intention = String(parsed.body.intention ?? "").trim().slice(0, 2000);
  const offer = getOffer(parsed.body.offerId);
  const currency = normalizeProductCurrency(parsed.body.currency) as ProductCurrency | null;
  const dateKey = String(parsed.body.dateKey ?? "").trim();
  const startTime = String(parsed.body.startTime ?? "").trim();
  const locale = normalizeLocale(parsed.body.locale);

  if (name.length < 2 || name.length > 100) return invalid("Informe seu nome.");
  if (!email) return invalid("Informe um e-mail válido.");
  if (!offer || !currency || !dateKey || !startTime) {
    return invalid("Escolha uma leitura, data e horário válidos.");
  }

  const now = new Date();
  const slot = getEduReadingSlot(offer.id, dateKey, startTime);
  const visibleDay = getUpcomingEduReadingAvailability(offer.id, locale, now).find(
    (day) => day.dateKey === dateKey && day.slots.includes(slot?.startTime ?? "")
  );
  if (!slot || !visibleDay) {
    return invalid("Esse horário não está disponível na agenda atual.", 409);
  }

  const supabase = getSupabaseAdmin();
  const { error: expireError } = await supabase
    .from("edu_reading_requests")
    .update({ status: "expired", updated_at: now.toISOString() })
    .eq("status", "payment_pending")
    .lt("checkout_expires_at", now.toISOString());
  if (expireError) return unavailable();

  const { data: bookings, error: existingError } = await supabase
    .from("edu_reading_requests")
    .select("date_key, start_time, end_time")
    .eq("date_key", dateKey)
    .in("status", [...EDU_READING_BLOCKING_STATUSES]);
  if (existingError) {
    return unavailable();
  }

  const busySlots: EduReadingBusySlot[] = (bookings ?? []).map((booking) => ({
    dateKey: booking.date_key,
    startTime: normalizeTime(booking.start_time),
    endTime: normalizeTime(booking.end_time),
  }));
  if (!isEduReadingSlotAvailable(slot, busySlots)) {
    return invalid("Esse horário acabou de ser solicitado por outra pessoa. Escolha outro.", 409);
  }

  const { data, error } = await supabase
    .from("edu_reading_requests")
    .insert({
      offer_id: offer.id,
      offer_title: offer.title,
      client_name: name,
      client_email: email,
      intention,
      locale,
      currency,
      amount_cents: offer.priceCents[currency],
      date_key: dateKey,
      start_time: slot.startTime,
      end_time: slot.endTime,
      timezone: "Europe/London",
      status: "requested",
    })
    .select("id, status, date_key, start_time, timezone")
    .single();

  if (error) {
    if (error.code === "23505" || error.code === "23P01") {
      return invalid("Esse horário acabou de ser solicitado por outra pessoa. Escolha outro.", 409);
    }
    return unavailable();
  }
  if (!data) return unavailable();

  try {
    const checkout = await createEduReadingCheckout(data.id);
    return NextResponse.json(
      {
        ok: true,
        checkoutUrl: checkout.paymentUrl,
        expiresAt: checkout.expiresAt,
      },
      { status: 201 }
    );
  } catch {
    await supabase
      .from("edu_reading_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .in("status", ["requested", "payment_pending"]);
    return unavailable();
  }
}
