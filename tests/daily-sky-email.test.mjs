import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { build } from "esbuild";
import { inMorningWindow, londonDay } from "../src/lib/daily-sky-email/schedule.ts";

test("daily send follows London daylight-saving time", () => {
  assert.deepEqual(londonDay(new Date("2026-01-15T08:15:00Z")), { date: "2026-01-15", hour: 8 });
  assert.deepEqual(londonDay(new Date("2026-07-15T07:15:00Z")), { date: "2026-07-15", hour: 8 });
  assert.equal(inMorningWindow(new Date("2026-07-15T06:59:00Z")).due, false);
  assert.equal(inMorningWindow(new Date("2026-07-15T10:00:00Z")).due, false);
});

test("subscription is explicit and daily send is claimed once per date", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20261103175107_daily_sky_email_consent.sql", import.meta.url), "utf8");
  const subscribe = await readFile(new URL("../src/app/api/daily-sky-email/subscribe/route.ts", import.meta.url), "utf8");
  const sender = await readFile(new URL("../src/app/api/daily-sky-email/send/route.ts", import.meta.url), "utf8");
  assert.match(migration, /unique \(subscription_id, local_date\)/);
  assert.match(migration, /revoke all on public\.daily_sky_email_subscriptions from anon, authenticated/);
  assert.match(migration, /claim_daily_sky_email_batch/);
  assert.match(subscribe, /consent !== true/);
  assert.match(subscribe, /confirmation_token_hash/);
  assert.match(sender, /authorized\(request\)/);
  assert.match(sender, /claim_daily_sky_email_batch/);
  assert.match(sender, /current\?\.status !== "active"/);
});

test("a real sky snapshot produces distinct, contextual PT and EN notes", async () => {
  const bundled = await build({
    entryPoints: ["src/lib/daily-sky-email/content.ts"], bundle: true,
    platform: "node", format: "esm", write: false, tsconfig: "tsconfig.json",
  });
  const sky = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString("base64")}`);
  const date = new Date("2026-10-30T12:00:00Z");
  const pt = sky.dailySkyStory(date, "pt-BR");
  const en = sky.dailySkyStory(date, "en");
  assert.match(pt.subject, /Mercúrio.*Marte/);
  assert.match(en.subject, /Mercury.*Mars/);
  assert.match(pt.observation, /90°/);
  assert.match(en.observation, /90°/);
  assert.notEqual(pt.reflection, en.reflection);
});

test("daily sky mail uses Brevo HTTP from the Worker, even with the legacy relay configured", async () => {
  const bundled = await build({
    entryPoints: ["src/lib/daily-sky-email/mailer.ts"], bundle: true,
    platform: "node", format: "esm", write: false, tsconfig: "tsconfig.json",
  });
  const mailer = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString("base64")}`);
  const previous = {
    apiKey: process.env.BREVO_API_KEY,
    sender: process.env.PDU_EMAIL_FROM,
    relay: process.env.PDU_SMTP_RELAY_URL,
    fetch: globalThis.fetch,
  };
  const calls = [];
  try {
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.PDU_EMAIL_FROM = "no-reply@palavrasdouniverso.com";
    process.env.PDU_SMTP_RELAY_URL = "https://palavras-do-universo.vercel.app/api/internal/voucher-email";
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return Response.json({ messageId: "brevo-accepted" }, { status: 201 });
    };
    assert.equal(mailer.skyEmailConfigured(), true);
    assert.equal(await mailer.sendSkyEmail({
      to: "test@example.com", locale: "en", subject: "Sky note",
      paragraphs: ["A short sky note."], tag: "daily-sky",
    }), "brevo-accepted");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(calls[0].options.headers["api-key"], "test-api-key");
    assert.deepEqual(JSON.parse(calls[0].options.body).to, [{ email: "test@example.com" }]);
    delete process.env.BREVO_API_KEY;
    assert.equal(mailer.skyEmailConfigured(), false);
  } finally {
    for (const [name, value] of [["BREVO_API_KEY", previous.apiKey], ["PDU_EMAIL_FROM", previous.sender], ["PDU_SMTP_RELAY_URL", previous.relay]]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    globalThis.fetch = previous.fetch;
  }
});

test("Cloudflare scheduler drains bounded batches with authenticated calls", async () => {
  const bundled = await build({
    entryPoints: ["workers/daily-sky-scheduler.ts"], bundle: true,
    platform: "node", format: "esm", write: false, tsconfig: "tsconfig.json",
  });
  const scheduler = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString("base64")}`);
  const results = [{ code: "PROCESSED", considered: 20, failed: 0 }, { code: "PROCESSED", considered: 0, failed: 0 }];
  const calls = [];
  await scheduler.runDailySkySchedule("test-secret", async (url, options) => {
    calls.push({ url, options });
    return Response.json(results.shift());
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers.authorization, "Bearer test-secret");
  assert.match(calls[0].url, /palavrasdouniverso\.com\/api\/daily-sky-email\/send$/);
});

test("newsletter API key does not change voucher relay delivery or retry an ambiguous failure", async () => {
  const bundled = await build({
    entryPoints: ["src/lib/email/transactional.ts"], bundle: true,
    platform: "node", format: "esm", write: false, tsconfig: "tsconfig.json",
  });
  const mailer = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString("base64")}`);
  const previous = {
    apiKey: process.env.BREVO_API_KEY,
    smtpKey: process.env.BREVO_SMTP_KEY,
    relay: process.env.PDU_SMTP_RELAY_URL,
    sender: process.env.PDU_EMAIL_FROM,
    fetch: globalThis.fetch,
  };
  const voucher = {
    id: "test-voucher", code: "TEST-123", label: "Acesso", description: null,
    kind: "invite", share_url: "https://palavrasdouniverso.com/voucher/TEST-123",
    primary_title: "Meu Universo", target_email: "test@example.com", recipient_name: "Test User",
    grant_expires_days: 7, email_locale: "en",
  };
  const calls = [];
  try {
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.BREVO_SMTP_KEY = "test-smtp-secret";
    process.env.PDU_SMTP_RELAY_URL = "https://palavras-do-universo.vercel.app/api/internal/voucher-email";
    process.env.PDU_EMAIL_FROM = "no-reply@palavrasdouniverso.com";
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return Response.json({ delivery: "sent" });
    };
    assert.deepEqual(await mailer.sendVoucherEmail(voucher), { status: "sent" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, process.env.PDU_SMTP_RELAY_URL);
    assert.match(calls[0].options.headers["x-pdu-signature"], /^[a-f0-9]{64}$/);

    globalThis.fetch = async (url) => {
      calls.push({ url });
      return Response.json({ code: "TEMPORARY_ERROR" }, { status: 503 });
    };
    assert.deepEqual(await mailer.sendVoucherEmail(voucher), { status: "failed", reason: "send_failed" });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, process.env.PDU_SMTP_RELAY_URL);
  } finally {
    for (const [name, value] of [["BREVO_API_KEY", previous.apiKey], ["BREVO_SMTP_KEY", previous.smtpKey], ["PDU_SMTP_RELAY_URL", previous.relay], ["PDU_EMAIL_FROM", previous.sender]]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    globalThis.fetch = previous.fetch;
  }
});
