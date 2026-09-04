"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TEST_PRODUCT_KEY = "teste_checkout_50";

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

export default function InternalCheckoutTestPage({
  ownerEmail,
  hasSupabase,
}: {
  ownerEmail: string;
  hasSupabase: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function checkEntitlement() {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/entitlements", { cache: "no-store" });
      const data = (await response.json()) as EntitlementsResponse;
      if (!response.ok || !Array.isArray(data.entitlements)) {
        throw new Error(data.error || "Não foi possível consultar o acesso entregue.");
      }
      const delivered = data.entitlements.some(
        (item) => item.product_key === TEST_PRODUCT_KEY && item.status === "active"
      );
      setHasEntitlement(delivered);
      setMessage(
        delivered
          ? "Acesso entregue: o webhook já criou o entitlement desta conta."
          : "Pagamento ainda não refletido. Aguarde alguns segundos e consulte novamente."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar o acesso entregue."
      );
    } finally {
      setChecking(false);
    }
  }

  async function confirmCheckout(): Promise<CheckoutConfirmation> {
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
        throw new Error(data.error || "Não foi possível confirmar a entrega.");
      }

      const delivered = data.entitlements.some(
        (item) => item.product_key === TEST_PRODUCT_KEY && item.status === "active"
      );
      setHasEntitlement(delivered);
      setMessage(
        delivered
          ? "Acesso entregue: o pagamento foi confirmado e o entitlement desta conta está ativo."
          : "Pagamento confirmado, mas o acesso ainda não apareceu. Consulte novamente em instantes."
      );
      return "confirmed";
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível confirmar a entrega."
      );
      return "failed";
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const checkoutState = getCheckoutState();
    if (checkoutState === "success" || checkoutState === "active") {
      void (async () => {
        if (checkoutState === "success") {
          const confirmation = await confirmCheckout();
          if (confirmation !== "pending") return;
        }
        await checkEntitlement();
      })();
    }
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
          productKey: TEST_PRODUCT_KEY,
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
        caught instanceof Error ? caught.message : "Não foi possível abrir o checkout."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] px-4 py-8 text-[#241b18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-[#d8c8ba] pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8e674d]">
            Palavras do Universo · Ensaio interno
          </p>
          <h1 className="brand-serif mt-3 text-4xl leading-none text-[#2c1f1b] sm:text-5xl">
            Checkout mínimo, ponta a ponta
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f5d55]">
            Esta área valida apenas a criação do Checkout, o pagamento e a entrega do acesso pelo webhook.
            Ela não aparece no catálogo público e não altera os preços comerciais.
          </p>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#765f54]">
          <span className="rounded-full border border-[#cdbbab] bg-white/60 px-3 py-1.5">
            Proprietário: {ownerEmail || "conta autorizada"}
          </span>
          <span className="rounded-full border border-[#cdbbab] bg-white/60 px-3 py-1.5">
            Supabase: {hasSupabase ? "conectado" : "indisponível"}
          </span>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#d8c8ba] bg-[#fffaf3]/85 p-6 shadow-[0_20px_60px_rgba(75,46,30,0.09)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a754f]">Produto oculto</p>
              <h2 className="brand-serif mt-2 text-3xl text-[#2c1f1b]">Teste de Checkout</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f5d55]">
                Uma cobrança única de <strong className="text-[#2c1f1b]">R$0,50</strong>, no modo configurado para o ensaio.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ead8b2] bg-[#fff5d9] px-4 py-3 text-sm text-[#715a32]">
              Somente conta proprietária
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Etapas do ensaio">
            {[
              ["01", "Checkout", "Abrir o pagamento protegido"],
              ["02", "Pagamento", "Autorizar a cobrança na Stripe"],
              ["03", "Entrega", "Confirmar o acesso via webhook"],
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
                ? "Abrindo checkout…"
                : hasEntitlement
                  ? "Acesso já entregue"
                  : "Abrir checkout de R$0,50"}
            </button>
            <button
              type="button"
              onClick={() => void checkEntitlement()}
              disabled={checking}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cdbbab] bg-white/70 px-6 py-3 text-sm font-semibold text-[#604b42] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? "Consultando…" : "Consultar entrega"}
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
          O acesso é liberado somente depois de um evento confirmado pela Stripe. Nunca informe chaves secretas nesta página.
        </p>
        <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-[#73563e] underline underline-offset-4">
          Voltar ao portal
        </Link>
      </div>
    </main>
  );
}
