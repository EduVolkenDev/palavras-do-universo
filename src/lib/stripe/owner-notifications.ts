import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { sendBrevoEmail } from "@/lib/email/brevo-api";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { productCards, pricingPlans } from "@/lib/product/catalog";

type Notice = { key: string; title: string; amount: number; currency: string; reference: string; product?: string; date: number };
const id = (value: unknown): string => typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String(value.id) : "";

export function paymentOwnerNotice(event: Stripe.Event): Notice | null {
  if (!event.livemode) return null;
  const o = event.data.object;
  if (event.type === "charge.succeeded") {
    const charge = o as Stripe.Charge;
    if (!charge.paid || charge.status !== "succeeded") return null;
    return { key: `payment:${id(charge.payment_intent) || charge.id}`, title: "Pagamento aprovado", amount: charge.amount, currency: charge.currency, reference: charge.id, product: charge.metadata?.product_key || charge.description || undefined, date: charge.created };
  }
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const session = o as Stripe.Checkout.Session;
    if (!["paid", "no_payment_required"].includes(session.payment_status)) return null;
    // Subscription checkouts often have no PaymentIntent on the session.
    // Their successful Charge is the canonical notification, including renewals.
    if (session.mode === "subscription" && (session.amount_total ?? 0) > 0) return null;
    return { key: id(session.payment_intent) ? `payment:${id(session.payment_intent)}` : `checkout:${session.id}`, title: session.payment_status === "no_payment_required" ? "Produto adquirido sem cobrança" : "Pagamento aprovado", amount: session.amount_total ?? 0, currency: session.currency ?? "brl", reference: session.id, product: session.metadata?.product_key, date: session.created };
  }
  if (event.type === "charge.refunded") {
    const charge = o as Stripe.Charge;
    return { key: `refund:${charge.id}:${charge.amount_refunded}`, title: "Reembolso registrado", amount: charge.amount_refunded, currency: charge.currency, reference: charge.id, product: charge.metadata?.product_key, date: event.created };
  }
  if (["payout.paid", "payout.failed"].includes(event.type)) {
    const payout = o as Stripe.Payout;
    return { key: `${event.type}:${payout.id}`, title: event.type === "payout.paid" ? "Depósito bancário pago pela Stripe" : "Falha no depósito bancário da Stripe", amount: payout.amount, currency: payout.currency, reference: payout.id, date: event.created };
  }
  return null;
}

export async function notifyOwnerOfStripeEvent(event: Stripe.Event) {
  const notice = paymentOwnerNotice(event);
  if (!notice) return;
  const recipient = process.env.PDU_OWNER_NOTIFICATION_EMAIL?.trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error("OWNER_NOTIFICATION_RECIPIENT_MISSING");
  const admin = getSupabaseAdmin();
  const { data: claim, error } = await admin.rpc("claim_owner_payment_notification", { p_key: notice.key, p_event_id: event.id, p_event_type: event.type, p_recipient: recipient });
  if (error) throw new Error("OWNER_NOTIFICATION_CLAIM_FAILED");
  if (claim === "accepted") return;
  if (claim !== "claimed") throw new Error(`OWNER_NOTIFICATION_${String(claim).toUpperCase()}`);
  const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: notice.currency.toUpperCase() }).format(notice.amount / 100);
  const product = productCards.find(p => p.productKey === notice.product)?.title ?? pricingPlans.find(p => p.productKey === notice.product)?.title ?? notice.product;
  const lines = ["Palavras do Universo", notice.title, `Valor: ${amount}`, ...(product ? [`Produto: ${product}`] : []), `Data do evento (UTC): ${new Date(notice.date * 1000).toISOString()}`, `Referência Stripe: ${notice.reference}`, "", "Pagamento aprovado e depósito bancário são etapas diferentes. Este aviso não é um recibo fiscal.", "Confira os detalhes no painel Stripe: https://dashboard.stripe.com/payments"];
  const textContent = lines.join("\n");
  const safe = textContent.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  let messageId: string;
  try {
    messageId = await sendBrevoEmail({ to: recipient, senderEmail: "suporte@palavrasdouniverso.com", subject: `[PDU] ${notice.title} — ${amount}`, textContent, htmlContent: `<html lang="pt-BR"><body style="font-family:Arial,sans-serif;line-height:1.6"><pre style="font-family:inherit;white-space:pre-wrap">${safe}</pre></body></html>`, tags: ["owner-payment-alert"], headers: { IdempotencyKey: createHash("sha256").update(notice.key).digest("hex") } });
  } catch (caught) {
    // Explicit provider rejections can retry. Network timeouts are ambiguous;
    // retain the lease and only retry inside the provider idempotency window.
    const rejected = caught instanceof Error && /^Brevo returned HTTP (?!429)4\d\d$/.test(caught.message);
    if (rejected) {
      const { error: updateError } = await admin.from("owner_payment_notifications").update({ status: "failed", error_code: "PROVIDER_REJECTED" }).eq("notification_key", notice.key);
      if (updateError) throw new Error("OWNER_NOTIFICATION_FAILURE_RECORD_FAILED");
    }
    throw caught;
  }
  const { error: acceptedError } = await admin.from("owner_payment_notifications").update({ status: "accepted", provider_message_id: messageId, accepted_at: new Date().toISOString(), error_code: null }).eq("notification_key", notice.key);
  if (acceptedError) throw new Error("OWNER_NOTIFICATION_ACCEPTANCE_RECORD_FAILED");
}
