import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NumerosDetail } from "@/components/numeros/NumerosDetail";
import { codes, getCode, say } from "@/lib/numeros/codes";

export function generateStaticParams() {
  return codes.map((code) => ({ slug: code.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const code = getCode(slug);
  if (!code) return { title: "Código | Números de intenção" };
  return {
    title: `${say("pt", code.title)} | Números de intenção`,
    description: say("pt", code.line),
    alternates: { canonical: `/numeros/${code.slug}` },
  };
}

export default async function NumeroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const code = getCode(slug);
  if (!code) notFound();
  return <NumerosDetail code={code} />;
}
