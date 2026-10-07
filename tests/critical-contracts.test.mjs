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
  assert.match(domain, /candidateOffsetsMinutes: Array\.isArray/);
  assert.match(timeResolution, /export function resolveAstrologyBirthTime/);
  assert.match(timeResolution, /"ambiguous"/);
  assert.match(timeResolution, /"nonexistent"/);
  assert.match(timeResolution, /disambiguation/);
  assert.match(timeResolution, /candidateOffsetsMinutes/);
});

test("astrology client bridge stays same-origin and preserves the server contract", async () => {
  const client = await source("src/lib/astrology/birth-data-client.ts");

  assert.match(client, /\/api\/astrology\/birth-data/);
  assert.match(client, /credentials: "include"/);
  assert.match(client, /cache: "no-store"/);
  assert.match(client, /storeBirthData: true/);
  assert.match(client, /astrology-birth-data-invalid-response/);
  assert.match(client, /timeResolution/);
  assert.doesNotMatch(client, /SUPABASE|service_role|admin/);
});

test("astrology location lookup is consent-gated and attribution-aware", async () => {
  const route = await source("src/app/api/astrology/location/route.ts");
  const resolver = await source("src/lib/astrology/location.ts");
  const card = await source("src/components/astrology/AstrologyBirthProfileCard.tsx");

  assert.match(route, /body\.consent !== true/);
  assert.match(route, /resolveAstrologyLocation/);
  assert.match(resolver, /nominatim\.openstreetmap\.org/);
  assert.match(resolver, /tzLookup/);
  assert.match(resolver, /OpenStreetMap contributors/);
  assert.match(resolver, /cache: "no-store"/);
  assert.match(resolver, /countryCode\?: string/);
  assert.match(card, /body: JSON\.stringify\(\{ label: draft\.locationLabel\.trim\(\), consent: true \}\)/);
  assert.doesNotMatch(card, /copy\.country|copy\.latitude|copy\.longitude|copy\.timezone/);
});

test("astrology placements combine planet, sign, house, degree and real aspects", async () => {
  const experience = await source(
    "src/components/astrology/AstrologyChartExperience.tsx"
  );
  const interpretation = await source(
    "src/lib/astrology/placement-interpretation.ts"
  );

  assert.match(experience, /getPlacementInterpretation/);
  assert.match(experience, /getBodyAspectReadings/);
  assert.match(experience, /PersonalizedPlacementReading/);
  assert.match(interpretation, /getDegreeInterpretation/);
  assert.match(interpretation, /Isso não resume a sua personalidade inteira/);
  assert.match(interpretation, /O grau refina a leitura/);
  assert.match(interpretation, /return aspects[\s\S]*\.filter/);
});

test("personal astrology data stays private and does not depend on fictional preview data", async () => {
  const natalRoute = await source("src/app/api/astrology/natal/route.ts");
  const experience = await source("src/components/astrology/AstrologyChartExperience.tsx");
  const chartStyles = await source("src/components/astrology/AstrologyChartExperience.module.css");
  const previewRoute = await source("src/app/preview-mapa-astrologia/page.tsx");

  assert.match(natalRoute, /ASTROLOGY_BIRTH_DATA_REQUIRED/);
  assert.match(natalRoute, /ASTROLOGY_CHART_UNAVAILABLE/);
  assert.match(natalRoute, /Cache-Control": "private, no-store/);
  assert.match(experience, /ASTROLOGY_BIRTH_DATA_REQUIRED/);
  assert.match(experience, /session-expired/);
  assert.match(experience, /AbortController/);
  assert.doesNotMatch(experience, /previewChart/);
  assert.match(previewRoute, /redirect\("\/astrologia\/mapa"\)/);
  assert.doesNotMatch(previewRoute, /dados fictícios|Cidade de exemplo/);
  assert.match(chartStyles, /\.coreHeading h3[\s\S]*white-space: nowrap/);
  assert.match(chartStyles, /\.coreHeading h3[\s\S]*word-break: keep-all/);
});

