"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

const TEST_PRODUCT_KEY = "teste_checkout_50";
const TEST_CIRCLE_PRODUCT_KEY = "circulo_teste_50";

type Entitlement = {
  product_key?: unknown;
  status?: unknown;
};

type CheckoutResponse = {
  checkoutUrl?: unknown;
  error?: unknown;
};

type EntitlementsResponse = {
  entitlements?: Entitlement[];
  error?: string;
};

type CheckoutConfirmation = "confirmed" | "pending" | "failed";

function getCheckoutState() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("checkout") ?? "";
}

function getPlan() {
  if (typeof window === "undefined") return TEST_PRODUCT_KEY;
  return new URLSearchParams(window.location.search).get("plan") === TEST_CIRCLE_PRODUCT_KEY
    ? TEST_CIRCLE_PRODUCT_KEY
    : TEST_PRODUCT_KEY;
}

export default function InternalCheckoutTestPage({
  ownerEmail,
  hasSupabase,
}: {
  ownerEmail: string;
  hasSupabase: boolean;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(TEST_PRODUCT_KEY);

  async function checkEntitlement(targetPlan = plan) {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/entitlements", { cache: "no-store" });
      const data = (await response.json()) as EntitlementsResponse;
      if (!response.ok || !Array.isArray(data.entitlements)) {
        throw new Error(data.error || (isEnglish ? "We could not check the delivered access." : "Não foi possível consultar o acesso entregue."));
      }
      const delivered = data.entitlements.some((item) =>
        [targetPlan, TEST_PRODUCT_KEY, TEST_CIRCLE_PRODUCT_KEY].includes(String(item.product_key)) &&
        item.status === "active"
      );
      setHasEntitlement(delivered);
      setMessage(
        delivered
          ? isEnglish
            ? "Access delivered: the webhook created this account's entitlement."
            : "Acesso entregue: o webhook já criou o entitlement desta conta."
          : isEnglish
            ? "The payment is not reflected yet. Wait a few seconds and check again."
            : "Pagamento ainda não refletido. Aguarde alguns segundos e consulte novamente."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isEnglish
            ? "We could not check the delivered access."
            : "Não foi possível consultar o acesso entregue."
      );
    } finally {
      setChecking(false);
    }
  }

  async function confirmCheckout(targetPlan = plan): Promise<CheckoutConfirmation> {
    const sessionId =
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("session_id") ?? "";
    if (!sessionId) return "failed";

    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await response.json()) as EntitlementsResponse;

      if (response.status === 409) return "pending";
      if (!response.ok || !Array.isArray(data.entitlements)) {
        throw new Error(data.error || (isEnglish ? "We could not confirm delivery." : "Não foi possível confirmar a entrega."));
      }

      const delivered = data.entitlements.some((item) =>
        [targetPlan, TEST_PRODUCT_KEY, TEST_CIRCLE_PRODUCT_KEY].includes(String(item.product_key)) &&
        item.status === "active"
      );
      setHasEntitlement(delivered);
      setMessage(
        delivered
          ? isEnglish
            ? "Access delivered: the payment was confirmed and this account's entitlement is active."
            : "Acesso entregue: o pagamento foi confirmado e o entitlement desta conta está ativo."
          : isEnglish
            ? "Payment confirmed, but access has not appeared yet. Check again in a moment."
            : "Pagamento confirmado, mas o acesso ainda não apareceu. Consulte novamente em instantes."
      );
      return "confirmed";
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isEnglish
            ? "We could not confirm delivery."
            : "Não foi possível confirmar a entrega."
      );
      return "failed";
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const checkoutState = getCheckoutState();
    const targetPlan = getPlan();
    setPlan(targetPlan);
    if (checkoutState === "success" || checkoutState === "active") {
      void (async () => {
        if (checkoutState === "success") {
          const confirmation = await confirmCheckout(targetPlan);
          if (confirmation !== "pending") return;
        }
        await checkEntitlement(targetPlan);
      })();
    }
  // These callbacks intentionally run once for the return URL's selected plan.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCheckout() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productKey: plan,
          locale: "pt-BR",
          currency: "BRL",
        }),
      });
      const data = (await response.json()) as CheckoutResponse;
      if (!response.ok || typeof data.checkoutUrl !== "string") {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Checkout interno indisponível."
        );
      }
      window.location.assign(data.checkoutUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isEnglish
            ? "We could not open checkout."
            : "Não foi possível abrir o checkout."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] px-4 py-8 pb-28 text-[#241b18] sm:px-6 sm:pb-32 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-[#d8c8ba] pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8e674d]">
            {isEnglish ? "Palavras do Universo · Internal trial" : "Palavras do Universo · Ensaio interno"}
          </p>
          <h1 className="brand-serif mt-3 text-4xl leading-none text-[#2c1f1b] sm:text-5xl">
            {isEnglish ? "Minimal end-to-end checkout" : "Checkout mínimo, ponta a ponta"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f5d55]">
            {isEnglish
              ? "This area validates Checkout creation, payment, and access delivery through the webhook. It does not appear in the public catalog or change commercial prices."
              : "Esta área valida apenas a criação do Checkout, o pagamento e a entrega do acesso pelo webhook. Ela não aparece no catálogo público e não altera os preços comerciais."}
          </p>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#765f54]">
          <span className="rounded-full border border-[#cdbbab] bg-white/60 px-3 py-1.5">
            {isEnglish ? "Owner: " : "Proprietário: "}{ownerEmail || (isEnglish ? "authorized account" : "conta autorizada")}
          </span>
          <span className="rounded-full border border-[#cdbbab] bg-white/60 px-3 py-1.5">
            Supabase: {hasSupabase ? (isEnglish ? "connected" : "conectado") : (isEnglish ? "unavailable" : "indisponível")}
          </span>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#d8c8ba] bg-[#fffaf3]/85 p-6 shadow-[0_20px_60px_rgba(75,46,30,0.09)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a754f]">{isEnglish ? "Hidden product" : "Produto oculto"}</p>
              <h2 className="brand-serif mt-2 text-3xl text-[#2c1f1b]">
                {plan === TEST_CIRCLE_PRODUCT_KEY ? "Círculo de Teste" : "Teste de Checkout"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6f5d55]">
                {plan === TEST_CIRCLE_PRODUCT_KEY ? (
                  <>{isEnglish ? "A monthly " : "Uma assinatura mensal de "}<strong className="text-[#2c1f1b]">R$0,50</strong>{isEnglish ? " subscription to validate continuous Circle and Lume access." : " para validar o acesso contínuo do Círculo e do Lume."}</>
                ) : (
                  <>{isEnglish ? "A one-time charge of " : "Uma cobrança única de "}<strong className="text-[#2c1f1b]">R$0,50</strong>{isEnglish ? ", in the mode configured for this trial." : ", no modo configurado para o ensaio."}</>
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ead8b2] bg-[#fff5d9] px-4 py-3 text-sm text-[#715a32]">
              {isEnglish ? "Owner account only" : "Somente conta proprietária"}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3" aria-label={isEnglish ? "Trial steps" : "Etapas do ensaio"}>
            {[
              ["01", "Checkout", isEnglish ? "Open protected payment" : "Abrir o pagamento protegido"],
              ["02", isEnglish ? "Payment" : "Pagamento", isEnglish ? "Authorize the Stripe charge" : "Autorizar a cobrança na Stripe"],
              ["03", isEnglish ? "Delivery" : "Entrega", isEnglish ? "Confirm access through the webhook" : "Confirmar o acesso via webhook"],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl border border-[#e4d8ce] bg-white/70 p-4">
                <span className="text-xs font-bold tracking-[0.16em] text-[#b08a5b]">{number}</span>
                <h3 className="mt-2 text-sm font-semibold text-[#332621]">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#78675e]">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void startCheckout()}
              disabled={loading || hasEntitlement}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#241b18] px-6 py-3 text-sm font-semibold text-[#fff7ed] transition hover:bg-[#3c2b25] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isEnglish ? "Opening checkout…" : "Abrindo checkout…"
                : hasEntitlement
                  ? isEnglish ? "Access already delivered" : "Acesso já entregue"
                  : isEnglish ? "Open R$0.50 checkout" : "Abrir checkout de R$0,50"}
            </button>
            <button
              type="button"
              onClick={() => void checkEntitlement()}
              disabled={checking}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cdbbab] bg-white/70 px-6 py-3 text-sm font-semibold text-[#604b42] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? (isEnglish ? "Checking…" : "Consultando…") : (isEnglish ? "Check delivery" : "Consultar entrega")}
            </button>
          </div>

          {message ? (
            <p
              className="mt-5 rounded-2xl border border-[#bdd7d0] bg-[#eff8f4] px-4 py-3 text-sm leading-6 text-[#35685c]"
              role="status"
            >
              {message}
            </p>
          ) : null}
          {error ? (
            <p
              className="mt-5 rounded-2xl border border-[#e0b2a7] bg-[#fff0ec] px-4 py-3 text-sm leading-6 text-[#8c4436]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </section>

        <p className="mt-6 text-xs leading-5 text-[#806f65]">
          {isEnglish
            ? "Access is released only after an event confirmed by Stripe. Never enter secret keys on this page."
            : "O acesso é liberado somente depois de um evento confirmado pela Stripe. Nunca informe chaves secretas nesta página."}
        </p>
        <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-[#73563e] underline underline-offset-4">
          {isEnglish ? "Back to portal" : "Voltar ao portal"}
        </Link>
      </div>
    </main>
  );
}
