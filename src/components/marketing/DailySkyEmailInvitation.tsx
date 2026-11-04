import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export function DailySkyEmailInvitation({ locale }: { locale: Locale }) {
  const english = locale === "en";

  return (
    <aside
      aria-labelledby="daily-sky-invitation-title"
      className="mt-8 rounded-[26px] border border-[#d8c3a6] bg-[#fffaf2] p-5 sm:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#785a32]">
            <Mail size={16} aria-hidden="true" />
            {english ? "Sky by email" : "Céu por e-mail"}
          </p>
          <h2 id="daily-sky-invitation-title" className="brand-serif mt-2 text-2xl font-semibold leading-tight text-[#332720] sm:text-3xl">
            {english ? "Would you like the daily sky in your inbox?" : "Quer receber o céu do dia por e-mail?"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6f615a]">
            {english
              ? "Sign-ups are open for our upcoming newsletter. Choose to subscribe and confirm by email. You can unsubscribe at any time."
              : "As inscrições para o boletim estão abertas; os envios estão em preparação. Você escolhe se inscrever e confirma por e-mail. Pode cancelar quando quiser."}
          </p>
        </div>
        <Link
          href={`/ceu-por-email?lang=${locale}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8] transition hover:bg-[#443329] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#785a32] sm:self-auto"
        >
          {english ? "Explore the newsletter" : "Conhecer o boletim"}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
