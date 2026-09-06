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
