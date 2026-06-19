import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function cleanEnvValue(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "").trim();
}

function isProductionSite() {
  return (
    process.env.VERCEL_ENV === "production" ||
    /^https:\/\/(www\.)?palavrasdouniverso\.com\b/i.test(getSiteUrl()) ||
    /^https:\/\/(www\.)?palavrasdouniverso\.volynx\.world\b/i.test(getSiteUrl()) ||
    /^https:\/\/(www\.)?palavrasdouniverso\.volinx\.world\b/i.test(getSiteUrl())
  );
}

function assertSafeStripeKey(secretKey: string) {
  if (isProductionSite() && secretKey.startsWith("sk_test_")) {
    throw new Error("Test Stripe key is blocked on the production site");
  }
}

export function hasStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return false;

  try {
    assertSafeStripeKey(secretKey);
    return true;
  } catch {
    return false;
  }
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  assertSafeStripeKey(secretKey);

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  return stripeClient;
}

export function getSiteUrl() {
  const value = cleanEnvValue(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      "http://localhost:3000"
  ).replace(/\/$/, "");
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
