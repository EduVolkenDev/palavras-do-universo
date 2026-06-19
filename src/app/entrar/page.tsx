"use client";

import { ArrowLeft, Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FormState = "idle" | "sending" | "sent" | "error";

export default function EntrarPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setState("error");
      setMessage("A conexão com a conta ainda não está configurada.");
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
      setMessage("Não foi possível enviar o acesso. Revise o e-mail e tente novamente.");
      return;
    }

    setState("sent");
    setMessage("Enviamos um link seguro. Abra-o neste dispositivo para entrar.");
  }

  return (
    <main className="ritual-texture grid min-h-screen place-items-center px-4 py-12 text-[#241b18]">
      <section className="w-full max-w-md rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-6 shadow-[0_24px_70px_rgba(66,48,31,0.16)] sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f615a]"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <div className="mt-8 grid h-11 w-11 place-items-center rounded-lg bg-[#241b18] text-[#f4d58d]">
          <Sparkles size={20} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
          Sua conta
        </p>
        <h1 className="brand-serif mt-2 text-4xl font-semibold leading-none">
          Continue seu caminho.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6f615a]">
          Entre para proteger suas leituras, acessos e mensagens salvas em todos
          os seus dispositivos.
        </p>

        <form onSubmit={signIn} className="mt-7">
          <label htmlFor="email" className="text-sm font-semibold text-[#4d3c31]">
            Seu e-mail
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
              placeholder="voce@exemplo.com"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={state === "sending" || state === "sent"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#241b18] px-4 py-3 text-sm font-semibold text-[#fff7e8] hover:bg-[#3a2c25] disabled:cursor-default disabled:opacity-70"
          >
            {state === "sending" ? <Loader2 size={17} className="animate-spin" /> : null}
            {state === "sent" ? "Link enviado" : "Receber link de acesso"}
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
          Sem senha para lembrar. O link expira e só pode ser usado uma vez.
        </p>
      </section>
    </main>
  );
}
