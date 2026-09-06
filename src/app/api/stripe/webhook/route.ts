import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import {
  fulfillCheckoutSession,
  syncStripeRefund,
  syncStripeSubscription,
} from "@/lib/product/fulfillment";

export const runtime = "nodejs";

function response(ok: boolean, status = 200) {
  return NextResponse.json({ ok }, { status });
}

function getPaymentEventFields(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata =
    object.metadata && typeof object.metadata === "object"
      ? (object.metadata as Record<string, string>)
      : {};

  return {
    object,
    metadata,
  };
}

async function recordPaymentEventLegacy(event: Stripe.Event) {
  if (!hasSupabaseConfig()) return false;

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("payment_events")
    .select("status")
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id)
    .maybeSingle();
  if (existingError) {
    throw new Error(`Could not read payment event: ${existingError.message}`);
  }
  if (existing?.status === "processed") return false;

  const { metadata } = getPaymentEventFields(event);

  const { error: upsertError } = await supabase.from("payment_events").upsert(
    {
      provider: "stripe",
      provider_event_id: event.id,
      event_type: event.type,
      user_id: metadata.user_id ?? null,
      product_key: metadata.product_key ?? null,
      status: "received",
      payload: event as unknown as Record<string, unknown>,
    },
    { onConflict: "provider,provider_event_id" }
  );
  if (upsertError) {
    throw new Error(`Could not record payment event: ${upsertError.message}`);
  }
  return true;
}

async function claimPaymentEvent(event: Stripe.Event) {
  if (!hasSupabaseConfig()) return false;

  const { metadata } = getPaymentEventFields(event);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("claim_payment_event", {
    p_provider: "stripe",
    p_provider_event_id: event.id,
    p_event_type: event.type,
    p_user_id: metadata.user_id ?? null,
    p_product_key: metadata.product_key ?? null,
    p_payload: event as unknown as Record<string, unknown>,
  });

  if (!error && typeof data === "boolean") return data;

  // Keep the currently deployed schema working while the migration rolls out.
  // The migration adds a transactional claim; this legacy path is temporary.
  if (error?.code === "42883") return recordPaymentEventLegacy(event);
  throw new Error(`Could not claim payment event: ${error?.message ?? "unknown error"}`);
}

async function markPaymentEventProcessed(event: Stripe.Event) {
  if (!hasSupabaseConfig()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("payment_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      processing_started_at: null,
    })
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id);
  if (error?.code === "42703") {
    const { error: legacyError } = await supabase
      .from("payment_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("provider_event_id", event.id);
    if (!legacyError) return;
    throw new Error(`Could not finalize payment event: ${legacyError.message}`);
  }
  if (error) {
    throw new Error(`Could not finalize payment event: ${error.message}`);
  }
}

async function markPaymentEventFailed(event: Stripe.Event) {
  if (!hasSupabaseConfig()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("payment_events")
    .update({ status: "failed", processing_started_at: null })
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id);

  // Older databases do not yet have the lease field. Marking the event failed
  // still lets Stripe retry after an implementation error.
  if (error?.code === "42703") {
    const { error: legacyError } = await supabase
      .from("payment_events")
      .update({ status: "failed" })
      .eq("provider", "stripe")
      .eq("provider_event_id", event.id);
    if (!legacyError) return;
    throw new Error(`Could not release payment event: ${legacyError.message}`);
  }
  if (error) throw new Error(`Could not release payment event: ${error.message}`);
}


export async function POST(req: Request) {
  if (!hasSupabaseConfig()) return response(false, 503);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const shouldProcess = await claimPaymentEvent(event);
  if (!shouldProcess) return response(true);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        if (
          event.data.object.mode === "subscription" ||
          ["paid", "no_payment_required"].includes(event.data.object.payment_status)
        ) {
          const result = await fulfillCheckoutSession(event.data.object);
          if (!result.ok) throw new Error(`Checkout fulfillment failed: ${result.reason}`);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const result = await fulfillCheckoutSession(event.data.object);
        if (!result.ok) throw new Error(`Async checkout fulfillment failed: ${result.reason}`);
        break;
      }
      case "checkout.session.async_payment_failed": {
        const { error } = await getSupabaseAdmin()
          .from("purchases")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("provider", "stripe")
          .eq("provider_checkout_id", event.data.object.id);
        if (error) throw new Error(`Could not mark checkout as failed: ${error.message}`);
        break;
      }
      case "charge.refunded": {
        const result = await syncStripeRefund(event.data.object);
        if (!result.ok) throw new Error(`Refund synchronization failed: ${result.reason}`);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object);
        break;
      default:
        break;
    }

    await markPaymentEventProcessed(event);

    return response(true);
  } catch (caught) {
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      error: caught instanceof Error ? caught.message : "Unknown error",
    });
    try {
      await markPaymentEventFailed(event);
    } catch (releaseError) {
      console.error("Stripe webhook event release failed", {
        eventId: event.id,
        error: releaseError instanceof Error ? releaseError.message : "Unknown error",
      });
    }
    return response(false, 500);
  }
}
