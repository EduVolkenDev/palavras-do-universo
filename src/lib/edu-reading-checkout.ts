import Stripe from "stripe";
import { randomBytes } from "node:crypto";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const EDU_READING_PAYMENT_HOLD_MINUTES = 30;

export type EduReadingCheckoutRequest = {
  id: string;
  client_email: string;
  offer_title: string;
  amount_cents: number;
  currency: "BRL" | "GBP";
  date_key: string;
  start_time: string;
  timezone: string;
  locale: "pt-BR" | "en";
  status: string;
  payment_url: string | null;
  checkout_expires_at: string | null;
};

export function isEduReadingCheckoutSession(session: Stripe.Checkout.Session) {
  return Boolean(session.metadata?.edu_reading_request_id);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function checkoutLocale(locale: EduReadingCheckoutRequest["locale"]): "en" | "pt-BR" {
  return locale === "en" ? "en" : "pt-BR";
}

function buildReturnUrl(requestId: string, result: "success" | "cancelled") {
  const url = new URL("/leitura-com-edu", getSiteUrl());
  url.searchParams.set("booking", result);
  url.searchParams.set("request", requestId);
  return url.toString();
}

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `pdu_edu_booking_${suffix}`;
}

function paymentHoldExpiresAt() {
  return Math.floor(Date.now() / 1000) + EDU_READING_PAYMENT_HOLD_MINUTES * 60;
}

export async function createEduReadingCheckout(requestId: string) {
  const supabase = getSupabaseAdmin();
  const { data: request, error: requestError } = await supabase
    .from("edu_reading_requests")
    .select(
      "id, client_email, offer_title, amount_cents, currency, date_key, start_time, timezone, locale, status, payment_url, checkout_expires_at"
    )
    .eq("id", requestId)
    .maybeSingle<EduReadingCheckoutRequest>();

  if (requestError) throw new Error(`Could not read reading request: ${requestError.message}`);
  if (!request) throw new Error("Reading request not found");
  if (!hasStripeConfig()) throw new Error("Stripe is not configured");

  const expiresAt = request.checkout_expires_at ? Date.parse(request.checkout_expires_at) : Number.NaN;
  if (
    request.status === "payment_pending" &&
    request.payment_url &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now()
  ) {
    return {
      sessionId: null,
      paymentUrl: request.payment_url,
      expiresAt: request.checkout_expires_at,
    };
  }
  if (request.status !== "requested") {
    throw new Error("This time is no longer awaiting payment");
  }

  const checkoutExpiresAt = paymentHoldExpiresAt();
  const checkoutExpiresAtIso = new Date(checkoutExpiresAt * 1000).toISOString();

  const { data: reserved, error: reserveError } = await supabase
    .from("edu_reading_requests")
    .update({
      status: "payment_pending",
      checkout_expires_at: checkoutExpiresAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "requested")
    .select("id")
    .maybeSingle();

  if (reserveError) throw new Error(`Could not reserve reading request: ${reserveError.message}`);
  if (!reserved) throw new Error("This time was changed by another booking");

  let session: Stripe.Checkout.Session | null = null;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: request.id,
        customer_email: request.client_email,
        locale: checkoutLocale(request.locale),
        billing_address_collection: "auto",
        expires_at: checkoutExpiresAt,
        integration_identifier: createIntegrationIdentifier(),
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: request.currency.toLowerCase(),
              unit_amount: request.amount_cents,
              product_data: {
                name: `Leitura com Edu · ${request.offer_title}`,
                description: `${request.date_key} às ${request.start_time} (${request.timezone})`,
                metadata: {
                  edu_reading_request_id: request.id,
                },
              },
            },
          },
        ],
        success_url: buildReturnUrl(request.id, "success"),
        cancel_url: buildReturnUrl(request.id, "cancelled"),
        metadata: {
          edu_reading_request_id: request.id,
          booking_type: "edu_reading",
          currency: request.currency,
          date_key: request.date_key,
          start_time: request.start_time,
        },
        payment_intent_data: {
          metadata: {
            edu_reading_request_id: request.id,
            booking_type: "edu_reading",
          },
        },
      },
      { idempotencyKey: `edu-reading-checkout-${request.id}` }
    );
    if (!session.url) throw new Error("Stripe did not return a Checkout URL");

    const { data: saved, error: saveError } = await supabase
      .from("edu_reading_requests")
      .update({
        status: "payment_pending",
        stripe_checkout_id: session.id,
        payment_url: session.url,
        checkout_expires_at: new Date(session.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("status", "payment_pending")
      .select("id")
      .maybeSingle();
    if (saveError || !saved) {
      throw new Error(`Could not save checkout session: ${saveError?.message ?? "booking state changed"}`);
    }

    return {
      sessionId: session.id,
      paymentUrl: session.url,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
    };
  } catch (error) {
    if (session) {
      try {
        await getStripe().checkout.sessions.expire(session.id);
      } catch {
        // The database hold below still releases the time if Stripe cannot expire the session.
      }
    }
    await supabase
      .from("edu_reading_requests")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("status", "payment_pending");
    throw error;
  }
}

export async function markEduReadingPaid(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.edu_reading_request_id;
  if (!requestId) return false;
  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    throw new Error("Edu reading checkout payment is not confirmed");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("edu_reading_requests")
    .update({
      status: "paid",
      stripe_checkout_id: session.id,
      stripe_payment_intent_id: getString(session.payment_intent),
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      confirmed_by: "stripe",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .in("status", ["confirmed_pending_payment", "payment_pending", "paid"])
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Could not mark reading as paid: ${error.message}`);
  return Boolean(data);
}

export async function markEduReadingPaymentExpired(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.edu_reading_request_id;
  if (!requestId) return false;

  const { error } = await getSupabaseAdmin()
    .from("edu_reading_requests")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "payment_pending");
  if (error) throw new Error(`Could not reopen reading payment: ${error.message}`);
  return true;
}
