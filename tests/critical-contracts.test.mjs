import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("free readings use server identity and a distributed fail-closed rate limit", async () => {
  const route = await source("src/app/api/reading/create/route.ts");

  assert.match(route, /import \{ checkRateLimit \} from "@\/lib\/security\/rateLimit"/);
  assert.match(route, /scope: paidProduct \? "reading\.paid" : "reading\.free"/);
  assert.match(route, /strict: !paidProduct/);
  assert.match(route, /const anonymousUserId = createAnonymousUserId\(\)/);
  assert.doesNotMatch(
    route,
    /getRequestUserId\(\s*req,\s*authenticatedUser\?\.id \?\? null,\s*body\?\.userId\s*\)/
  );
  assert.match(route, /const day = dailyDay\.key/);
});

test("professional verification remains staff-controlled", async () => {
  const route = await source("src/app/api/profissionais/route.ts");

  assert.match(route, /\.select\("id, is_verified"\)/);
  assert.match(route, /is_verified: existingProfile\?\.is_verified \?\? false/);
  assert.match(route, /if \(isProductionRuntime\(\)\) return unavailableMarketplace\(\)/);
});

test("refunds revoke access only after the full charge is refunded", async () => {
  const fulfillment = await source("src/lib/product/fulfillment.ts");

  assert.match(fulfillment, /const isFullyRefunded = totalAmount > 0 && refundedAmount >= totalAmount/);
  assert.match(fulfillment, /status: "partially_refunded"/);
  assert.match(fulfillment, /if \(purchase\.status === "refunded"\)/);
});

