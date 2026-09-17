import { redirect } from "next/navigation";
import { AstrologyBirthProfileCard } from "@/components/astrology/AstrologyBirthProfileCard";
import { AstrologyChartExperience } from "@/components/astrology/AstrologyChartExperience";
import { buildLoginPath } from "@/lib/auth/redirect";
import { normalizeLocale } from "@/lib/i18n/config";
import { readAstrologyBirthData } from "@/lib/astrology/birth-data";
import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

export default async function AstrologyPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect(buildLoginPath("/astrologia"));

  const locale = normalizeLocale(user.user_metadata?.locale ?? "pt-BR");
  const birthData = hasSupabaseConfig()
    ? await readAstrologyBirthData(getSupabaseAdmin(), user.id)
    : null;

  return birthData ? (
    <AstrologyChartExperience />
  ) : (
    <main className="min-h-screen bg-[#f7f0e5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/meu-universo" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
          ← {locale === "en" ? "Back to My Universe" : "Voltar para Meu Universo"}
        </a>
        <div className="mx-auto max-w-3xl py-14 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{locale === "en" ? "Your astrology entrance" : "A sua entrada na astrologia"}</p>
          <h1 className="brand-serif mt-5 text-5xl font-semibold leading-tight text-[#241b18] sm:text-6xl">{locale === "en" ? "First, let us find the sky you were born under." : "Primeiro, vamos encontrar o céu sob o qual você nasceu."}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6f615a]">{locale === "en" ? "Tell us the date, local time, and city shown in your birth record. We calculate the rest quietly, including historical daylight-saving rules." : "Conte a data, a hora local e a cidade que aparecem no seu registro de nascimento. Nós calculamos o restante em silêncio, inclusive as regras históricas do horário de verão."}</p>
        </div>
        <AstrologyBirthProfileCard locale={locale} redirectAfterSave="/astrologia" />
      </div>
    </main>
  );
}
