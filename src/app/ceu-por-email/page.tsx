import DailySkyEmailSignup from "@/components/marketing/DailySkyEmailSignup";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Céu por e-mail | Palavras do Universo", alternates: { canonical: "/ceu-por-email" } };

export default async function SkyEmailPage({ searchParams }: { searchParams: Promise<{ status?: string; lang?: string }> }) {
  const { status, lang } = await searchParams;
  const text = (pt: string, english: string) => lang === "en" ? english : pt;
  return <main style={{ minHeight: "100vh", paddingBlock: "clamp(2rem, 6vw, 5rem)", background: "#1c1b1d" }}>
    <div style={{ width: "min(1180px, calc(100% - 2rem))", margin: "0 auto" }}><Link href="/" style={{ color: "#efd08b", fontSize: ".9rem" }}>{text("← Palavras do Universo", "← Palavras do Universo")}</Link></div>
    <h1 style={{ color: "#f5ecdf", textAlign: "center", fontFamily: "Georgia,serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "2rem 1rem" }}>{text("Céu por e-mail", "Sky by email")}</h1>
    <DailySkyEmailSignup status={status} />
  </main>;
}