test("Stripe events are transactionally claimed before fulfillment", async () => {
  const webhook = await source("src/app/api/stripe/webhook/route.ts");
  const migration = await source("supabase/migrations/20260905090000_atomic_payment_event_claim.sql");

  assert.match(webhook, /async function claimPaymentEvent/);
  assert.match(webhook, /\.rpc\("claim_payment_event"/);
  assert.match(webhook, /await markPaymentEventFailed\(event\)/);
  assert.match(migration, /create or replace function public\.claim_payment_event/);
  assert.match(migration, /processing_started_at < now\(\) - interval '10 minutes'/);
});

test("the language bridge avoids scripts and batches live DOM updates", async () => {
  const provider = await source("src/components/I18nProvider.tsx");
  const lume = await source("src/components/LumeGuide.tsx");

  assert.match(provider, /"SCRIPT"/);
  assert.match(provider, /window\.requestAnimationFrame/);
  assert.match(lume, /pdu:journey-updated/);
  assert.match(lume, /aria-modal="true"/);
});

test("Lume AI stays server-side and keeps a deterministic fallback", async () => {
  const route = await source("src/app/api/lume/route.ts");
  const provider = await source("src/lib/ai/anthropic.ts");
  const lume = await source("src/components/LumeGuide.tsx");

  assert.match(route, /checkRateLimit/);
  assert.match(route, /strict: true/);
  assert.match(route, /generateAnthropicText/);
  assert.match(route, /ALLOWED_SURFACES/);
  assert.match(route, /claude-haiku-4-5-20251001/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_.*ANTHROPIC/);
  assert.match(provider, /server-only/);
  assert.match(provider, /process\.env\.ANTHROPIC_API_KEY/);
  assert.match(lume, /fetch\("\/api\/lume"/);
  assert.match(lume, /const localReply = replyToLume/);
  assert.match(lume, /The deterministic persona remains available/);
});

test("PDU gateway remains opt-in and capability-scoped", async () => {
  const adapter = await source("src/lib/ai/anthropic.ts");
  assert.match(adapter, /PDU_AI_GATEWAY_URL/);
  assert.match(adapter, /PDU_AI_GATEWAY_TOKEN/);
  assert.match(adapter, /product: "pdu"/);
  assert.match(adapter, /capability/);
  assert.match(await source(".env.example"), /PDU_AI_GATEWAY_URL=/);
  assert.match(await source(".env.example"), /PDU_AI_GATEWAY_TOKEN=/);
});

test("Lume only opens professionals for explicit human-support language", async () => {
  const persona = await source("src/lib/lume/persona.ts");
  assert.match(persona, /Require an explicit/);
  assert.match(persona, /terapeut\|terapia\|psicolog\|profission/);
  assert.doesNotMatch(persona, /if \(\/\(terapeut\|profission\|atend\|sessao/);
});

test("same-origin telemetry accepts only loopback request hosts outside public origins", async () => {
  const proxy = await source("src/proxy.ts");

  assert.match(proxy, /new URL\(request\.url\)\.origin/);
  assert.match(proxy, /LOOPBACK_HOSTNAMES/);
  assert.match(proxy, /LOOPBACK_HOSTNAMES\.has\(localOrigin\.hostname\)/);
  assert.match(proxy, /NEXT_PUBLIC_SITE_URL/);
  assert.doesNotMatch(proxy, /x-forwarded-proto/);
  assert.match(proxy, /Cross-origin request blocked/);
});

test("passwordless access uses OTPs without creating accounts or relying on email links", async () => {
  const login = await source("src/app/entrar/page.tsx");

  assert.match(login, /authMode === "access-code"/);
  assert.match(login, /supabase\.auth\.signInWithOtp/);
  assert.match(login, /shouldCreateUser: false/);
  assert.match(login, /setAuthMode\("verify-access-code"\)/);
  assert.match(login, /authMode === "verify-access-code"/);
});

test("campaign attribution survives authentication and checkout without collecting search terms", async () => {
  const attribution = await source("src/lib/marketing/attribution.ts");
  const home = await source("src/app/page.tsx");
  const checkout = await source("src/app/api/checkout/create/route.ts");
  const fulfillment = await source("src/lib/product/fulfillment.ts");

  assert.match(attribution, /MARKETING_ATTRIBUTION_KEYS/);
  assert.match(attribution, /"utm_campaign"/);
  assert.doesNotMatch(attribution, /utm_term/);
  assert.match(home, /appendMarketingAttribution\(/);
  assert.match(home, /attribution: normalizeMarketingAttribution/);
  assert.match(home, /window\.location\.href = buildLoginPath\(resumePath/);
  assert.match(checkout, /toStripeMarketingMetadata\(marketingAttribution\)/);
  assert.match(checkout, /attribution: marketingAttribution/);
  assert.match(fulfillment, /getMarketingAttributionFromStripeMetadata/);
});

test("the campaign ships an accessible, shareable social preview", async () => {
  const campaign = await source("src/components/marketing/ClarezaUrgenteCampaign.tsx");
  const campaignPage = await source("src/app/clareza-urgente/page.tsx");
  const socialPreview = await source("src/app/api/social-cards/clareza-urgente/route.tsx");

  assert.match(campaign, /<main\s+lang=\{locale\}/);
  assert.match(campaign, /useI18n/);
  assert.match(campaign, /copies\[locale\] \?\? initialCopy/);
  assert.match(campaign, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(campaignPage, /socialImageUrl/);
  assert.match(campaignPage, /images: \[/);
  assert.match(socialPreview, /ImageResponse/);
  assert.match(socialPreview, /width: 1200/);
  assert.match(socialPreview, /height: 630/);
  assert.match(socialPreview, /clareza-urgente-social\.png/);
  assert.match(socialPreview, /"pt-BR"/);
  assert.match(socialPreview, /en:/);
});

test("reading-profile choices keep stable values and localize every visible label", async () => {
  const profileI18n = await source("src/lib/i18n/reading-profile.ts");
  const home = await source("src/app/page.tsx");
  const universe = await source("src/app/meu-universo/page.tsx");

  assert.match(profileI18n, /READING_PROFILE_FOCUS_AREAS/);
  assert.match(profileI18n, /READING_PROFILE_BOUNDARIES/);
  assert.match(profileI18n, /function localizeReadingProfileValue/);
  assert.match(home, /localizeReadingProfileValue\(option, locale\)/);
  assert.match(universe, /localizeReadingProfileValue\(option, locale\)/);
  assert.doesNotMatch(home, /const readingProfileFocusOptions/);
  assert.doesNotMatch(universe, /const focusAreaOptions/);
});

test("astrology birth data stays separate, authenticated and consent-gated", async () => {
  const migration = await source(
    "supabase/migrations/20260911090000_create_astrology_birth_profiles.sql"
  );
  const route = await source("src/app/api/astrology/birth-data/route.ts");
  const domain = await source("src/lib/astrology/birth-data.ts");
  const timeResolution = await source("src/lib/astrology/time-resolution.ts");

  assert.match(migration, /create table if not exists public\.astrology_birth_profiles/);
  assert.match(migration, /alter table public\.astrology_birth_profiles enable row level security/);
  assert.match(migration, /astrology_birth_profiles_delete_own/);
  assert.doesNotMatch(route, /reading_profile/);
  assert.match(route, /requireApiUser/);
  assert.match(route, /storeBirthData !== true/);
  assert.match(route, /BIRTH_DATA_CONSENT_REQUIRED/);
  assert.match(route, /upsert\(/);
  assert.match(domain, /timeResolution/);
  assert.match(domain, /iana-timezone-rules/);
  assert.match(domain, /timeResolution must match the reported local time/);
  assert.match(domain, /resolveAstrologyBirthTime/);
  assert.match(domain, /does not match the server IANA resolution/);
  assert.match(timeResolution, /export function resolveAstrologyBirthTime/);
  assert.match(timeResolution, /"ambiguous"/);
  assert.match(timeResolution, /"nonexistent"/);
});

test("voucher invitations validate delivery and keep a recovery path", async () => {
  const service = await source("src/lib/vouchers/service.ts");
  const email = await source("src/lib/email/transactional.ts");
  const route = await source("src/app/api/admin/vouchers/route.ts");
  const admin = await source("src/components/admin/VoucherAdminPage.tsx");
  const claim = await source("src/app/voucher/[code]/page.tsx");

  assert.match(service, /EMAIL_PATTERN/);
  assert.match(service, /resendVoucherEmail/);
  assert.match(email, /no-reply@palavrasdouniverso\.com/);
  assert.match(email, /MAX_SEND_ATTEMPTS/);
  assert.match(email, /recipient_name/);
  assert.match(email, /voucher\.kind === "discount"/);
  assert.match(service, /recipientName/);
  assert.match(route, /action === "resend"/);
  assert.match(admin, /Reenviar voucher por e-mail/);
  assert.match(claim, /grant_expires_days/);
});
