import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { trimText } from "@/lib/professionals/catalog";

type InquiryBody = {
  offerId?: unknown;
  clientName?: unknown;
  replyEmail?: unknown;
  subject?: unknown;
  brief?: unknown;
  budget?: unknown;
  timeline?: unknown;
  accessPreference?: unknown;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!hasSupabaseConfig()) {
    return jsonError("Supabase is not configured", 503);
  }

  const parsed = await readJsonBody<InquiryBody>(request);
  if (!parsed.ok) return parsed.response;

  const offerId = trimText(parsed.body.offerId, 80);
  const clientName = trimText(parsed.body.clientName, 120) || auth.user.email || "Pessoa interessada";
  const replyEmail = trimText(parsed.body.replyEmail, 180);
  const subject = trimText(parsed.body.subject, 120);
  const brief = trimText(parsed.body.brief, 3000);
  const budget = trimText(parsed.body.budget, 80);
  const timeline = trimText(parsed.body.timeline, 80);
  const accessPreference = trimText(parsed.body.accessPreference, 30) || "private";

  if (!offerId || !replyEmail || !subject || !brief) {
    return jsonError("Missing inquiry fields", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: offer, error: offerError } = await supabase
    .from("professional_offers")
    .select("id, profile_id, title, status")
    .eq("id", offerId)
    .maybeSingle();

  if (offerError) {
    return jsonError(offerError.message, 500);
  }

  if (!offer || offer.status !== "published") {
    return jsonError("Professional offer not available", 404);
  }

  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id, user_id, display_name, is_published")
    .eq("id", offer.profile_id)
    .maybeSingle();

  if (profileError) {
    return jsonError(profileError.message, 500);
  }

  if (!profile || !profile.is_published) {
    return jsonError("Professional offer not available", 404);
  }

  const providerUserId = String(profile.user_id ?? "");
  const { data: inquiry, error } = await supabase
    .from("professional_inquiries")
    .insert({
      offer_id: offer.id,
      provider_user_id: providerUserId,
      client_id: auth.user.id,
      client_name: clientName,
      reply_email: replyEmail,
      subject,
      brief,
      budget: budget || null,
      timeline: timeline || null,
      access_preference: accessPreference,
      status: "new",
    })
    .select(
      "id, offer_id, provider_user_id, client_id, client_name, reply_email, subject, brief, budget, timeline, access_preference, status, created_at"
    )
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ ok: true, inquiry });
}
