"use client";

import { CheckCircle2, Loader2, Percent, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { buildLoginPath } from "@/lib/auth/redirect";
import { getVoucherErrorMessage } from "@/lib/vouchers/client";

export default function VoucherClaimCard({
  code,
  kind,
  userEmail,
  isAuthenticated,
}: {
  code: string;
  kind: "invite" | "discount" | "hybrid";
  userEmail: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRedeem() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        mode?: "invite" | "discount" | "hybrid";
        alreadyRedeemed?: boolean;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Voucher redemption failed");
      }

      if (data.mode === "discount") {
        setMessage(t("Desconto ativado. Escolha sua experiência e o checkout já abrirá com esse código."));
        window.setTimeout(() => {
          router.push("/#produtos");
          router.refresh();
        }, 700);
        return;
      }

      setMessage(
        data.alreadyRedeemed
          ? t("Esse acesso já estava no seu universo.")
          : t("Acesso entregue. Seu universo já pode abrir a experiência vinculada.")
      );
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

  const requiresLogin = !isAuthenticated && kind === "invite";
  const cta =
    requiresLogin
      ? t("Entrar para resgatar")
      : kind === "discount"
      ? t("Ativar desconto")
      : kind === "hybrid"
        ? t("Resgatar acesso e desconto")
        : t("Resgatar acesso");

  return (
    <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#5e5137] bg-[#1b1713] text-[#f4d58d]">
          {kind === "discount" ? <Percent size={18} /> : <Sparkles size={18} />}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#fff7e8]">{cta}</h2>
          <p className="mt-1 text-sm leading-6 text-[#cdbfae]">
            {isAuthenticated
              ? userEmail
              : kind === "discount"
                ? t("Você pode ativar agora e entrar depois para finalizar a compra.")
                : t("Esse resgate depende da conta que vai receber o acesso.")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (requiresLogin) {
            window.location.href = buildLoginPath(`/voucher/${encodeURIComponent(code)}`);
            return;
          }
          void handleRedeem();
        }}
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1b1713] disabled:cursor-default disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {loading ? t("Abrindo...") : cta}
      </button>

      {message ? (
        <p className="mt-4 rounded-2xl border border-[#bfd9cf] bg-[#edf7f2] px-4 py-3 text-sm text-[#315d56]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl border border-[#e2c4c2] bg-[#fff1f0] px-4 py-3 text-sm text-[#8a4540]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
