import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "pdu-commerce-access-"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function compile(source, target) {
  const code = await readFile(join(root, source), "utf8");
  const result = ts.transpileModule(code, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: source,
  });
  const destination = join(temp, target);
  await mkdir(join(destination, ".."), { recursive: true });
  await writeFile(destination, result.outputText);
}

async function readSource(source) {
  return readFile(join(root, source), "utf8");
}

try {
  await compile("src/lib/product/access.ts", "src/lib/product/access.js");
  await compile("src/lib/product/pricing.ts", "src/lib/product/pricing.js");
  await compile("src/lib/product/catalog.ts", "src/lib/product/catalog.js");
  await compile("src/lib/tarot/spreads.ts", "src/lib/tarot/spreads.js");
  const access = await import(join(temp, "src/lib/product/access.js"));
  const pricing = await import(join(temp, "src/lib/product/pricing.js"));
  const catalog = await import(join(temp, "src/lib/product/catalog.js"));
  const spreads = await import(join(temp, "src/lib/tarot/spreads.js"));

  const circle = {
    id: "circle",
    product_key: "circulo_do_universo",
    source: "subscription",
    usage_limit: null,
    usage_count: 0,
  };
  const exactPurchase = {
    id: "purchase",
    product_key: "sinais_do_amor",
    source: "purchase",
    usage_limit: 1,
    usage_count: 0,
  };
  const usedVoucher = {
    id: "voucher-used",
    product_key: "caminho_3_cartas",
    source: "admin",
    usage_limit: 1,
    usage_count: 1,
  };
  const activeVoucher = {
    id: "voucher-active",
    product_key: "caminho_3_cartas",
    source: "admin",
    usage_limit: 2,
    usage_count: 1,
  };

  assert(
    access.entitlementUnlocksProduct("circulo_do_universo", "caminho_3_cartas"),
    "Circle entitlement must unlock included products"
  );
  assert(
    !access.entitlementUnlocksProduct("circulo_do_universo", "clareza_urgente"),
    "Circle entitlement must not unlock products outside the Circle contract"
  );
  assert(
    access.findEntitlementForProduct([circle], "o_espelho")?.id === "circle",
    "Circle entitlement must be found for included product UI"
  );
  assert(
    access.findEntitlementForProduct([circle, exactPurchase], "sinais_do_amor")?.id ===
      "purchase",
    "Exact one-time entitlement must be preferred over Circle fallback"
  );
  assert(
    access.shouldConsumeEntitlement(exactPurchase),
    "One-time purchase entitlement must be consumable"
  );
  assert(
    access.shouldConsumeEntitlement(activeVoucher),
    "Limited voucher entitlement must be consumable"
  );
  assert(
    !access.shouldConsumeEntitlement(usedVoucher),
    "Fully used voucher entitlement must not be consumed again"
  );
  assert(
    !access.shouldConsumeEntitlement(circle),
    "Subscription/Circle entitlement must not be consumed per reading"
  );

  const paidCards = catalog.productCards.filter((card) => card.mode === "paid");
  const paidCardKeys = new Set(paidCards.map((card) => card.productKey));
  const paidReadingKeys = Array.from(access.PAID_READING_PRODUCTS).filter(
    (productKey) => productKey !== access.CIRCLE_PRODUCT_KEY
  );

  for (const productKey of paidReadingKeys) {
    assert(
      paidCardKeys.has(productKey),
      `Paid reading ${productKey} must have a paid product card`
    );
    assert(
      typeof catalog.productCards.find((card) => card.productKey === productKey)?.price ===
        "string",
      `Paid reading ${productKey} must have a standalone price`
    );
    assert(
      Number.isFinite(
        Number(
          catalog.productCards
            .find((card) => card.productKey === productKey)
            .price.replace(/[^0-9,]/g, "")
            .replace(".", "")
            .replace(",", ".")
        )
      ),
      `Paid reading ${productKey} must have a numeric standalone price`
    );
    for (const currency of pricing.PRODUCT_CURRENCIES) {
      const price = catalog.productCards.find((card) => card.productKey === productKey)
        ?.priceByCurrency?.[currency];
      assert(
        typeof price === "string" && price.length > 0,
        `Paid reading ${productKey} must have a ${currency} display price`
      );
      assert(
        pricing.getProductPriceForCurrency(productKey, currency)?.amountCents >= 50,
        `Paid reading ${productKey} must have a payable ${currency} checkout price`
      );
    }
    assert(
      spreads.PRODUCT_SPREAD_TYPES[productKey] &&
        spreads.getSpreadForProduct(productKey)?.positions.length > 0,
      `Paid reading ${productKey} must map to a valid spread experience`
    );
  }

  const circleCardKeys = new Set(
    paidCards
      .filter((card) => card.includedInCircle)
      .map((card) => card.productKey)
  );
  assert(
    circleCardKeys.size === access.CIRCLE_INCLUDED_PRODUCTS.size &&
      Array.from(access.CIRCLE_INCLUDED_PRODUCTS).every((productKey) =>
        circleCardKeys.has(productKey)
      ),
    "Circle access rules must match the product-card inclusion flags"
  );
  assert(
    !circleCardKeys.has("clareza_urgente"),
    "Clareza Urgente must remain a standalone reading outside the Circle"
  );
  assert(
    catalog.pricingPlans
      .find((plan) => plan.productKey === access.CIRCLE_PRODUCT_KEY)
      .features.some((feature) => feature.includes("11 leituras")),
    "Circle pricing copy must state the complete 11-reading entitlement"
  );
  assert(
    !catalog.pricingPlans
      .find((plan) => plan.productKey === access.CIRCLE_PRODUCT_KEY)
      .features.includes("7 tiradas especiais com experiências próprias"),
    "Circle pricing copy must not retain the stale seven-reading claim"
  );

  const readingRoute = await readSource("src/app/api/reading/create/route.ts");
  assert(
    readingRoute.includes("shouldConsumeEntitlement(entitlement)"),
    "Reading creation must consume every limited entitlement, including vouchers"
  );
  assert(
    readingRoute.includes("email: authenticatedUser?.email ?? null") &&
      readingRoute.includes(".from(\"readings\")") &&
      readingRoute.includes("params.email.trim().toLowerCase()"),
    "Reading creation must persist the authenticated user's normalized email"
  );

  const readingsRoute = await readSource("src/app/api/readings/route.ts");
  assert(
    readingsRoute.includes("id, email, locale") && readingsRoute.includes(".eq(\"user_id\", auth.user.id)"),
    "Readings API must expose email only through the authenticated user's own history"
  );

  const vouchersService = await readSource("src/lib/vouchers/service.ts");
  assert(
    vouchersService.includes("currentUsageCount") &&
      vouchersService.includes("usage_count: currentUsageCount"),
    "Voucher re-redemption must preserve usage_count instead of resetting it"
  );
  assert(
    vouchersService.includes("matching.consumed_at ?? now"),
    "Voucher re-redemption must preserve consumed_at for exhausted grants"
  );

  const universePage = await readSource("src/app/meu-universo/page.tsx");
  assert(
    universePage.includes("findEntitlementForProduct(entitlements, recommendedProduct.productKey)"),
    "Meu Universo must use shared unlock resolution for recommended paid readings"
  );
  assert(
    universePage.includes("activeCircleAccess") &&
      universePage.includes("activeBillingSubscription"),
    "Meu Universo must separate Circle access from Stripe billing management"
  );

  const voucherAdmin = await readSource("src/components/admin/VoucherAdminPage.tsx");
  assert(
    voucherAdmin.includes("grantProductKeys") &&
      voucherAdmin.includes("eligibleProductKeys") &&
      voucherAdmin.includes("productKey,"),
    "Voucher admin must keep the primary product aligned with grant/discount products"
  );

  const activeEntitlementsMigration = await readSource(
    "supabase/migrations/20260719120000_set_active_entitlements_security_invoker.sql"
  );
  assert(
    activeEntitlementsMigration.includes("alter view public.active_entitlements") &&
      activeEntitlementsMigration.includes("security_invoker = true"),
    "active_entitlements must stay SECURITY INVOKER to respect querying-user RLS"
  );

  const checkoutRoute = await readSource("src/app/api/checkout/create/route.ts");
  for (const productKey of access.PAID_READING_PRODUCTS) {
    assert(
      checkoutRoute.includes(productKey),
      `Checkout copy must cover paid product ${productKey}`
    );
  }
  assert(
    !checkoutRoute.includes("payment_method_types"),
    "Checkout must keep Stripe payment-method selection automatic"
  );

  const commerceHealthRoute = await readSource("src/app/api/health/commerce/route.ts");
  assert(
    commerceHealthRoute.includes("expectedPaidProductKeys") &&
      commerceHealthRoute.includes("catalogMatrix") &&
      commerceHealthRoute.includes("multiCurrencyCatalog"),
    "Commerce health must validate the complete catalog, Circle matrix, and GBP/BRL price matrix"
  );

  const circleMigration = await readSource(
    "supabase/migrations/20260816123000_align_circle_included_products.sql"
  );
  for (const productKey of access.CIRCLE_INCLUDED_PRODUCTS) {
    assert(
      circleMigration.includes(`'${productKey}'`),
      `Circle migration must include ${productKey}`
    );
  }
  const standalonePricingMigration = await readSource(
    "supabase/migrations/20260819120000_price_premium_spreads_avulso.sql"
  );
  for (const productKey of [
    "energia_da_semana",
    "mapa_do_momento",
    "tirada_diamante",
    "passaro_voando",
    "a_chave",
    "o_espelho",
    "cruz_celta",
    "relacionar",
    "o_paradoxo",
  ]) {
    assert(
      standalonePricingMigration.includes(`'${productKey}'`),
      `Standalone pricing migration must cover ${productKey}`
    );
  }

  console.log(
    "Commerce access valid: Circle unlocks included readings, limited vouchers consume once, and Meu Universo uses shared access resolution."
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
