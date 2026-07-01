import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.PDU_QA_URL ?? "http://127.0.0.1:3000";
const chromePath =
  process.env.PDU_CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = process.env.PDU_QA_OUT_DIR ?? "/tmp";

const routes = [
  "/",
  "/carta-do-dia",
  "/baralho",
  "/tiradas",
  "/profissionais",
  "/profissionais/me",
  "/meu-universo",
  "/entrar",
  "/termos",
  "/privacidade",
  "/reembolsos",
];

const scenarios = [
  { name: "desktop-en", locale: "en", viewport: { width: 1440, height: 1000 } },
  {
    name: "mobile-pt",
    locale: "pt-BR",
    viewport: { width: 390, height: 844, isMobile: true },
  },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});
const results = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      locale: scenario.locale === "en" ? "en-GB" : "pt-BR",
    });

    for (const route of routes) {
      const page = await context.newPage();
      const failed = [];
      const consoleErrors = [];

      page.on("requestfailed", (request) => {
        if (request.failure()?.errorText !== "net::ERR_ABORTED") {
          failed.push(request.url());
        }
      });
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      if (route === "/profissionais/me") {
        await page.route("**/api/profissionais/me", async (requestRoute) => {
          await requestRoute.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, profile: null, offers: [] }),
          });
        });
      }

      const separator = route.includes("?") ? "&" : "?";
      const url = `${baseUrl}${route}${separator}lang=${encodeURIComponent(
        scenario.locale
      )}&qa=${Date.now()}`;
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page.waitForFunction(
        (expectedLocale) => document.documentElement.lang === expectedLocale,
        scenario.locale,
        { timeout: 10_000 }
      );
      await page.waitForTimeout(300);

      const metrics = await page.evaluate(() => {
        const visibleText = document.body.innerText;
        return {
          lang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          brokenImages: Array.from(document.images)
            .filter((image) => {
              const src = image.getAttribute("src") ?? image.currentSrc;
              return src && image.complete && image.naturalWidth === 0;
            })
            .map((image) => image.getAttribute("src") ?? image.currentSrc),
          hasMain: Boolean(document.querySelector("main")),
          heading: document.querySelector("h1")?.textContent?.trim() ?? "",
          visibleText,
        };
      });

      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      const screenshotPath = `${outDir}/pdu-route-${scenario.name}-${slug}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        caret: "initial",
      });

      const problems = [];
      if (response?.status() !== 200) problems.push(`status ${response?.status()}`);
      if (!metrics.hasMain) problems.push("missing main");
      if (!metrics.heading) problems.push("missing h1");
      if (metrics.overflow > 3) problems.push(`overflow ${metrics.overflow}`);
      if (metrics.brokenImages.length) {
        problems.push(`broken images ${metrics.brokenImages.length}`);
      }
      if (failed.length) problems.push(`failed requests ${failed.length}`);
      if (consoleErrors.length) problems.push(`console errors ${consoleErrors.length}`);
      if (metrics.lang !== scenario.locale) {
        problems.push(`lang ${metrics.lang}`);
      }
      if (
        scenario.locale === "en" &&
        /Sua conta|Sua pergunta|Criar conta grátis|Quando você assumir uma ação|Cadastre e publique|Gestão do profissional/.test(
          metrics.visibleText
        )
      ) {
        problems.push("visible Portuguese leakage");
      }

      results.push({
        scenario: scenario.name,
        route,
        status: response?.status() ?? 0,
        heading: metrics.heading,
        overflow: metrics.overflow,
        brokenImageCount: metrics.brokenImages.length,
        failedRequestCount: failed.length,
        consoleErrorCount: consoleErrors.length,
        consoleErrors: consoleErrors.slice(0, 3),
        screenshotPath,
        problems,
      });

      await page.close();
    }

    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.problems.length)) {
  process.exit(1);
}
