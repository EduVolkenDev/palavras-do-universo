import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export function LegalPage(props: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { title: string; body: React.ReactNode }[];
}) {
  return (
    <main className="ritual-texture min-h-screen px-4 py-10 text-[#241b18] sm:px-6">
      <article className="mx-auto max-w-3xl rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-6 shadow-[0_24px_70px_rgba(66,48,31,0.12)] sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f615a]">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <Sparkles size={22} className="mt-10 text-[#8a6b3f]" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
          {props.eyebrow}
        </p>
        <h1 className="brand-serif mt-2 break-words text-4xl font-semibold leading-none sm:text-5xl">
          {props.title}
        </h1>
        <p className="mt-5 text-base leading-7 text-[#6f615a]">{props.intro}</p>
        <p className="mt-3 text-xs text-[#8a786b]">Atualizado em 13 de junho de 2026.</p>

        <div className="mt-10 space-y-8">
          {props.sections.map((section) => (
            <section key={section.title}>
              <h2 className="brand-serif text-2xl font-semibold">{section.title}</h2>
              <div className="mt-3 text-sm leading-7 text-[#5f5149]">{section.body}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
