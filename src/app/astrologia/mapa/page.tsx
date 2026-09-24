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

const MAP_QUERY_KEYS = new Set([
  "product",
  "currency",
  "campaign",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "checkout",
  "session_id",
]);

function buildCurrentMapPath(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (!MAP_QUERY_KEYS.has(key) || typeof value !== "string" || !value || value.length > 200) continue;
    query.set(key, value);
  }
  return `/astrologia/mapa${query.size ? `?${query.toString()}` : ""}`;
}

export default async function AstrologyMapPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mapPath = buildCurrentMapPath(await searchParams);
  const user = await getAuthenticatedUser();
  if (!user) redirect(buildLoginPath(mapPath));

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
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6f615a]">{locale === "en" ? "Tell us the date, city, and—if you know it—the local time shown in your birth record. You can continue without guessing a time; rising sign and houses will wait until you add it." : "Conte a data, a cidade e, se souber, a hora local do seu registro de nascimento. Você pode continuar sem inventar um horário; Ascendente e casas ficam reservados até você adicionar essa informação."}</p>
        </div>
        <AstrologyBirthProfileCard locale={locale} redirectAfterSave={mapPath} />
      </div>
    </main>
  );
}
