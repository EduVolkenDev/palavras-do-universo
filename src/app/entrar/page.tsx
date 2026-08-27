"use client";

import { ArrowLeft, KeyRound, Loader2, Lock, Mail, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { buildAuthCallbackUrl, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { productCards, pricingPlans } from "@/lib/product/catalog";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";
import { PduAssetStory } from "@/components/PduAssetStory";

type AuthMode = "login" | "signup" | "forgot" | "reset-password";
type FormState = "idle" | "sending" | "sent" | "error" | "success";

const PASSWORD_MIN_LENGTH = 8;

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
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [product, setProduct] = useState<{ title: string; price: string; visual: string } | null>(null);
  const [readingHistoryReason, setReadingHistoryReason] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get("reason") === "reading-history";
      const mode = params.get("mode");
      setProduct(getProductFromNextParam());
      setReadingHistoryReason(reason);
      if (mode === "reset-password") setAuthMode("reset-password");
      else if (mode === "signup" || mode === "criar" || reason) setAuthMode("signup");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state !== "idle") return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const signedOut = params.get("signed_out") === "1";

      if (error === "link-invalido" || error === "missing-code") {
        setState("error");
        setMessage(
          locale === "en"
            ? "This confirmation or recovery link expired. Request a new one to continue."
            : "Este link de confirmação ou recuperação expirou. Peça um novo para continuar."
        );
        return;
      }

      if (signedOut) {
        setMessage(locale === "en" ? "You signed out safely." : "Você saiu da conta com segurança.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locale, state]);

  function getNextPath() {
    const requested = new URLSearchParams(window.location.search).get("next");
    return sanitizeAuthRedirect(requested);
  }

  function switchMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setState("idle");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  function validatePasswordPair() {
    if (password.length < PASSWORD_MIN_LENGTH) {
      setState("error");
      setMessage(
        locale === "en"
          ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
          : `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
      );
      return false;
    }
    if ((authMode === "signup" || authMode === "reset-password") && password !== confirmPassword) {
      setState("error");
      setMessage(
        locale === "en"
          ? "The passwords do not match."
          : "As senhas não conferem."
      );
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const cleanEmail = email.trim().toLowerCase();
    if (authMode !== "reset-password" && !cleanEmail.includes("@")) {
      setState("error");
      setMessage(isEn ? "Enter a valid email." : "Informe um e-mail válido.");
      return;
    }

    setState("sending");
    setMessage("");

    const nextPath = getNextPath();

    if (authMode === "forgot") {
      const recoveryNext = `/entrar?mode=reset-password&next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: buildAuthCallbackUrl(window.location.origin, recoveryNext),
      });

      if (error) {
        console.error("[auth] resetPasswordForEmail failed", {
          message: error.message,
          status: error.status,
        });
        setState("error");
        setMessage(
          locale === "en"
            ? "Could not send the recovery email. Check the address and try again."
            : "Não foi possível enviar a recuperação. Revise o e-mail e tente novamente."
        );
        return;
      }

      setState("sent");
      setMessage(
        locale === "en"
          ? "We sent a password recovery link. Open it once to define a new password."
          : "Enviamos um link de recuperação. Abra uma vez para definir uma nova senha."
      );
      return;
    }

    if (!validatePasswordPair()) return;

    if (authMode === "reset-password") {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error("[auth] updateUser password failed", {
          message: error.message,
          status: error.status,
        });
        setState("error");
        setMessage(
          locale === "en"
            ? "Could not update the password. Open a fresh recovery link and try again."
            : "Não foi possível atualizar a senha. Abra um link de recuperação novo e tente outra vez."
        );
        return;
      }

      setState("success");
      setMessage(locale === "en" ? "Password updated." : "Senha atualizada.");
      window.location.assign(nextPath);
      return;
    }

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(window.location.origin, nextPath),
        },
      });

      if (error) {
        console.error("[auth] signUp failed", {
          message: error.message,
          status: error.status,
        });
        setState("error");
        setMessage(
          locale === "en"
            ? "Could not create the account. Check the email and password and try again."
            : "Não foi possível criar a conta. Revise e-mail e senha e tente novamente."
        );
        return;
      }

      if (data.session) {
        setState("success");
        setMessage(locale === "en" ? "Account created." : "Conta criada.");
        window.location.assign(nextPath);
        return;
      }

      setState("sent");
      setMessage(
        readingHistoryReason
          ? locale === "en"
            ? "We sent the confirmation email. Confirm once to protect the reading saved here; after that, use your password on this page."
            : "Enviamos a confirmação. Confirme uma vez para proteger a tirada salva aqui; depois disso, use sua senha nesta página."
          : locale === "en"
            ? "We sent the confirmation email. Confirm once; after that, you can sign in here with your password."
            : "Enviamos a confirmação. Confirme uma vez; depois disso, você entra aqui com sua senha."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.error("[auth] signInWithPassword failed", {
        message: error.message,
        status: error.status,
      });
      setState("error");
      setMessage(
        locale === "en"
          ? "Could not sign in. Check the email and password."
          : "Não foi possível entrar. Revise e-mail e senha."
      );
      return;
    }

    setState("success");
    setMessage(locale === "en" ? "Signed in." : "Entrada confirmada.");
    window.location.assign(nextPath);
  }

  const isEn = locale === "en";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@palavrasdouniverso.com";
  const isSubmitting = state === "sending";
  const needsEmail = authMode !== "reset-password";
  const needsPassword = authMode !== "forgot";
  const needsConfirmPassword = authMode === "signup" || authMode === "reset-password";
  const modeTitle =
    authMode === "signup"
      ? isEn ? "Create your account." : "Crie sua conta."
      : authMode === "forgot"
        ? isEn ? "Recover access." : "Recupere o acesso."
        : authMode === "reset-password"
          ? isEn ? "Define a new password." : "Defina uma nova senha."
          : isEn ? "Enter your Universe." : "Entre no seu Universo.";
  const modeBody =
    authMode === "signup"
      ? isEn
        ? "Confirm your email once. After that, your password keeps the path open on this page."
        : "Confirme seu e-mail uma vez. Depois disso, sua senha mantém o caminho aberto nesta página."
      : authMode === "forgot"
        ? isEn
          ? "Enter your email and we will send a recovery link."
          : "Informe seu e-mail e enviaremos um link de recuperação."
        : authMode === "reset-password"
          ? isEn
            ? "Choose the password you want to use from now on."
            : "Escolha a senha que você quer usar daqui em diante."
        : locale === "en"
          ? "Use your email and password to return without waiting for a new link."
          : "Use seu e-mail e senha para voltar sem esperar por um novo link.";
  const submitLabel =
    authMode === "signup"
      ? isEn ? "Create account" : "Criar conta"
      : authMode === "forgot"
        ? isEn ? "Send recovery email" : "Enviar recuperação"
        : authMode === "reset-password"
          ? isEn ? "Save new password" : "Salvar nova senha"
          : isEn ? "Sign in" : "Entrar";

  return (
    <main className="ritual-texture min-h-screen px-4 py-12 text-[#241b18]">
      <section className="mx-auto w-full max-w-md rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-6 shadow-[0_24px_70px_rgba(66,48,31,0.16)] sm:p-8">
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
          {modeTitle}
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
                ? "Create your free account to protect the reading already saved on this device. After confirming once, you return here with your password."
                : "Crie sua conta grátis para proteger a tirada que já está salva neste dispositivo. Depois de confirmar uma vez, você volta aqui com sua senha."}
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
                  To unlock <strong>{product.title}</strong> ({product.price}), sign in or create your account first.
                </>
              ) : (
                <>
                  Para acessar <strong>{product.title}</strong> ({product.price}), entre ou crie sua conta primeiro.
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#6f615a]">
            {modeBody}
          </p>
        )}

        {authMode !== "forgot" && authMode !== "reset-password" ? (
          <div className="mt-7 grid grid-cols-2 rounded-lg border border-[#d8c3a6] bg-white/60 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                authMode === "login"
                  ? "bg-[#241b18] text-[#fff7e8]"
                  : "text-[#6f615a] hover:bg-white"
              }`}
            >
              <KeyRound size={15} />
              {isEn ? "Sign in" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                authMode === "signup"
                  ? "bg-[#241b18] text-[#fff7e8]"
                  : "text-[#6f615a] hover:bg-white"
              }`}
            >
              <UserPlus size={15} />
              {isEn ? "Create" : "Criar"}
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={authMode === "login" || authMode === "signup" ? "mt-5" : "mt-7"}>
          {needsEmail ? (
            <>
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
            </>
          ) : null}

          {needsPassword ? (
            <>
              <label htmlFor="password" className="mt-4 block text-sm font-semibold text-[#4d3c31]">
                {authMode === "reset-password"
                  ? isEn ? "New password" : "Nova senha"
                  : isEn ? "Password" : "Senha"}
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d8c3a6] bg-white px-3">
                <Lock size={17} className="text-[#8a786b]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isEn ? "At least 8 characters" : "Pelo menos 8 caracteres"}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                />
              </div>
            </>
          ) : null}

          {needsConfirmPassword ? (
            <>
              <label htmlFor="confirm-password" className="mt-4 block text-sm font-semibold text-[#4d3c31]">
                {isEn ? "Confirm password" : "Confirmar senha"}
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d8c3a6] bg-white px-3">
                <Lock size={17} className="text-[#8a786b]" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={isEn ? "Repeat your password" : "Repita sua senha"}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                />
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#241b18] px-4 py-3 text-sm font-semibold text-[#fff7e8] hover:bg-[#3a2c25] disabled:cursor-default disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
            {submitLabel}
          </button>
        </form>

        {authMode === "login" ? (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="mt-3 text-sm font-semibold text-[#5f462f] underline-offset-4 hover:underline"
          >
            {isEn ? "Forgot your password?" : "Esqueceu sua senha?"}
          </button>
        ) : authMode === "forgot" || authMode === "reset-password" ? (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-3 text-sm font-semibold text-[#5f462f] underline-offset-4 hover:underline"
          >
            {isEn ? "Back to sign in" : "Voltar para entrar"}
          </button>
        ) : null}

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
            ? "Your password stays with you. Confirmation and recovery links are used only when needed."
            : "Sua senha fica com você. Links de confirmação e recuperação só são usados quando necessário."}
          {" "}
          {isEn ? "Need help?" : "Precisa de ajuda?"}{" "}
          <a className="font-semibold text-[#5f462f] underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
      </section>
      <PduAssetStory {...PDU_ASSET_STORIES.auth} tone="light" />
    </main>
  );
}
