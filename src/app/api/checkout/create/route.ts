import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireApiUser } from "@/lib/auth/api";
import {
  ensureSupabaseProfile,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import { getSiteUrl, getStripe, hasStripeConfig } from "@/lib/stripe/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { readJsonBody } from "@/lib/http/request";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { CIRCLE_PRODUCT_KEY } from "@/lib/product/access";
import { hasAvailableEntitlementForProduct } from "@/lib/product/entitlements";
import {
  applyDiscountVoucherToCheckout,
  readVoucherCodeFromRequest,
  recordPendingVoucherCheckout,
} from "@/lib/vouchers/service";

type CheckoutBody = {
  productKey?: unknown;
  email?: unknown;
  locale?: unknown;
  voucherCode?: unknown;
};

type OracleProduct = {
  product_key: string;
  title: string;
  product_type: "free" | "one_time" | "subscription";
  status: string;
  price_cents: number | null;
  currency: string;
  access_model: "free" | "one_time" | "subscription_included" | "subscription" | null;
  provider_price_id: string | null;
};

type CheckoutLocale = "pt-BR" | "en";

const checkoutCopyByLocale: Record<
  CheckoutLocale,
  Record<string, { title: string; description: string }>
> = {
  "pt-BR": {
    teste_checkout_50: {
      title: "Teste de Checkout",
      description: "Validação interna de pagamento do Palavras do Universo.",
    },
    clareza_urgente: {
      title: "Clareza Urgente",
      description:
        "Uma leitura premium para respirar, entender o que pesa e escolher o próximo passo de hoje.",
    },
    caminho_3_cartas: {
      title: "Caminho das 3 Cartas",
      description:
        "Situação, sombra e direção para uma pergunta real com clareza prática.",
    },
    sinais_do_amor: {
      title: "Sinais do Amor",
      description:
        "Clareza para sentimentos, vínculos, padrões emocionais e escolhas afetivas.",
    },
    energia_da_semana: {
      title: "Energia da Semana",
      description:
        "Um guia simbólico para os próximos sete dias, com foco, cuidado e integração.",
    },
    mapa_do_momento: {
      title: "Mapa do Momento",
      description:
        "Um retrato simbólico da sua fase atual, dos padrões recorrentes e da próxima direção.",
    },
    tirada_diamante: {
      title: "O Diamante",
      description:
        "Uma tirada premium de cinco cartas para observar uma questão por dentro, por fora e em integração.",
    },
    passaro_voando: {
      title: "O Pássaro Voando",
      description:
        "Uma tirada premium de sete cartas sobre movimento, medo, receptividade, ação e horizonte.",
    },
    a_chave: {
      title: "A Chave",
      description:
        "Uma tirada premium de oito cartas para nomear padrões ocultos e abrir uma escolha real.",
    },
    o_espelho: {
      title: "O Espelho",
      description:
        "Uma tirada premium de doze cartas para relações, projeções, necessidades, limites e escolhas.",
    },
    cruz_celta: {
      title: "Cruz Celta",
      description:
        "Uma tirada premium de dez cartas para contexto amplo, tensão, raízes, campo e integração.",
    },
    relacionar: {
      title: "Relacionar",
      description:
        "Uma tirada premium de quatro cartas para presença, conexão, limites e clareza relacional.",
    },
    o_paradoxo: {
      title: "O Paradoxo",
      description:
        "Uma tirada premium de cinco cartas para acolher a contradição e encontrar um terceiro olhar.",
    },
    circulo_do_universo: {
      title: "Círculo do Universo",
      description:
        "Histórico simbólico, rituais, ciclos, favoritos e acesso contínuo às principais leituras.",
    },
  },
  en: {
    teste_checkout_50: {
      title: "Checkout Test",
      description:
        "Internal payment validation for Palavras do Universo.",
    },
    clareza_urgente: {
      title: "Urgent Clarity",
      description:
        "A premium reading to breathe, understand what feels heavy, and choose today's next step.",
    },
    caminho_3_cartas: {
      title: "Path of the 3 Cards",
      description:
        "Situation, shadow, and direction for one real question with practical clarity.",
    },
    sinais_do_amor: {
      title: "Signs of Love",
      description:
        "Clarity for feelings, bonds, emotional patterns, and relationship choices.",
    },
    energia_da_semana: {
      title: "Weekly Energy",
      description:
        "A symbolic guide for the next seven days, with focus, care, and integration.",
    },
    mapa_do_momento: {
      title: "Moment Map",
      description:
        "A symbolic portrait of your current phase, recurring patterns, and next direction.",
    },
    tirada_diamante: {
      title: "The Diamond",
      description:
        "A five-card premium spread to see one question from inner, outer, and integrated angles.",
    },
    passaro_voando: {
      title: "The Flying Bird",
      description:
        "A seven-card premium spread for movement, fear, receptivity, action, and horizon.",
    },
    a_chave: {
      title: "The Key",
      description:
        "An eight-card premium spread to name hidden patterns and open a real choice.",
    },
    o_espelho: {
      title: "The Mirror",
      description:
        "A twelve-card premium spread for relationships, projection, needs, boundaries, and choice.",
    },
    cruz_celta: {
      title: "Celtic Cross",
      description:
        "A ten-card premium spread for broad context, tension, roots, field, and integration.",
    },
    relacionar: {
      title: "Relating",
      description:
        "A four-card premium spread for presence, connection, boundaries, and relational clarity.",
    },
    o_paradoxo: {
      title: "The Paradox",
      description:
        "A five-card premium spread to hold contradiction and find a third perspective.",
    },
    circulo_do_universo: {
      title: "Circle of the Universe",
      description:
        "Symbolic history, rituals, cycles, favorites, and continued access to the main readings.",
    },
  },
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeCheckoutLocale(value: unknown): CheckoutLocale {
  return value === "en" ? "en" : "pt-BR";
}

function getStripeLocale(locale: CheckoutLocale): Stripe.Checkout.SessionCreateParams.Locale {
  return locale === "en" ? "en" : "pt-BR";
}

function getCheckoutMode(product: OracleProduct): Stripe.Checkout.SessionCreateParams.Mode {
  return product.access_model === "subscription" ||
    product.product_type === "subscription"
    ? "subscription"
    : "payment";
}

function buildLineItem(
  product: OracleProduct,
  overrideAmountCents?: number | null,
  locale: CheckoutLocale = "pt-BR"
): Stripe.Checkout.SessionCreateParams.LineItem {
  if (product.provider_price_id && !overrideAmountCents && locale !== "en") {
    return {
      price: product.provider_price_id,
      quantity: 1,
    };
  }

  const amountCents = overrideAmountCents ?? product.price_cents;

  if (!amountCents || amountCents <= 0) {
    throw new Error("Product is missing a payable price");
  }

  const currency = product.currency.toLowerCase();
  const recurring =
    getCheckoutMode(product) === "subscription"
      ? { recurring: { interval: "month" as const } }
      : {};
  const localizedCopy = checkoutCopyByLocale[locale][product.product_key];

  return {
    quantity: 1,
    price_data: {
      currency,
      unit_amount: amountCents,
      product_data: {
        name: localizedCopy?.title ?? product.title,
        description: localizedCopy?.description,
        metadata: {
          product_key: product.product_key,
        },
      },
      ...recurring,
    },
  };
}

function getUnlockedRedirectPath(productKey: string) {
  if (productKey === CIRCLE_PRODUCT_KEY) return "/meu-universo?access=active";
  return `/?product=${encodeURIComponent(productKey)}`;
}

export async function POST(req: Request) {
  if (
    !(await checkRateLimit({
      request: req,
      scope: "checkout",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return jsonError("Too many checkout attempts", 429);
  }
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const parsed = await readJsonBody<CheckoutBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const productKey = String(body.productKey ?? "").trim();
  const locale = normalizeCheckoutLocale(body.locale);
  const userId = auth.user.id;
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim()
      : auth.user.email;

  if (!productKey) return jsonError("Missing productKey", 400);

  if (isOwnerAccessUser(auth.user)) {
    return NextResponse.json({
      ok: true,
      ownerAccess: true,
      checkoutUrl: "/meu-universo?owner_access=1",
      sessionId: null,
    });
  }

  if (!hasSupabaseConfig()) {
    return jsonError("Supabase is not configured", 503);
  }

  const supabase = getSupabaseAdmin();
  await ensureSupabaseProfile(userId);

  const { data: product, error } = await supabase
    .from("oracle_products")
    .select(
      "product_key,title,product_type,status,price_cents,currency,access_model,provider_price_id"
    )
    .eq("product_key", productKey)
    .single<OracleProduct>();

  if (error || !product) return jsonError("Product not found", 404);
  if (product.status !== "active") return jsonError("Product is not active", 409);

  if (
    await hasAvailableEntitlementForProduct({
      userId,
      productKey: product.product_key,
    })
  ) {
    return NextResponse.json({
      ok: true,
      alreadyUnlocked: true,
      checkoutUrl: getUnlockedRedirectPath(product.product_key),
      sessionId: null,
    });
  }

  if (product.access_model === "free" || product.price_cents === 0) {
    return jsonError("Product does not require checkout", 409);
  }
  if (product.access_model === "subscription_included") {
    return jsonError("Product is included in the Círculo do Universo", 409);
  }

  if (!hasStripeConfig()) {
    return jsonError("Stripe is not configured", 503);
  }

  const voucherCode = await readVoucherCodeFromRequest(
    typeof body.voucherCode === "string" ? body.voucherCode : null
  );
  const voucherResult = voucherCode
    ? await applyDiscountVoucherToCheckout({
        code: voucherCode,
        user: auth.user,
        productKey: product.product_key,
      })
    : null;

  if (voucherResult && !voucherResult.ok) {
    return jsonError(voucherResult.message, 409);
  }

  const originalAmountCents = product.price_cents ?? 0;
  const discountPercent = voucherResult?.ok ? voucherResult.voucher.discount_percent ?? 0 : 0;
  const discountedAmountCents =
    discountPercent > 0
      ? Math.round(originalAmountCents * (1 - discountPercent / 100))
      : originalAmountCents;

  if (voucherResult?.ok && discountedAmountCents < 50) {
    return jsonError("Use an access invitation instead of a near-zero checkout coupon", 409);
  }

  const mode = getCheckoutMode(product);
  const siteUrl = getSiteUrl();
  const stripe = getStripe();

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create({
      mode,
      locale: getStripeLocale(locale),
      client_reference_id: userId,
      line_items: [
        buildLineItem(
          product,
          voucherResult?.ok && discountPercent > 0 ? discountedAmountCents : null,
          locale
        ),
      ],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${siteUrl}/meu-universo?checkout=success&session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(
        product.product_key
      )}`,
      cancel_url: `${siteUrl}/?checkout=cancelled&product=${encodeURIComponent(
        product.product_key
      )}`,
      metadata: {
        user_id: userId,
        product_key: product.product_key,
        access_model: product.access_model ?? product.product_type,
        voucher_id: voucherResult?.ok ? voucherResult.voucher.id : "",
        voucher_code: voucherResult?.ok ? voucherResult.voucher.code : "",
        voucher_discount_percent:
          voucherResult?.ok ? String(voucherResult.voucher.discount_percent ?? "") : "",
      },
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                user_id: userId,
                product_key: product.product_key,
              },
            }
          : undefined,
      payment_intent_data:
        mode === "payment"
          ? {
              metadata: {
                user_id: userId,
                product_key: product.product_key,
              },
            }
          : undefined,
    });
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Could not create checkout";
    return jsonError(message, 502);
  }

  if (mode === "subscription") {
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan: product.product_key,
        product_key: product.product_key,
        status: "pending",
        provider: "stripe",
        provider_checkout_id: session.id,
        provider_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        price_cents: discountedAmountCents,
        currency: product.currency,
        metadata: {
          checkout_url: session.url,
          original_amount_cents: originalAmountCents,
          discount_percent: discountPercent,
        },
      });

    if (subscriptionError) {
      console.error("Could not persist pending subscription", subscriptionError.message);
      return jsonError("Could not prepare subscription checkout", 500);
    }
  } else {
    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: userId,
      product_key: product.product_key,
      amount_cents: discountedAmountCents,
      currency: product.currency,
      status: "pending",
      provider: "stripe",
      provider_checkout_id: session.id,
      metadata: {
        checkout_url: session.url,
        original_amount_cents: originalAmountCents,
        discount_percent: discountPercent,
      },
    });

    if (purchaseError) {
      console.error("Could not persist pending purchase", purchaseError.message);
      return jsonError("Could not prepare payment checkout", 500);
    }
  }

  if (voucherResult?.ok) {
    await recordPendingVoucherCheckout({
      voucher: voucherResult.voucher,
      user: auth.user,
      checkoutSessionId: session.id,
      productKey: product.product_key,
      originalAmountCents,
      discountedAmountCents,
    });
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
    appliedVoucher:
      voucherResult?.ok
        ? {
            code: voucherResult.voucher.code,
            discountPercent: voucherResult.voucher.discount_percent,
          }
        : null,
  });
}
