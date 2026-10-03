import Stripe from "stripe";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

export async function createEduReadingCheckout(requestId: string, confirmedBy: string) {
  const supabase = getSupabaseAdmin();
  const { data: request, error: requestError } = await supabase
    .from("edu_reading_requests")
    .select(
      "id, client_email, offer_title, amount_cents, currency, date_key, start_time, timezone, locale, status"
    )
    .eq("id", requestId)
    .maybeSingle<EduReadingCheckoutRequest>();

  if (requestError) throw new Error(`Could not read reading request: ${requestError.message}`);
  if (!request) throw new Error("Reading request not found");
  if (request.status !== "requested") throw new Error("Reading request is no longer awaiting confirmation");
  if (!hasStripeConfig()) throw new Error("Stripe is not configured");

  const { data: reserved, error: reserveError } = await supabase
    .from("edu_reading_requests")
    .update({
      status: "confirmed_pending_payment",
      confirmed_at: new Date().toISOString(),
      confirmed_by: confirmedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "requested")
    .select("id")
    .maybeSingle();

  if (reserveError) throw new Error(`Could not reserve reading request: ${reserveError.message}`);
  if (!reserved) throw new Error("Reading request was changed by another action");

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: request.id,
      customer_email: request.client_email,
      locale: checkoutLocale(request.locale),
      billing_address_collection: "auto",
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
    });

    const { error: saveError } = await supabase
      .from("edu_reading_requests")
      .update({
        status: "payment_pending",
        stripe_checkout_id: session.id,
        payment_url: session.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("status", "confirmed_pending_payment");
    if (saveError) throw new Error(`Could not save checkout session: ${saveError.message}`);

    return { sessionId: session.id, paymentUrl: session.url };
  } catch (error) {
    await supabase
      .from("edu_reading_requests")
      .update({
        status: "requested",
        confirmed_at: null,
        confirmed_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("status", "confirmed_pending_payment");
    throw error;
  }
}

export async function markEduReadingPaid(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.edu_reading_request_id;
  if (!requestId) return false;
  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    throw new Error("Edu reading checkout payment is not confirmed");
  }

  const { error } = await getSupabaseAdmin()
    .from("edu_reading_requests")
    .update({
      status: "paid",
      stripe_checkout_id: session.id,
      stripe_payment_intent_id: getString(session.payment_intent),
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .in("status", ["confirmed_pending_payment", "payment_pending", "paid"]);
  if (error) throw new Error(`Could not mark reading as paid: ${error.message}`);
  return true;
}

export async function markEduReadingPaymentRetryable(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.edu_reading_request_id;
  if (!requestId) return false;

  const { error } = await getSupabaseAdmin()
    .from("edu_reading_requests")
    .update({
      status: "confirmed_pending_payment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .in("status", ["confirmed_pending_payment", "payment_pending"]);
  if (error) throw new Error(`Could not reopen reading payment: ${error.message}`);
  return true;
}