test("the astrology campaign keeps context through auth, unknown birth time, checkout, and fulfillment return", async () => {
  const landingPage = await source("src/app/astrologia/page.tsx");
  const landing = await source("src/components/astrology/AstrologyOverview.tsx");
  const mapPage = await source("src/app/astrologia/mapa/page.tsx");
  const mapEntry = await source("src/components/astrology/AstrologyMapEntry.tsx");
  const mapExperience = await source("src/components/astrology/AstrologyChartExperience.tsx");
  const birthProfile = await source("src/components/astrology/AstrologyBirthProfileCard.tsx");
  const natalChart = await source("src/lib/astrology/natal-chart.ts");
  const checkout = await source("src/app/api/checkout/create/route.ts");

  assert.doesNotMatch(landingPage, /product === "mapa_astral"/);
  assert.match(landing, /appendMarketingAttribution\(mapQuery, attribution\)/);
  assert.match(landing, /formatProductPrice\("mapa_astral"/);
  assert.match(mapPage, /if \(!user\) return <AstrologyMapEntry mapPath=\{mapPath\} \/>/);
  assert.doesNotMatch(mapPage, /redirect\(buildLoginPath/);
  assert.match(mapEntry, /buildLoginPath\(mapPath, \{ lang: locale \}\)/);
  assert.match(mapEntry, /Start with the free layer|Começar pela camada gratuita/);
  assert.match(mapEntry, /only when you choose to prepare your personal map|só é necessária quando você decidir preparar seu mapa pessoal/);
  assert.match(mapEntry, /formatProductPrice\("mapa_astral", currency\)/);
  assert.match(mapExperience, /\/api\/checkout\/confirm/);
  assert.match(mapExperience, /returnTo:/);
  assert.match(mapExperience, /normalizeMarketingAttribution/);
  assert.match(birthProfile, /"unknown"/);
  assert.match(birthProfile, /precision === "unknown" \? "12:00"/);
  assert.match(natalChart, /house: null/);
  assert.match(natalChart, /ascendant: ascendantLongitudeValue === null/);
  assert.match(checkout, /buildCheckoutReturnUrl/);
  assert.match(checkout, /cancelled/);
});

test("voucher invitations validate delivery and keep a recovery path", async () => {
  const service = await source("src/lib/vouchers/service.ts");
  const email = await source("src/lib/email/transactional.ts");
  const route = await source("src/app/api/admin/vouchers/route.ts");
  const admin = await source("src/components/admin/VoucherAdminPage.tsx");
  const claim = await source("src/app/voucher/[code]/page.tsx");
  const claimCard = await source("src/components/vouchers/VoucherClaimCard.tsx");

  assert.match(service, /EMAIL_PATTERN/);
  assert.match(service, /resendVoucherEmail/);
  assert.match(email, /no-reply@palavrasdouniverso\.com/);
  assert.match(email, /const port = Number\(process\.env\.BREVO_SMTP_PORT\) \|\| SMTP_PORT/);
  assert.match(email, /secure: port === 465/);
  assert.match(email, /MAX_SEND_ATTEMPTS/);
  assert.match(email, /MAX_SEND_ATTEMPTS = 1/);
  assert.match(email, /X-Mailin-Track-Clicks/);
  assert.match(email, /X-Mailin-Track-Opens/);
  assert.match(email, /Toque no endereço acima ou copie e cole no Safari/);
  assert.doesNotMatch(email, /<a href=/);
  assert.match(email, /recipient_name/);
  assert.match(email, /voucher\.kind === "discount"/);
  assert.match(service, /recipientName/);
  assert.match(route, /action === "resend"/);
  assert.match(admin, /Reenviar voucher por e-mail/);
  assert.match(claim, /grant_expires_days/);
  assert.match(email, /auto=1/);
  assert.match(claim, /searchParams/);
  assert.match(claim, /autoRedeem/);
  assert.match(claimCard, /useEffect/);
  assert.match(claimCard, /api\/vouchers\/redeem/);
  assert.match(claimCard, /buildLoginPath\(loginNextPath\)/);
  assert.match(claimCard, /kind !== "discount" \|\| autoRedeem/);
  assert.match(email, /Your invitation has arrived/);
  assert.match(email, /Hi \$\{recipientName\}/);
  assert.match(email, /Activate automatically with my account/);
  assert.match(email, /email_locale/);
  assert.match(email, /locale === "pt-BR"/);
  assert.match(email, /Olá \$\{recipientName\}/);
  assert.match(email, /Código/);
  assert.match(service, /emailLocale/);
  assert.match(admin, /Idioma do e-mail/);
  assert.match(admin, /value="pt-BR"/);
});

test("Edu bookings hold a real London time only through secure payment", async () => {
  const offers = await source("src/lib/edu-reading-offers.ts");
  const availability = await source("src/app/api/edu-reading/availability/route.ts");
  const request = await source("src/app/api/edu-reading/requests/route.ts");
  const checkout = await source("src/lib/edu-reading-checkout.ts");
  const webhook = await source("src/app/api/stripe/webhook/route.ts");
  const admin = await source("src/app/api/admin/edu-reading-requests/route.ts");
  const booking = await source("src/components/EduReadingBookingPanel.tsx");
  const migration = await source("supabase/migrations/20260930120000_edu_reading_requests.sql");

  assert.match(offers, /timezone: "Europe\/London"/);
  assert.match(offers, /bufferMinutes: 30/);
  assert.match(offers, /isEduReadingSlotAvailable/);
  assert.match(availability, /checkout_expires_at/);
  assert.match(availability, /EDU_READING_BLOCKING_STATUSES/);
  assert.match(request, /createEduReadingCheckout\(data\.id\)/);
  assert.match(request, /error\.code === "23P01"/);
  assert.match(checkout, /expires_at: checkoutExpiresAt/);
  assert.match(checkout, /idempotencyKey: `edu-reading-checkout-\$\{request\.id\}`/);
  assert.match(checkout, /integration_identifier: createIntegrationIdentifier\(\)/);
  assert.match(checkout, /status: "expired"/);
  assert.match(webhook, /markEduReadingPaymentExpired/);
  assert.match(admin, /stripe\.checkout\.sessions\.expire/);
  assert.match(booking, /Continue to secure payment|Continuar para o pagamento seguro/);
  assert.match(migration, /checkout_expires_at timestamptz/);
  assert.match(migration, /exclude using gist/);
  assert.match(migration, /interval '30 minutes'/);
});

test("Edu waitlist stores only a private, deduplicated contact", async () => {
  const page = await source("src/components/EduReadingComingSoon.tsx");
  const route = await source("src/app/api/edu-reading/waitlist/route.ts");
  const admin = await source("src/app/api/admin/edu-reading-requests/route.ts");
  const migration = await source("supabase/migrations/20261007014319_create_edu_reading_waitlist.sql");

  assert.match(page, /lista de espera|waitlist/i);
  assert.match(route, /checkRateLimit/);
  assert.match(route, /strict: true/);
  assert.match(route, /\.upsert\(/);
  assert.match(route, /onConflict: "email"/);
  assert.match(route, /Do not distinguish a new address from an existing one/);
  assert.match(admin, /edu_reading_waitlist/);
  assert.match(migration, /email text not null unique/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.edu_reading_waitlist from public, anon, authenticated/);
});
