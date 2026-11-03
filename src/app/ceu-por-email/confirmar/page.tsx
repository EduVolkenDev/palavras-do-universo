import Link from "next/link";
import { createHash } from "node:crypto";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "strict-origin" };
export default async function ConfirmSkyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[\w-]{32,64}$/.test(token);
  const { data } = valid && hasSupabaseConfig()
    ? await getSupabaseAdmin().from("daily_sky_email_subscriptions").select("locale,status,confirmation_expires_at")
      .eq("confirmation_token_hash", createHash("sha256").update(token).digest("hex")).maybeSingle()
    : { data: null };
  const ready = data?.status === "pending" && data.confirmation_expires_at && new Date(data.confirmation_expires_at) > new Date();
  const text = (pt: string, en: string) => data?.locale === "en" ? en : pt;
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", background: "#1c1b1d", color: "#f5ecdf" }}>
    <div style={{ width: "min(100%, 520px)", border: "1px solid #efd08b66", borderRadius: 24, padding: "2rem", background: "#292036" }}>
      <p>PALAVRAS DO UNIVERSO</p>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "2rem" }}>{text("Confirme seu céu por e-mail", "Confirm your sky by email")}</h1>
      <p style={{ lineHeight: 1.7 }}>{ready ? text("Confirme abaixo que deseja receber o boletim quando os envios começarem. Você poderá cancelar em qualquer mensagem.", "Confirm below that you want the newsletter when delivery begins. You can unsubscribe in any message.") : text("Este link expirou ou já foi utilizado.", "This link has expired or has already been used.")}</p>
      {ready && <form action={`/api/daily-sky-email/confirm?token=${encodeURIComponent(token!)}`} method="post">
        <button type="submit" style={{ minHeight: 44, padding: ".9rem 1.2rem", borderRadius: 24, background: "#efd08b", color: "#231b21", fontWeight: 700 }}>{text("Confirmar minha inscrição", "Confirm my subscription")}</button>
      </form>}
      <p><Link href="/ceu-por-email" style={{ color: "#efd08b" }}>{text("Voltar", "Back")}</Link></p>
    </div>
  </main>;
}
