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

export const metadata = {
  title: "Meu Mapa Astral | Palavras do Universo",
  description: "Leia o seu mapa natal com contexto, clareza e uma linguagem simbólica acessível.",
};

export default async function AstrologyMapPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect(buildLoginPath("/astrologia/mapa"));

  const locale = normalizeLocale(user.user_metadata?.locale ?? "pt-BR");
  let birthData = null;
  let birthDataUnavailable = !hasSupabaseConfig();

  if (!birthDataUnavailable) {
    try {
      birthData = await readAstrologyBirthData(getSupabaseAdmin(), user.id);
    } catch (error) {
      console.error("Unable to load astrology birth data", error);
      birthDataUnavailable = true;
    }
  }

  if (birthData) {
    return <AstrologyChartExperience />;
  }

  if (birthDataUnavailable) {
    return (
      <main className="min-h-screen bg-[#f7f0e5] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{locale === "en" ? "Astrology is temporarily unavailable" : "A astrologia está temporariamente indisponível"}</p>
          <h1 className="brand-serif mt-5 text-4xl font-semibold leading-tight text-[#241b18] sm:text-5xl">{locale === "en" ? "We could not open your birth context." : "Não foi possível abrir o seu contexto de nascimento."}</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[#6f615a]">{locale === "en" ? "Nothing was changed. Please try again in a moment." : "Nada foi alterado. Tente novamente em instantes."}</p>
          <a href="/astrologia/mapa" className="mt-7 inline-flex items-center rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8]">{locale === "en" ? "Try again" : "Tentar novamente"}</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f0e5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/astrologia" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
          ← {locale === "en" ? "Astrology" : "Astrologia"}
        </a>
        <div className="mx-auto max-w-3xl py-14 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]">{locale === "en" ? "Your astrology entrance" : "A sua entrada no mapa"}</p>
          <h1 className="brand-serif mt-5 text-5xl font-semibold leading-tight text-[#241b18] sm:text-6xl">{locale === "en" ? "First, let us find the sky you were born under." : "Primeiro, vamos encontrar o céu sob o qual você nasceu."}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6f615a]">{locale === "en" ? "Tell us the date, local time, and city shown in your birth record. We calculate the rest quietly, including historical daylight-saving rules." : "Conte a data, a hora local e a cidade que aparecem no seu registro de nascimento. Nós calculamos o restante em silêncio, inclusive as regras históricas do horário de verão."}</p>
        </div>
        <AstrologyBirthProfileCard locale={locale} redirectAfterSave="/astrologia/mapa" />
      </div>
    </main>
  );
}
