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

async function recordPaymentEvent(event: Stripe.Event) {
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

  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata =
    object.metadata && typeof object.metadata === "object"
      ? (object.metadata as Record<string, string>)
      : {};

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

async function markPaymentEventProcessed(event: Stripe.Event) {
  if (!hasSupabaseConfig()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("payment_events")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id);
  if (error) {
    throw new Error(`Could not finalize payment event: ${error.message}`);
  }
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

  const shouldProcess = await recordPaymentEvent(event);
  if (!shouldProcess) return response(true);

  switch (event.type) {
    case "checkout.session.completed": {
      if (
        event.data.object.mode === "subscription" ||
        ["paid", "no_payment_required"].includes(event.data.object.payment_status)
      ) {
        const result = await fulfillCheckoutSession(event.data.object);
        if (!result.ok) return response(false, 422);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      if (!(await fulfillCheckoutSession(event.data.object)).ok) {
        return response(false, 422);
      }
      break;
    }
    case "checkout.session.async_payment_failed":
      await getSupabaseAdmin()
        .from("purchases")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("provider", "stripe")
        .eq("provider_checkout_id", event.data.object.id);
      break;
    case "charge.refunded": {
      if (!(await syncStripeRefund(event.data.object)).ok) {
        return response(false, 422);
      }
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
}
