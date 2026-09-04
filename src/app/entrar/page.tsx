"use client";

import { ArrowLeft, KeyRound, Loader2, Lock, Mail, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { buildAuthCallbackUrl, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getProductCardPrice,
  getPricingPlanPrice,
  productCards,
  pricingPlans,
} from "@/lib/product/catalog";
import { resolveProductCurrency } from "@/lib/product/pricing";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";
import { PduAssetStory } from "@/components/PduAssetStory";

type AuthMode =
  | "login"
  | "signup"
  | "forgot"
  | "verify-email"
  | "verify-recovery"
  | "reset-password";
type FormState = "idle" | "sending" | "sent" | "error" | "success";

const PASSWORD_MIN_LENGTH = 8;

type AuthErrorContext =
  | "signup"
  | "signin"
  | "recovery"
  | "reset"
  | "resend"
  | "verify";
type AuthFailureKind =
  | "existing-account"
  | "rate-limit"
  | "confirmation-delivery"
  | "email-delivery"
  | "signup-disabled"
  | "invalid-email"
  | "weak-password"
  | "redirect"
  | "generic";

function getAuthFailure(
  error: unknown,
  isEn: boolean,
  context: AuthErrorContext
): { kind: AuthFailureKind; message: string } {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";
  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  const status = typeof record.status === "number" ? record.status : 0;
  const signal = `${code} ${message}`;

  if (
    context === "signup" &&
    /(email_exists|user_already_exists|already registered|already exists)/.test(signal)
  ) {
    return {
      kind: "existing-account",
      message: isEn
        ? "This email already has an account. Sign in with your password, or recover access if you do not remember it."
        : "Este e-mail já tem uma conta. Entre com sua senha ou recupere o acesso se não lembrar.",
    };
  }

  if (
    status === 429 ||
    /(rate.?limit|too many requests|too many attempts|over_email_send_rate_limit)/.test(signal)
  ) {
    return {
      kind: "rate-limit",
      message: isEn
        ? "There were too many attempts. Wait a few minutes before trying again, then check your inbox and spam folder."
        : "Houve muitas tentativas. Aguarde alguns minutos antes de tentar de novo e confira também entrada e spam.",
    };
  }

  if (
    context === "signup" &&
    /(signup_disabled|email_provider_disabled|sign.?ups? (are )?disabled)/.test(signal)
  ) {
    return {
      kind: "signup-disabled",
      message: isEn
        ? "Email signup is temporarily unavailable. Please try again later."
        : "O cadastro por e-mail está temporariamente indisponível. Tente novamente mais tarde.",
    };
  }

  if (
    context === "signup" &&
    /(error sending.*(confirmation|email)|confirmation.*(send|deliver)|smtp|mailer)/.test(signal)
  ) {
    return {
      kind: "confirmation-delivery",
      message: isEn
        ? "We could not send the confirmation email right now. Wait a few minutes and try again; if the account was already created, use Recover access."
        : "Não conseguimos enviar o e-mail de confirmação agora. Aguarde alguns minutos e tente novamente; se a conta já tiver sido criada, use Recuperar acesso.",
    };
  }

  if (
    (context === "recovery" || context === "resend") &&
    /(could not send email|error sending.*email|not yet activated|smtp|gomail|mailer|unexpected_failure)/.test(signal)
  ) {
    return {
      kind: "email-delivery",
      message: isEn
        ? "The email service is temporarily unavailable. Try again later or contact support if you need access now."
        : "O serviço de e-mail está temporariamente indisponível. Tente novamente mais tarde ou fale com o suporte se precisar recuperar o acesso agora.",
    };
  }

  if (
    (context === "signup" || context === "reset") &&
    /(weak_password|password.*(weak|strength)|password should|password must)/.test(signal)
  ) {
    return {
      kind: "weak-password",
      message: isEn
        ? "Choose a stronger password with at least 8 characters."
        : "Escolha uma senha mais forte com pelo menos 8 caracteres.",
    };
  }

  if (
    context === "verify" &&
    /(invalid|expired|token|otp|verification|code)/.test(signal)
  ) {
    return {
      kind: "generic",
      message: isEn
        ? "That code is invalid or expired. Check the latest email and try again, or request a new code."
        : "Esse código é inválido ou expirou. Confira o e-mail mais recente ou peça um novo código.",
    };
  }

  if (/(email_address_invalid|invalid email|email.*valid|validation_failed)/.test(signal)) {
    return {
      kind: "invalid-email",
      message: isEn
        ? "Check the email address and try again."
        : "Confira o endereço de e-mail e tente novamente.",
    };
  }

  if (/(redirect|allow.?list|site.?url)/.test(signal)) {
    return {
      kind: "redirect",
      message: isEn
        ? "The account request reached the service, but its confirmation path needs attention. Try again later or contact support."
        : "A solicitação chegou ao serviço, mas o caminho de confirmação precisa de atenção. Tente novamente mais tarde ou fale com o suporte.",
    };
  }

  const messages: Record<AuthErrorContext, string> = {
    signup: isEn
      ? "We could not create the account right now. Check the fields and try again."
      : "Não conseguimos criar a conta agora. Confira os campos e tente novamente.",
    signin: isEn
      ? "Could not sign in. Check the email and password, or recover access."
      : "Não foi possível entrar. Revise e-mail e senha ou recupere o acesso.",
    recovery: isEn
      ? "Could not send the recovery email. Check the address and try again."
      : "Não foi possível enviar a recuperação. Revise o e-mail e tente novamente.",
    reset: isEn
      ? "Could not update the password. Open a fresh recovery link and try again."
      : "Não foi possível atualizar a senha. Abra um link de recuperação novo e tente outra vez.",
    resend: isEn
      ? "Could not resend the confirmation email. Check the address and try again."
      : "Não foi possível reenviar a confirmação. Revise o endereço e tente novamente.",
    verify: isEn
      ? "We could not confirm that code. Check the latest email and try again."
      : "Não foi possível confirmar esse código. Confira o e-mail mais recente e tente novamente.",
  };

  return { kind: "generic", message: messages[context] };
}

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

function getProductFromNextParam(
  locale: string
): { title: string; price: string; visual: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (!next) return null;

  // next looks like: /?product=clareza_urgente#produtos
  try {
    const inner = new URLSearchParams(next.split("?")[1]?.split("#")[0] ?? "");
    const key = inner.get("product");
    if (!key) return null;
    const productCurrency = resolveProductCurrency({
      currency: inner.get("currency") ?? params.get("currency"),
      locale,
    });

    const fromCards = productCards.find((p) => p.productKey === key);
    const cardPrice = fromCards ? getProductCardPrice(fromCards, productCurrency) : "";
    if (fromCards && cardPrice) {
      return {
        title: fromCards.title,
        price: cardPrice,
        visual: productVisuals[key] ?? PDU_ASSETS.surfaces.account,
      };
    }

    const fromPlans = pricingPlans.find((p) => p.productKey === key);
    if (fromPlans) {
      return {
        title: fromPlans.title,
        price: `${getPricingPlanPrice(fromPlans, productCurrency)}/${fromPlans.cadence}`,
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
  const [otpCode, setOtpCode] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [lastConfirmationEmail, setLastConfirmationEmail] = useState("");
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [existingAccountHint, setExistingAccountHint] = useState(false);
  const [resendState, setResendState] = useState<FormState>("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [product, setProduct] = useState<{ title: string; price: string; visual: string } | null>(null);
  const [readingHistoryReason, setReadingHistoryReason] = useState(false);
  const isEn = locale === "en";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get("reason") === "reading-history";
      const mode = params.get("mode");
      setProduct(getProductFromNextParam(locale));
      setReadingHistoryReason(reason);
      if (mode === "reset-password") setAuthMode("reset-password");
      else if (mode === "forgot") setAuthMode("forgot");
      else if (mode === "signup" || mode === "criar" || reason) setAuthMode("signup");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [locale]);

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
    setOtpCode("");
    setLastConfirmationEmail("");
    setCanResendConfirmation(false);
    setExistingAccountHint(false);
    setResendState("idle");
    setResendMessage("");
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

  function validateOtpCode() {
    if (!/^\d{6,8}$/.test(otpCode)) {
      setState("error");
      setMessage(
        locale === "en"
          ? "Enter the complete verification code from the latest email."
          : "Digite o código completo de verificação do e-mail mais recente."
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
    const isOtpVerification =
      authMode === "verify-email" || authMode === "verify-recovery";
    setCanResendConfirmation(isOtpVerification);
    setExistingAccountHint(false);
    setResendState("idle");
    setResendMessage("");

    const nextPath = getNextPath();

    if (authMode === "forgot") {
      const recoveryNext = `/entrar?mode=reset-password&next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: buildAuthCallbackUrl(window.location.origin, recoveryNext),
      });

      if (error) {
        console.error("[auth] resetPasswordForEmail failed", {
          message: error.message,
          code: error.code,
          status: error.status,
        });
        setState("error");
        setMessage(getAuthFailure(error, isEn, "recovery").message);
        return;
      }

      setAuthMode("verify-recovery");
      setEmail(cleanEmail);
      setOtpCode("");
      setLastConfirmationEmail(cleanEmail);
      setCanResendConfirmation(true);
      setState("sent");
      setMessage(
        locale === "en"
          ? "We sent a recovery code. Enter it here to choose a new password."
          : "Enviamos um código de recuperação. Digite-o aqui para escolher uma nova senha."
      );
      return;
    }

    if (isOtpVerification) {
      if (!validateOtpCode()) return;

      const verificationType =
        authMode === "verify-recovery" ? "recovery" : "email";
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpCode,
        type: verificationType,
      });

      if (error) {
        console.error("[auth] verifyOtp failed", {
          message: error.message,
          code: error.code,
          status: error.status,
          type: verificationType,
        });
        setState("error");
        setCanResendConfirmation(true);
        setMessage(getAuthFailure(error, isEn, "verify").message);
        return;
      }

      setOtpCode("");
      setCanResendConfirmation(false);

      if (authMode === "verify-recovery") {
        setAuthMode("reset-password");
        setState("idle");
        setMessage(
          locale === "en"
            ? "Email confirmed. Choose your new password below."
            : "E-mail confirmado. Escolha sua nova senha abaixo."
        );
        return;
      }

      if (!data.session) {
        setAuthMode("login");
        setState("success");
        setMessage(
          locale === "en"
            ? "Email confirmed. Sign in with the password you created."
            : "E-mail confirmado. Entre com a senha que você criou."
        );
        return;
      }

      setState("success");
      setMessage(locale === "en" ? "Email confirmed." : "E-mail confirmado.");
      window.location.assign(nextPath);
      return;
    }

    if (!validatePasswordPair()) return;

    if (authMode === "reset-password") {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error("[auth] updateUser password failed", {
          message: error.message,
          code: error.code,
          status: error.status,
        });
        setState("error");
        setMessage(getAuthFailure(error, isEn, "reset").message);
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
        const failure = getAuthFailure(error, isEn, "signup");
        console.error("[auth] signUp failed", {
          message: error.message,
          code: error.code,
          status: error.status,
        });
        if (failure.kind === "existing-account") {
          setState("sent");
          setExistingAccountHint(true);
          setCanResendConfirmation(false);
          setLastConfirmationEmail(cleanEmail);
        } else {
          setState("error");
        }
        setMessage(failure.message);
        return;
      }

      if (data.session) {
        setState("success");
        setMessage(locale === "en" ? "Account created." : "Conta criada.");
        window.location.assign(nextPath);
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setState("sent");
        setExistingAccountHint(true);
        setCanResendConfirmation(false);
        setLastConfirmationEmail(cleanEmail);
        setMessage(
          locale === "en"
            ? "This email may already have an account. Use your password to sign in, or recover access if you do not remember it."
            : "Este e-mail pode já ter uma conta. Entre com sua senha ou recupere o acesso se não lembrar."
        );
        return;
      }

      setState("sent");
      setAuthMode("verify-email");
      setLastConfirmationEmail(cleanEmail);
      setOtpCode("");
      setCanResendConfirmation(true);
      setMessage(
        readingHistoryReason
          ? locale === "en"
            ? "We sent a confirmation code. Enter it here to protect the reading saved on this device; after that, use your password on this page."
            : "Enviamos um código de confirmação. Digite-o aqui para proteger a tirada salva neste dispositivo; depois disso, use sua senha nesta página."
          : locale === "en"
            ? "We sent a confirmation code. Enter it here once; after that, you can sign in with your password."
            : "Enviamos um código de confirmação. Digite-o aqui uma vez; depois disso, você entra com sua senha."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      const failure = getAuthFailure(error, isEn, "signin");
      console.error("[auth] signInWithPassword failed", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      setState("error");
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setState("sent");
        setAuthMode("verify-email");
        setLastConfirmationEmail(cleanEmail);
        setOtpCode("");
        setCanResendConfirmation(true);
        setMessage(
          locale === "en"
            ? "This account still needs email confirmation. Resend the code, enter it here, and then sign in with your password."
            : "Esta conta ainda precisa de confirmação por e-mail. Reenvie o código, digite-o aqui e depois entre com sua senha."
        );
      } else {
        setMessage(failure.message);
      }
      return;
    }

    setState("success");
    setMessage(locale === "en" ? "Signed in." : "Entrada confirmada.");
    window.location.assign(nextPath);
  }

  async function handleResendConfirmation() {
    const supabase = getSupabaseBrowserClient();
    const cleanEmail = (lastConfirmationEmail || email).trim().toLowerCase();

    if (!supabase || !cleanEmail.includes("@")) {
      setResendState("error");
      setResendMessage(
        isEn
          ? "Enter the account email again before resending."
          : "Informe novamente o e-mail da conta antes de reenviar."
      );
      return;
    }

    setResendState("sending");
    setResendMessage("");

    const isRecovery = authMode === "verify-recovery";
    const { error } = isRecovery
      ? await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: buildAuthCallbackUrl(
            window.location.origin,
            `/entrar?mode=reset-password&next=${encodeURIComponent(getNextPath())}`
          ),
        })
      : await supabase.auth.resend({
          type: "signup",
          email: cleanEmail,
          options: {
            emailRedirectTo: buildAuthCallbackUrl(window.location.origin, getNextPath()),
          },
        });

    if (error) {
      const failure = getAuthFailure(error, isEn, "resend");
      console.error("[auth] resend confirmation failed", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      setResendState("error");
      setResendMessage(failure.message);
      return;
    }

    setLastConfirmationEmail(cleanEmail);
    setEmail(cleanEmail);
    setOtpCode("");
    setCanResendConfirmation(true);
    setExistingAccountHint(false);
    setAuthMode(isRecovery ? "verify-recovery" : "verify-email");
    setResendState("sent");
    setResendMessage(
      isEn
        ? `${isRecovery ? "Recovery code" : "Confirmation code"} resent. Check inbox, spam, and promotions.`
        : `${isRecovery ? "Código de recuperação" : "Código de confirmação"} reenviado. Confira entrada, spam e promoções.`
    );
  }

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@palavrasdouniverso.com";
  const isSubmitting = state === "sending";
  const isResending = resendState === "sending";
  const isOtpMode = authMode === "verify-email" || authMode === "verify-recovery";
  const needsEmail = authMode !== "reset-password";
  const needsPassword = authMode !== "forgot" && !isOtpMode;
  const needsConfirmPassword = authMode === "signup" || authMode === "reset-password";
  const modeTitle =
    authMode === "signup"
      ? isEn ? "Create your account." : "Crie sua conta."
      : authMode === "forgot"
        ? isEn ? "Recover access." : "Recupere o acesso."
        : authMode === "verify-email"
          ? isEn ? "Confirm your email." : "Confirme seu e-mail."
          : authMode === "verify-recovery"
            ? isEn ? "Confirm recovery." : "Confirme a recuperação."
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
          ? "Enter your email and we will send a recovery code."
          : "Informe seu e-mail e enviaremos um código de recuperação."
        : authMode === "verify-email"
          ? isEn
            ? "Enter the code from the latest email to confirm your account."
            : "Digite o código do e-mail mais recente para confirmar sua conta."
        : authMode === "verify-recovery"
          ? isEn
            ? "Enter the code from the latest email to continue recovering access."
            : "Digite o código do e-mail mais recente para continuar recuperando o acesso."
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
        ? isEn ? "Send recovery code" : "Enviar código"
        : isOtpMode
          ? isEn ? "Confirm code" : "Confirmar código"
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

        {authMode === "login" || authMode === "signup" ? (
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

          {isOtpMode ? (
            <>
              <label htmlFor="otp-code" className="mt-4 block text-sm font-semibold text-[#4d3c31]">
                {isEn ? "Verification code" : "Código de verificação"}
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d8c3a6] bg-white px-3">
                <KeyRound size={17} className="text-[#8a786b]" />
                <input
                  id="otp-code"
                  name="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  maxLength={8}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder={isEn ? "Enter the code" : "Digite o código"}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm tracking-[0.18em] outline-none"
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
        ) : authMode === "forgot" || authMode === "verify-email" || authMode === "verify-recovery" || authMode === "reset-password" ? (
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

        {state === "sent" && existingAccountHint ? (
          <div className="mt-4 rounded-lg border border-[#d8c3a6] bg-[#fffaf2] p-4">
            <p className="text-sm leading-6 text-[#6f615a]">
              {isEn
                ? "For an existing account, no new confirmation email is sent. Sign in with the password you created or recover access now."
                : "Para uma conta já existente, nenhum novo e-mail de confirmação é enviado. Entre com a senha criada ou recupere o acesso agora."}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#241b18] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] hover:bg-[#3a2c25]"
              >
                <KeyRound size={16} />
                {isEn ? "Sign in" : "Entrar com senha"}
              </button>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#8a6b3f] px-4 py-2.5 text-sm font-semibold text-[#5f462f] hover:bg-[#f6ead6]"
              >
                <Mail size={16} />
                {isEn ? "Recover access" : "Recuperar acesso"}
              </button>
            </div>
          </div>
        ) : null}

        {(state === "sent" || (isOtpMode && state === "error")) && canResendConfirmation ? (
          <div className="mt-4 rounded-lg border border-[#dfccb0] bg-white/70 p-4">
            <p className="text-sm leading-6 text-[#6f615a]">
              {isOtpMode
                ? isEn
                  ? "Use the latest code. If needed, request another one and check spam and promotions."
                  : "Use o código mais recente. Se necessário, peça outro e confira também spam e promoções."
                : isEn
                  ? "If it does not arrive in a minute, resend the confirmation. Also check spam and promotions."
                  : "Se não chegar em um minuto, reenvie a confirmação. Confira também spam e promoções."}
            </p>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isResending}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#8a6b3f] px-4 py-2.5 text-sm font-semibold text-[#5f462f] hover:bg-[#f6ead6] disabled:cursor-default disabled:opacity-70"
            >
              {isResending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {isOtpMode
                ? isEn
                  ? "Resend code"
                  : "Reenviar código"
                : isEn
                  ? "Resend confirmation"
                  : "Reenviar confirmação"}
            </button>
            {resendMessage ? (
              <p
                className={`mt-3 text-sm leading-6 ${
                  resendState === "error" ? "text-[#7b3330]" : "text-[#315d56]"
                }`}
              >
                {resendMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-6 text-xs leading-5 text-[#8a786b]">
          {isEn
            ? "Your password stays with you. Confirmation and recovery codes are used only when needed."
            : "Sua senha fica com você. Códigos de confirmação e recuperação só são usados quando necessário."}
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
