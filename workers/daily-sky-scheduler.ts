type SchedulerEnv = { PDU_CRON_SECRET?: string };
type BatchResult = { code?: string; considered?: number; failed?: number };

const SEND_URL = "https://palavrasdouniverso.com/api/daily-sky-email/send";

export async function runDailySkySchedule(secret: string, fetcher: typeof fetch = fetch) {
  if (!secret) throw new Error("PDU_CRON_SECRET is not configured");

  // The application owns the London-time window and the idempotent DB claim.
  // Each trigger drains a bounded number of batches without retrying an
  // ambiguous provider failure.
  for (let batch = 0; batch < 4; batch += 1) {
    const response = await fetcher(SEND_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(65_000),
    });
    if (!response.ok) throw new Error(`Daily sky endpoint returned HTTP ${response.status}`);

    const result = await response.json() as BatchResult;
    if (result.code === "OUTSIDE_WINDOW") return;
    if (result.code !== "PROCESSED") throw new Error("Unexpected daily sky endpoint response");
    if ((result.failed ?? 0) > 0) throw new Error("Daily sky delivery batch reported failures");
    if ((result.considered ?? 0) === 0) return;
  }
}

const scheduler = {
  async scheduled(_controller: unknown, env: SchedulerEnv) {
    await runDailySkySchedule(env.PDU_CRON_SECRET ?? "");
  },
};

export default scheduler;
