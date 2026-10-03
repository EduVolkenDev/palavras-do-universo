import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { normalizeProductCurrency, type ProductCurrency } from "@/lib/product/pricing";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  EDU_READING_OFFERS,
  getEduReadingSlot,
  getUpcomingEduReadingAvailability,
  isEduReadingOfferId,
  type EduReadingOffer,
} from "@/lib/edu-reading-offers";

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

const ACTIVE_STATUSES = [
  "requested",
  "confirmed_pending_payment",
  "payment_pending",
  "paid",
] as const;

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

  const slot = getEduReadingSlot(offer.id, dateKey, startTime);
  const visibleDay = getUpcomingEduReadingAvailability(offer.id, locale, new Date()).find(
    (day) => day.dateKey === dateKey && day.slots.includes(startTime)
  );
  if (!slot || !visibleDay) {
    return invalid("Esse horário não está disponível na agenda atual.", 409);
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("edu_reading_requests")
    .select("id")
    .eq("date_key", dateKey)
    .eq("start_time", startTime)
    .in("status", [...ACTIVE_STATUSES])
    .maybeSingle();
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (existing) {
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
    if (error.code === "23505") {
      return invalid("Esse horário acabou de ser solicitado por outra pessoa. Escolha outro.", 409);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: data }, { status: 201 });
}
