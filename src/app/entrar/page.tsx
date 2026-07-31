"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { productCards, pricingPlans } from "@/lib/product/catalog";
import { PDU_ASSETS } from "@/lib/pdu-assets";

type FormState = "idle" | "sending" | "sent" | "error";

const RESEND_WAIT_SECONDS = 60;

const productVisuals: Record<string, string> = {
  mensagem_do_dia: PDU_ASSETS.products.messageOfTheDay,
  carta_do_dia: PDU_ASSETS.products.cardOfTheDayDisplay,
  clareza_urgente: PDU_ASSETS.products.urgentClarity,
  caminho_3_cartas: PDU_ASSETS.products.threeCardPath,
  sinais_do_amor: PDU_ASSETS.products.loveSignalsDisplay,
  energia_da_semana: PDU_ASSETS.products.weekEnergyDisplay,
  mapa_do_momento: PDU_ASSETS.products.momentMapDisplay,
  circulo_do_universo: PDU_ASSETS.ambient.mandala,
};

function getProductFromNextParam(): { title: string; price: string; visual: string } | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return null;

  // next looks like: /?product=clareza_urgente#produtos
  try {
    const inner = new URLSearchParams(next.split("?")[1]?.split("#")[0] ?? "");
    const key = inner.get("product");
    if (!key) return null;

    const fromCards = productCards.find((p) => p.productKey === key);
    if (fromCards?.price) {
      return {
        title: fromCards.title,
        price: fromCards.price,
        visual: productVisuals[key] ?? PDU_ASSETS.surfaces.account,
      };
    }

    const fromPlans = pricingPlans.find((p) => p.productKey === key);
    if (fromPlans) {
      return {
        title: fromPlans.title,
        price: `${fromPlans.price}/${fromPlans.cadence}`,
        visual: productVisuals[key] ?? PDU_ASSETS.surfaces.account,
      };
    }
  } catch {
    // ignore parse errors
  }

  return null;
}

export default function EntrarPage() {
  const { locale } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [product, setProduct] = useState<{ title: string; price: string; visual: string } | null>(null);
  const [readingHistoryReason, setReadingHistoryReason] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProduct(getProductFromNextParam());
      setReadingHistoryReason(
        new URLSearchParams(window.location.search).get("reason") ===
          "reading-history"
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!resendAvailableAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setState("error");
      setMessage(
        locale === "en"
          ? "Account connection is not configured yet."
          : "A conexão com a conta ainda não está configurada."
      );
      return;
    }

    setState("sending");
    setMessage("");

    const requested = new URLSearchParams(window.location.search).get("next");
    const nextPath =
      requested?.startsWith("/") && !requested.startsWith("//")
        ? requested
        : "/meu-universo";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      nextPath
    )}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setState("error");
      setMessage(
        locale === "en"
          ? "Could not send access link. Check the email and try again."
          : "Não foi possível enviar o acesso. Revise o e-mail e tente novamente."
      );
      return;
    }

    setState("sent");
    setResendAvailableAt(Date.now() + RESEND_WAIT_SECONDS * 1000);
    setMessage(
      locale === "en"
        ? "We sent a secure link. If it does not arrive, check spam or promotions before requesting a new one."
        : "Enviamos um link seguro. Se ele não chegar, confira spam ou promoções antes de pedir outro."
    );
  }

  const isEn = locale === "en";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@palavrasdouniverso.com";
  const resendSeconds = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0;
  const canResend = state === "sent" && resendSeconds === 0;

  return (
    <main className="ritual-texture grid min-h-screen place-items-center px-4 py-12 text-[#241b18]">
      <section className="w-full max-w-md rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-6 shadow-[0_24px_70px_rgba(66,48,31,0.16)] sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f615a]"
        >
          <ArrowLeft size={16} />
          {isEn ? "Back" : "Voltar"}
        </Link>

        <div className="mt-8 grid h-12 w-12 place-items-center rounded-lg border border-[#dfccb0] bg-white/70">
          <Image
            src={PDU_ASSETS.surfaces.account}
            alt={isEn ? "Palavras do Universo account" : "Conta Palavras do Universo"}
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
          {isEn ? "Your account" : "Sua conta"}
        </p>
        <h1 className="brand-serif mt-2 text-4xl font-semibold leading-none">
          {isEn ? "Continue your path." : "Continue seu caminho."}
        </h1>

        {readingHistoryReason ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#a9cdbf] bg-[#eef8f2] px-4 py-3">
            <Image
              src={PDU_ASSETS.surfaces.saved}
              alt=""
              width={22}
              height={22}
              className="mt-0.5 h-5 w-5 shrink-0 object-contain"
            />
            <p className="text-sm leading-6 text-[#315d56]">
              {isEn
                ? "Create your free account to protect the reading already saved on this device. After signing in, it will appear in My Universe."
                : "Crie sua conta grátis para proteger a tirada que já está salva neste dispositivo. Depois de entrar, ela aparecerá no Meu Universo."}
            </p>
          </div>
        ) : product ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#d4b896] bg-[#fdf3e3] px-4 py-3">
            <Image
              src={product.visual}
              alt=""
              width={28}
              height={28}
              className="mt-0.5 h-6 w-6 shrink-0 rounded object-cover"
            />
            <p className="text-sm leading-6 text-[#4d3c31]">
              {isEn ? (
                <>
                  To unlock <strong>{product.title}</strong> ({product.price}), sign in first — it only takes a second.
                </>
              ) : (
                <>
                  Para acessar <strong>{product.title}</strong> ({product.price}), entre primeiro — leva só um instante.
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#6f615a]">
            {isEn
              ? "Sign in to protect your readings, access, and saved messages across all your devices."
              : "Entre para proteger suas leituras, acessos e mensagens salvas em todos os seus dispositivos."}
          </p>
        )}

        <form onSubmit={signIn} className="mt-7">
          <label htmlFor="email" className="text-sm font-semibold text-[#4d3c31]">
            {isEn ? "Your email" : "Seu e-mail"}
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d8c3a6] bg-white px-3">
            <Mail size={17} className="text-[#8a786b]" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={isEn ? "you@example.com" : "voce@exemplo.com"}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={state === "sending" || (state === "sent" && !canResend)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#241b18] px-4 py-3 text-sm font-semibold text-[#fff7e8] hover:bg-[#3a2c25] disabled:cursor-default disabled:opacity-70"
          >
            {state === "sending" ? <Loader2 size={17} className="animate-spin" /> : null}
            {state === "sent" && !canResend
              ? isEn ? `Resend in ${resendSeconds}s` : `Reenviar em ${resendSeconds}s`
              : state === "sent" && canResend
                ? isEn ? "Send a new link" : "Enviar novo link"
              : readingHistoryReason
                ? isEn ? "Create free account" : "Criar conta grátis"
                : isEn ? "Receive access link" : "Receber link de acesso"}
          </button>
        </form>

        {message ? (
          <p
            className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
              state === "error"
                ? "border-[#d9aaa8] bg-[#fff1f0] text-[#7b3330]"
                : "border-[#a9cdbf] bg-[#eef8f2] text-[#315d56]"
            }`}
          >
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-xs leading-5 text-[#8a786b]">
          {isEn
            ? "No password to remember. The link expires and can only be used once."
            : "Sem senha para lembrar. O link expira e só pode ser usado uma vez."}
          {" "}
          {isEn ? "Still no email?" : "Ainda não chegou?"}{" "}
          <a className="font-semibold text-[#5f462f] underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
      </section>
    </main>
  );
}
