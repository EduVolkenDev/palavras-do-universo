import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { cleanPersonalText, daysSince, isDailyCheckIn, localDateAt } from "../src/lib/astrology/daily-continuity.ts";

test("local date and follow-up interval respect the chosen timezone", () => {
  const now = new Date("2026-10-29T00:30:00Z");
  assert.equal(localDateAt(now, "America/Sao_Paulo"), "2026-10-28");
  assert.equal(localDateAt(now, "Europe/London"), "2026-10-29");
  assert.equal(daysSince("2026-10-27", "America/Sao_Paulo", now), 1);
  assert.equal(daysSince("2026-10-27", "Europe/London", now), 2);
});

test("personal text stays bounded and empty submissions are rejected", () => {
  assert.equal(cleanPersonalText("  Um gesto   pequeno  "), "Um gesto pequeno");
  assert.equal(cleanPersonalText("   "), null);
  assert.equal(cleanPersonalText("x".repeat(501)), null);
});

test("private check-in contract rejects malformed records", () => {
  const entry = {
    id: "test", localDate: "2026-10-29", timezone: "Europe/London", nextStep: "Um gesto possível",
    gesture: "Caminhar", reflection: "Hoje me senti mais calmo", createdAt: "2026-10-29T12:00:00Z",
    followupText: null, followupAt: null,
  };
  assert.equal(isDailyCheckIn(entry), true);
  assert.equal(isDailyCheckIn({ ...entry, followupText: 7 }), false);
});

test("route keeps saved notes user-scoped, subscriber-gated and attached to a saved reading", async () => {
  const route = await readFile(new URL("../src/app/api/astrology/daily/check-ins/route.ts", import.meta.url), "utf8");
  assert.match(route, /requireApiUser\(\)/);
  assert.match(route, /hasCircleAstrologyAccess\(auth\.user\)/);
  assert.match(route, /\.eq\("user_id", auth\.user\.id\)/);
  assert.match(route, /\.eq\("status", "ready"\)/);
  assert.match(route, /ignoreDuplicates: true/);
  assert.match(route, /daysSince\(checkIn\.localDate, checkIn\.timezone\) < 2/);
  const generic = await readFile(new URL("../src/app/api/saved-messages/route.ts", import.meta.url), "utf8");
  assert.match(generic, /\.neq\("message_type", "daily_sky_checkin"\)/);
  const dailyReading = await readFile(new URL("../src/app/api/astrology/daily/reading/route.ts", import.meta.url), "utf8");
  assert.match(dailyReading, /\.neq\("message_type", "daily_sky_checkin"\)/);
});
