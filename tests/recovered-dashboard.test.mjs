import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("every dashboard entry retains the recovered shared frame and its owner gate", () => {
  const entries = {
    eventos: "EventAdminPage",
    feedback: "FeedbackAdminPage",
    codigos: "VoucherAdminPage",
    leituras: "EduReadingAdminPage",
    mapas: "AstrologyMapAdminPage",
    "teste-checkout": "InternalCheckoutTestPage",
  };
  const frame = source("src/components/admin/AdminPageFrame.tsx");
  for (const [route, component] of Object.entries(entries)) {
    assert.ok(frame.includes(`href: "/admin/${route}"`));
    assert.match(source(`src/components/admin/${component}.tsx`), /<AdminPageFrame/);
    assert.match(source(`src/app/admin/${route}/page.tsx`), /isOwnerAccessUser/);
  }
  assert.match(frame, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(frame, /PDU_ASSETS\.brand\.symbol/);
});

test("recovery preserves both internal checkout plans and voucher management actions", () => {
  const checkout = source("src/components/admin/InternalCheckoutTestPage.tsx");
  assert.match(checkout, /TEST_CIRCLE_PRODUCT_KEY = "circulo_teste_50"/);
  assert.match(checkout, /confirmCheckout\(targetPlan\)/);
  assert.match(checkout, /productKey: plan/);
  const vouchers = source("src/components/admin/VoucherAdminPage.tsx");
  for (const action of ["create", "resend", "transfer"]) {
    assert.ok(vouchers.includes(`"${action}"`));
  }
});

test("the event dashboard separates campaign metrics and probable noise from technical work", () => {
  const dashboard = source("src/components/admin/EventAdminPage.tsx");
  assert.match(dashboard, /function isActionableEvent/);
  assert.match(dashboard, /return !isMarketingEvent\(event\) && !isProbableNoiseEvent\(event\)/);
  assert.match(dashboard, /"open", "fatal", "marketing", "noise", "all"/);
  assert.match(dashboard, /window\.confirm/);
  assert.doesNotMatch(dashboard, /três tentativas de 21 de setembro|Não há repetição recente/);
});

test("media error collection and print styles retain their corrected boundaries", () => {
  const telemetry = source("src/lib/client/siteEvents.ts");
  assert.match(telemetry, /event\.target instanceof HTMLImageElement/);
  assert.match(telemetry, /event\.target instanceof HTMLVideoElement/);
  assert.match(telemetry, /now > suppressScrollDetectionUntil/);
  assert.match(telemetry, /now - lastUserScrollIntentAt > 2_500/);
  const moduleCSS = source("src/components/admin/AstrologyMapAdminPage.module.css");
  assert.doesNotMatch(moduleCSS, /^\s*:global\(body\)/m);
  assert.match(source("src/styles/base.css"), /body:has\(\[data-astrology-report\]\)/);
});
