"use client";

import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { usePasskeySupport } from "@/lib/auth/passkeys";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type PasskeyState = "idle" | "working" | "success" | "error";

function getPasskeyErrorMessage(error: unknown, isEnglish: boolean) {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const signal = `${record.code ?? ""} ${record.message ?? ""}`.toLowerCase();

  if (/(rp.?id|origin|securityerror|invalid_domain)/.test(signal)) {
    return isEnglish
      ? "Open palavrasdouniverso.com to save your access key. It must be registered on the website's own domain."
      : "Abra palavrasdouniverso.com para salvar sua chave de acesso. Ela precisa ser registrada no domínio do próprio site.";
  }

  if (signal.includes("passkey_disabled")) {
    return isEnglish
      ? "Access keys are not enabled for this account yet. Keep using your email and password for now."
      : "As chaves de acesso ainda não estão habilitadas para esta conta. Por enquanto, continue usando e-mail e senha.";
  }

  if (/(not.?allowed|cancel|abort|ceremony_aborted)/.test(signal)) {
    return isEnglish
      ? "The device request was cancelled. You can try again whenever you are ready."
      : "A confirmação no dispositivo foi cancelada. Você pode tentar de novo quando quiser.";
  }

  if (/(not.?supported|webauthn|credential)/.test(signal)) {
    return isEnglish
      ? "This browser could not use an access key. Try an updated browser or another device."
      : "Este navegador não conseguiu usar uma chave de acesso. Tente um navegador atualizado ou outro dispositivo.";
  }

  return isEnglish
    ? "We could not save the access key right now. Your password access remains available."
    : "Não foi possível salvar a chave de acesso agora. Seu acesso por senha continua disponível.";
}

export function PasskeySettingsCard({ locale }: { locale: string }) {
  const isEnglish = locale === "en";
  const supported = usePasskeySupport();
  const [state, setState] = useState<PasskeyState>("idle");
  const [message, setMessage] = useState("");
  const productionDomain = supported && typeof window !== "undefined" &&
    (window.location.hostname === "palavrasdouniverso.com" ||
      window.location.hostname.endsWith(".palavrasdouniverso.com"));

  async function registerPasskey() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !supported) {
      setState("error");
      setMessage(
        isEnglish
          ? "This browser is not ready to create an access key."
          : "Este navegador não está pronto para criar uma chave de acesso."
      );
      return;
    }

    setState("working");
    setMessage("");

    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) {
        setState("error");
        setMessage(getPasskeyErrorMessage(error, isEnglish));
        return;
      }

      setState("success");
      setMessage(
        isEnglish
          ? "Access key saved. Next time, you can enter with Face ID, Touch ID, your device PIN, or your security key."
          : "Chave de acesso salva. Da próxima vez, você pode entrar com Face ID, Touch ID, PIN do dispositivo ou chave de segurança."
      );
    } catch (error) {
      setState("error");
      setMessage(getPasskeyErrorMessage(error, isEnglish));
    }
  }

  return (
    <section
      aria-labelledby="passkey-settings-title"
      className="mt-5 rounded-2xl border border-[#f4d58d]/24 bg-black/[0.14] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#f4d58d]/25 bg-[#f4d58d]/10 text-[#f5d896]">
          <KeyRound size={18} aria-hidden />
        </span>
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
            {isEnglish ? "Access key" : "Chave de acesso"}
          </p>
          <h3 id="passkey-settings-title" className="mt-1 text-base font-semibold text-[#fff7e8]">
            {isEnglish ? "Enter without typing your password." : "Entre sem digitar sua senha."}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#d8ccc0]">
            {isEnglish
              ? "Save an access key on this device or password manager. Your email and password keep working as a backup."
              : "Salve uma chave de acesso neste dispositivo ou gerenciador de senhas. Seu e-mail e senha continuam funcionando como alternativa."}
          </p>
        </div>
      </div>

      {supported && !productionDomain ? (
        <p className="mt-4 rounded-xl border border-[#f4d58d]/25 bg-[#f4d58d]/10 px-3 py-2 text-sm leading-6 text-[#d8ccc0]">
          {isEnglish
            ? "Access keys are registered on the official website. Open it and sign in to save yours."
            : "As chaves de acesso são registradas no site oficial. Abra o site e entre na sua conta para salvar a sua."}
          {" "}
          <a href="https://palavrasdouniverso.com/meu-universo" className="font-semibold text-[#f5d896] underline underline-offset-4">
            {isEnglish ? "Open Palavras do Universo" : "Abrir Palavras do Universo"}
          </a>
        </p>
      ) : supported === false ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm leading-6 text-[#d8ccc0]">
          {isEnglish
            ? "This browser does not support access keys yet."
            : "Este navegador ainda não oferece suporte a chaves de acesso."}
        </p>
      ) : (
        <button
          type="button"
          onClick={registerPasskey}
          disabled={state === "working"}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f4d58d] px-4 py-3 text-sm font-semibold text-[#241b18] transition hover:bg-[#f8e4b1] disabled:cursor-default disabled:opacity-60"
        >
          {state === "working" ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          {state === "working"
            ? isEnglish ? "Waiting for your device..." : "Aguardando seu dispositivo..."
            : isEnglish ? "Save access key on this device" : "Salvar chave de acesso neste dispositivo"}
        </button>
      )}

      {message ? (
        <p
          role={state === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-3 py-2 text-sm leading-6 ${
            state === "error"
              ? "border-[#c97772]/50 bg-[#5b2828]/25 text-[#f7c3be]"
              : "border-[#a7d7c5]/35 bg-[#a7d7c5]/10 text-[#d7f1df]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
