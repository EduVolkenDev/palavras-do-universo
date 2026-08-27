import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.PDU_QA_URL ?? "http://127.0.0.1:3005";
const chromePath = process.env.PDU_CHROME_PATH?.trim();
const outDir = process.env.PDU_QA_OUT_DIR ?? "/tmp";

const viewports = [
  { name: "desktop-2048x1120", viewport: { width: 2048, height: 1120 } },
  { name: "mobile-390x844", viewport: { width: 390, height: 844, isMobile: true } },
];

const browser = await chromium.launch({
  headless: true,
  ...(chromePath ? { executablePath: chromePath } : {}),
});

const results = [];

try {
  for (const item of viewports) {
    const page = await browser.newPage({ viewport: item.viewport });
    const failed = [];
    const consoleErrors = [];

    await page.route("**/api/reading/create", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          readingId: `qa-${item.name}`,
          theme: "spirit",
          question: "What do I need to understand about this next step today?",
          mode: "qa",
          spread: [
            {
              position: "Situation",
              cardKey: "major-00-the-fool",
              keyword: "beginning",
              name: "The Fool",
              reversed: false,
              meaning: "A clean beginning asks for presence.",
              assetPath: "/assets/major-00-the-fool.webp",
            },
            {
              position: "Obstacle",
              cardKey: "major-06-the-lovers",
              keyword: "choice",
              name: "The Lovers",
              reversed: false,
              meaning: "Choice becomes clearer when values align.",
              assetPath: "/assets/major-06-the-lovers.webp",
            },
            {
              position: "Direction",
              cardKey: "major-03-the-empress",
              keyword: "care",
              name: "The Empress",
              reversed: false,
              meaning: "Care and consistency create the next step.",
              assetPath: "/assets/major-03-the-empress.webp",
            },
          ],
          interpretation: [
            "1) DIRECT ANSWER",
            "Move with clarity instead of waiting for perfect certainty.",
            "2) CARDS",
            "- Situation: The Fool — Begin with one visible step, not a perfect plan.",
            "- Obstacle: The Lovers — Choose by values instead of trying to please every possible path.",
            "- Direction: The Empress — Support the choice with care, rhythm, and consistency.",
            "3) ACTIONS",
            "- Write the next action in one sentence.",
            "- Remove one distraction for twenty minutes.",
            "- Confirm the choice through one small gesture today.",
            "4) CLOSING",
            "Mantra: I can listen to myself and move with calm.",
            "Next question: What needs one practical step now?",
          ].join("\n\n"),
        }),
      });
    });

    page.on("requestfailed", (request) => {
      failed.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "failed",
      });
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(`${baseUrl}/?lang=en&qa=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    await page.evaluate(() => {
      const id = `pdu_visual_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      localStorage.setItem("pdu_user_id", id);
      localStorage.setItem("pdu_onboarding_done", "1");
      localStorage.removeItem("pdu_active_reading");
      localStorage.removeItem("pdu_free_reading_usage");
      localStorage.removeItem("pdu_saved_messages");
      localStorage.removeItem("pdu_reading_history");
    });

    await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(800);
    await page.locator("#question").fill("What do I need to understand about this next step today?");
    await page.getByTestId("open-reading-button").click({
      timeout: 15_000,
    });
    await page.locator("#reading-opened").waitFor({ state: "visible", timeout: 60_000 });
    await page.waitForTimeout(1_500);
    await page.evaluate(() => {
      document.getElementById("reading-opened")?.scrollIntoView({
        block: "start",
        inline: "nearest",
      });
    });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate(() => {
      const query = (selector) => document.querySelector(selector);
      const queryAll = (selector) => Array.from(document.querySelectorAll(selector));
      const rect = (element) => {
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return {
          x: value.x,
          y: value.y,
          width: value.width,
          height: value.height,
          top: value.top,
          left: value.left,
          right: value.right,
          bottom: value.bottom,
        };
      };
      const cards = queryAll(".pdu-result-card-strip__item").map(rect);
      const frames = queryAll(".pdu-result-card-strip__item .pdu-tarot-frame").map(rect);
      const overlap = (a, b) =>
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const overlaps = [];
      for (let i = 0; i < cards.length; i += 1) {
        for (let j = i + 1; j < cards.length; j += 1) {
          overlaps.push(overlap(cards[i], cards[j]));
        }
      }

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scrollOverflow: document.documentElement.scrollWidth - window.innerWidth,
        blocks: queryAll(".pdu-reading-block").map((element) => ({
          rect: rect(element),
          text: element.textContent?.trim() ?? "",
        })),
        cards,
        frames,
        overlaps,
        transcript: rect(query(".pdu-reading-transcript")),
        stage: rect(query(".pdu-result-stage")),
        layout: rect(query(".pdu-open-reading-layout")),
        strip: rect(query(".pdu-result-card-strip")),
        heading: rect(query("#reading-opened h2")),
        langBad: /Voce pode buscar|Você pode buscar|DESCUBRIR|CONECTAR/.test(document.body.innerText),
      };
    });

    const screenshotPath = `${outDir}/pdu-reading-${item.name}.png`;
    const transcriptScreenshotPath = `${outDir}/pdu-reading-transcript-${item.name}.png`;
    await page.locator("#reading-opened").screenshot({ path: screenshotPath, type: "png" });
    await page.locator(".pdu-reading-transcript").screenshot({
      path: transcriptScreenshotPath,
      type: "png",
    });
    await page.close();

    const problems = [];
    if (metrics.scrollOverflow > 3) problems.push(`horizontal overflow ${metrics.scrollOverflow}`);
    if (metrics.cards.length !== 3) problems.push(`expected 3 cards got ${metrics.cards.length}`);
    if (metrics.overlaps.some((value) => value > 1)) problems.push(`cards overlap ${metrics.overlaps.join(",")}`);
    if (!metrics.transcript || metrics.transcript.width < (metrics.viewport.width < 600 ? 300 : 420)) {
      problems.push(`transcript too narrow ${metrics.transcript?.width ?? 0}`);
    }
    if (!metrics.stage || metrics.stage.height > metrics.viewport.height * 1.25) {
      problems.push(`stage too tall ${metrics.stage?.height ?? 0}`);
    }
    if (metrics.blocks.length !== 4) problems.push(`expected 4 reading blocks got ${metrics.blocks.length}`);
    if (metrics.blocks.some((block) => !block.text || !block.rect || block.rect.height < 32)) {
      problems.push("reading block text is not visibly measurable");
    }
    if (metrics.langBad) problems.push("EN page contains PT marketplace copy");
    const actionableFailed = failed.filter((request) => request.error !== "net::ERR_ABORTED");
    if (actionableFailed.length) problems.push(`failed requests ${actionableFailed.length}`);
    if (consoleErrors.length) problems.push(`console errors ${consoleErrors.slice(0, 2).join(" | ")}`);

    results.push({
      name: item.name,
      screenshotPath,
      transcriptScreenshotPath,
      problems,
      scrollOverflow: metrics.scrollOverflow,
      cardCount: metrics.cards.length,
      blockCount: metrics.blocks.length,
      cardOverlaps: metrics.overlaps,
      stage: metrics.stage,
      strip: metrics.strip,
      transcript: metrics.transcript,
      layout: metrics.layout,
      failed: actionableFailed,
      failedCount: actionableFailed.length,
      consoleErrorCount: consoleErrors.length,
    });
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.problems.length > 0)) {
  process.exit(1);
}
