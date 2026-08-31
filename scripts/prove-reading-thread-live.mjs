import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = String(process.env.PDU_QA_URL ?? "http://localhost:3000").replace(/\/$/, "");
const chromePath = process.env.PDU_CHROME_PATH?.trim();
const browser = await chromium.launch({
  headless: true,
  ...(chromePath ? { executablePath: chromePath } : {}),
});

const question = "O que precisa ficar claro na minha próxima decisão?";
const plan = "Hoje, vou escolher uma pessoa e oferecer vinte minutos de escuta.";
const profile = {
  displayName: "Fase QA",
  focusAreas: ["Carreira"],
  currentPhase: "Tomando uma decisão",
  guidanceTone: "Direta e prática",
  desiredShift: "Clareza para decidir",
  boundaries: ["Sem fatalismo"],
  contextNote: "Estou testando se a leitura continua viva depois de ser aberta.",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const context = await browser.newContext({
    locale: "pt-BR",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  let readingRequest = null;

  page.on("console", (message) => {
    // The proof deliberately returns 401 for private writes so the local
    // continuity fallback is exercised without mutating an external account.
    if (
      message.type() === "error" &&
      !message.text().includes("status of 401 (Unauthorized)")
    ) {
      consoleErrors.push(message.text());
    }
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "failed",
      });
    }
  });

  await page.route("**/api/reading/create", async (route) => {
    readingRequest = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        readingId: "qa-reading-thread-001",
        theme: "love",
        question,
        mode: "ANCORA",
        productKey: "free_daily",
        spreadType: "three_card_timeline",
        spreadLabel: "3 Cartas — Passado / Presente / Caminho",
        spread: [
          {
            position: "RAIZ",
            cardKey: "major-00-the-fool",
            keyword: "começo",
            name: "O Louco",
            reversed: false,
            meaning: "Um começo limpo pede presença.",
            assetPath: "/assets/major-00-the-fool.webp",
          },
          {
            position: "AGORA",
            cardKey: "major-06-the-lovers",
            keyword: "escolha",
            name: "Os Enamorados",
            reversed: false,
            meaning: "A escolha fica mais clara quando os valores se alinham.",
            assetPath: "/assets/major-06-the-lovers.webp",
          },
          {
            position: "CAMINHO",
            cardKey: "major-03-the-empress",
            keyword: "cuidado",
            name: "A Imperatriz",
            reversed: false,
            meaning: "Cuidado e constância sustentam o próximo passo.",
            assetPath: "/assets/major-03-the-empress.webp",
          },
        ],
        interpretation: [
          "1) RESPOSTA DIRETA",
          "A clareza chega quando a decisão cabe em um gesto que você consegue sustentar.",
          "2) CARTAS",
          "- Raiz: O Louco — Comece com presença, sem exigir um plano perfeito.",
          "- Agora: Os Enamorados — Escolha pelos seus valores, não pela pressa de agradar.",
          "- Caminho: A Imperatriz — Apoie a decisão com cuidado e constância.",
          "3) AÇÕES",
          "- Fase atual: tomando uma decisão.",
          "- Tom escolhido: direto e prático.",
          "- Transforme a clareza em um gesto pequeno hoje.",
          "4) FECHAMENTO",
          "Mantra: posso escutar a mim mesmo e avançar com calma.",
          "Próxima pergunta: o que precisa de um passo possível agora?",
        ].join("\n\n"),
      }),
    });
  });

  // Keep the proof local and deterministic. These are the endpoints that can
  // persist a saved message or public/action commitment during the UI flow.
  await page.route("**/api/saved-messages", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "AUTH_REQUIRED" }),
    });
  });
  await page.route("**/api/actions/public**", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        participation: {
          public_token: "qa-public-token",
          completion_secret: "qa-completion-secret",
          root_chain_token: "qa-root-token",
          parent_public_token: null,
        },
      }),
    });
  });
  await page.route("**/api/actions", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "AUTH_REQUIRED" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${baseUrl}/?lang=pt&qa=reading-thread-${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page.evaluate((storedProfile) => {
    const id = `pdu_thread_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("pdu_user_id", id);
    localStorage.setItem("pdu_onboarding_done", "1");
    localStorage.setItem("pdu_onboarding_profile", JSON.stringify(storedProfile));
    localStorage.removeItem("pdu_active_reading");
    localStorage.removeItem("pdu_saved_messages");
    localStorage.removeItem("pdu_impact_commitments");
    localStorage.removeItem("pdu_reading_draft");
  }, profile);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator("#question").waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForFunction(
    () => {
      const button = document.querySelector('[data-testid="open-reading-button"]');
      return button instanceof HTMLButtonElement && !button.disabled;
    },
    { timeout: 20_000 }
  );
  await page.locator("#question").fill(question);
  await page.getByTestId("open-reading-button").click({ timeout: 15_000 });
  await page.locator("#reading-opened").waitFor({ state: "visible", timeout: 60_000 });
  await page.locator("#reading-opened .pdu-reading-transcript").waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.locator("#reading-opened .pdu-result-card-strip__item").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.waitForTimeout(600);

  assert(
    readingRequest?.readingProfile?.displayName === profile.displayName,
    "The reading request did not carry the selected profile"
  );
  assert(
    readingRequest?.readingProfile?.currentPhase === profile.currentPhase,
    "The reading request did not carry the current phase"
  );
  assert(
    readingRequest?.readingProfile?.boundaries?.includes("Sem fatalismo"),
    "The reading request did not carry the user's boundary"
  );

  const readingText = await page.locator("#reading-opened").innerText();
  const ritualText = await page.locator("#leitura").innerText();
  assert(ritualText.includes(question), "The reading ritual lost the question");
  assert(readingText.includes("O Louco"), "The opened reading lost the first card");
  assert(readingText.includes("Os Enamorados"), "The opened reading lost the second card");
  assert(readingText.includes("A Imperatriz"), "The opened reading lost the third card");
  assert(readingText.includes("Tom escolhido: direto e prático."), "The reading lost its personalized signal");
  assert(
    (await page.locator("#reading-opened .pdu-reading-block").count()) === 4,
    "The reading did not render its four continuity blocks"
  );

  await page.locator("button.pdu-save-action").click();
  await page.locator("button.pdu-save-action[data-state='saved']").waitFor({
    state: "visible",
    timeout: 10_000,
  });
  assert(
    (await page.locator("#reading-opened").innerText()).includes("Leitura salva neste navegador"),
    "The reading did not leave a local save notice"
  );

  await page.locator("#impact-plan").fill(plan);
  await page.locator("#acao .pdu-impact-plan-submit").click();
  await page.locator("#acao .pdu-impact-notice").waitFor({ state: "visible", timeout: 20_000 });
  assert(
    (await page.locator("#acao").innerText()).includes("Compromisso guardado neste navegador"),
    "The action did not remain available in local continuity"
  );

  await page.goto(`${baseUrl}/meu-universo?qa=reading-thread-${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page.locator("#acoes-vivas").waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("#historico-vivo").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByText(plan, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
  await page.getByText(question, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
  const universeText = await page.locator("body").innerText();
  assert(universeText.includes("Seus compromissos com a vida real"), "My Universe lost the action section");
  assert(universeText.includes(plan), "My Universe lost the committed action plan");
  assert(universeText.includes("Caminhos abertos"), "My Universe lost the reading history section");
  assert(universeText.includes(question), "My Universe lost the saved reading question");
  assert(
    (await page.locator('a[href="#acoes-vivas"]').count()) >= 1,
    "My Universe lost the next step back to live actions"
  );

  const lumeButton = page.locator("button.pdu-lume-ambient__button");
  assert((await lumeButton.count()) === 1, "Lume presence button was not unique");
  await lumeButton.click();
  const panel = page.locator("#lume-guide-panel");
  await panel.waitFor({ state: "visible", timeout: 10_000 });
  await panel.getByText(/gesto em aberto/).waitFor({ state: "visible", timeout: 20_000 });
  await panel.locator('input[aria-label="Perguntar à Lume"]').fill("ação");
  await panel.locator('button[type="submit"]').click();
  await panel.getByText(/Você tem 1 gesto em aberto/).last().waitFor({
    state: "visible",
    timeout: 10_000,
  });
  const lumeAction = panel.locator('a[href="/meu-universo#acoes-vivas"]');
  assert((await lumeAction.count()) === 1, "Lume did not link back to the live action");

  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.getBoundingClientRect().width,
  }));
  assert(
    metrics.documentWidth <= metrics.viewportWidth + 2,
    `Continuity route overflows at ${metrics.viewportWidth}px`
  );
  assert(!consoleErrors.length, `Continuity proof console errors: ${consoleErrors[0]}`);
  assert(!failedRequests.length, `Continuity proof failed requests: ${failedRequests[0]?.url}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "reading-thread-continuity",
        reading: "question, profile, four blocks and three cards rendered",
        action: "saved locally after protected endpoint fallback",
        universe: "saved reading and action returned on Meu Universo",
        lume: "singular action recognized with live action CTA",
        viewport: `${metrics.viewportWidth}px`,
        overflow: metrics.documentWidth > metrics.viewportWidth + 2,
        bodyWidth: metrics.bodyWidth,
      },
      null,
      2
    )
  );

  await context.close();
} finally {
  await browser.close();
}
