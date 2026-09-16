"use client";

import { ArrowRight, CheckCircle2, Loader2, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { buildLoginPath } from "@/lib/auth/redirect";
import {
  getVoucherErrorMessage,
  normalizeVoucherInput,
} from "@/lib/vouchers/client";

export default function VoucherCodeEntry() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingCode = params.get("voucher") ?? params.get("codigo");
    if (!incomingCode) return;

    setCode(normalizeVoucherInput(incomingCode));
    window.setTimeout(() => {
      document.getElementById("voucher")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = normalizeVoucherInput(code);

    if (!normalizedCode) {
      setError(t("Digite seu código para continuar."));
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: normalizedCode }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        mode?: "invite" | "discount" | "hybrid";
      };

      if (response.status === 401) {
        window.location.href = buildLoginPath(
          `/voucher/${encodeURIComponent(normalizedCode)}`
        );
        return;
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Voucher redemption failed");
      }

      if (data.mode === "discount") {
        setMessage(
          t("Desconto ativado. Escolha sua experiência e o checkout já abrirá com esse código.")
        );
        window.setTimeout(() => {
          document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
          router.refresh();
        }, 700);
        return;
      }

      setMessage(t("Acesso entregue. Seu universo já pode abrir a experiência vinculada."));
      window.setTimeout(() => {
        router.push("/meu-universo");
        router.refresh();
      }, 700);
    } catch (caught) {
      setError(getVoucherErrorMessage(caught, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="voucher"
      aria-labelledby="voucher-entry-title"
      className="mt-7 max-w-xl rounded-[24px] border border-[#f4d58d]/20 bg-[#f4d58d]/[0.055] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#f4d58d]/25 bg-[#1b1713] text-[#f4d58d]">
          <Ticket size={19} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
            {t("Tem um convite ou código?")}
          </p>
          <h2 id="voucher-entry-title" className="mt-1 text-lg font-semibold text-[#fff7e8]">
            {t("Abra um caminho preparado para você.")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#cdbfae]">
            {t("Cole seu voucher para liberar uma experiência ou ativar um desconto.")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="home-voucher-code" className="sr-only">
          {t("Convite ou código de desconto")}
        </label>
        <input
          id="home-voucher-code"
          data-testid="home-voucher-code"
          type="text"
          value={code}
          onChange={(event) => {
            setCode(normalizeVoucherInput(event.target.value));
            setError("");
            setMessage("");
          }}
          placeholder={t("Cole seu código aqui")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={80}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "home-voucher-error" : undefined}
          className="min-h-12 min-w-0 flex-1 rounded-full border border-white/15 bg-[#0d0b12]/75 px-4 text-sm font-medium tracking-[0.08em] text-[#fff7e8] outline-none transition placeholder:text-[#9c8e82] focus:border-[#f4d58d]/70 focus:ring-2 focus:ring-[#f4d58d]/20"
        />
        <button
          type="submit"
          data-testid="home-voucher-submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] transition hover:bg-[#ffe3a3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {loading ? t("Verificando...") : t("Ativar código")}
          {!loading ? <ArrowRight size={15} aria-hidden="true" /> : null}
        </button>
      </form>

      {message ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-[#bfd9cf] bg-[#edf7f2] px-4 py-3 text-sm leading-6 text-[#315d56]" role="status" aria-live="polite">
          <CheckCircle2 size={17} className="mt-1 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      ) : null}
      {error ? (
        <p id="home-voucher-error" className="mt-3 rounded-2xl border border-[#e2c4c2] bg-[#fff1f0] px-4 py-3 text-sm leading-6 text-[#8a4540]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
