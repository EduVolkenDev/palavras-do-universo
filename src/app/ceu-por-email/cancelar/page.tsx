import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "strict-origin" };
import Link from "next/link";

export default async function CancelSkyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; lang?: string }> }) {
  const { token, lang } = await searchParams;
  const valid = typeof token === "string" && /^[\w-]{32,64}$/.test(token);
  const en = lang === "en";
  const text = (pt: string, english: string) => en ? english : pt;
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", background: "#1c1b1d", color: "#f5ecdf" }}>
    <div style={{ width: "min(100%, 520px)", border: "1px solid #efd08b66", borderRadius: "24px", padding: "2rem", background: "#292036" }}>
      <p style={{ color: "#efd08b", letterSpacing: ".14em", fontSize: ".75rem" }}>{text("PALAVRAS DO UNIVERSO", "WORDS OF THE UNIVERSE")}</p>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "2.25rem", marginBlock: "1rem" }}>{text("Cancelar o céu diário", "Unsubscribe from the daily sky")}</h1>
      <p style={{ lineHeight: 1.7 }}>{text("Você não receberá novas notas do céu.", "You will stop receiving daily sky notes.")}</p>
      {valid ? <form action={`/api/daily-sky-email/unsubscribe?token=${encodeURIComponent(token)}`} method="post" style={{ marginTop: "1.5rem" }}>
        <button type="submit" style={{ border: 0, borderRadius: "999px", padding: ".9rem 1.2rem", background: "#efd08b", color: "#231b21", fontWeight: 700, cursor: "pointer" }}>{text("Confirmar cancelamento", "Confirm unsubscribe")}</button>
      </form> : <p style={{ marginTop: "1.5rem" }}>{text("Link inválido", "Invalid link")}</p>}
      <p style={{ marginTop: "1.5rem" }}><Link href="/" style={{ color: "#efd08b" }}>{text("Voltar", "Back")}</Link></p>
    </div>
  </main>;
}
