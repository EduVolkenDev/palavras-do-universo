"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Compass,
  MoonStar,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SaveDailyCardButton } from "@/components/SaveDailyCardButton";
import { useI18n } from "@/components/I18nProvider";

type DailyCard = {
  today: {
    key: string;
    label: string;
  };
  openingKey: string;
  card: {
    key: string;
    name: string;
    reversed: boolean;
    assetPath: string;
    keywords: string[];
  };
  reading: {
    keyword: string;
    meaning: string;
    counsel: string;
    reflection_prompt: string;
    ritual: string;
  };
  daily_context: {
    source: "carta_do_dia";
    suggested_focus: string;
    energy: string;
  };
};

type DailyCardResponse = {
  ok: true;
  daily: DailyCard;
};

function isDailyCardResponse(value: unknown): value is DailyCardResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    "daily" in value
  );
}

export function DailyCardExperience() {
  const { locale } = useI18n();
  const [daily, setDaily] = useState<DailyCard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams({ tz: timeZone, locale });

    fetch(`/api/daily-card?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("daily_card_unavailable");
        return response.json() as Promise<unknown>;
      })
      .then((data) => {
        if (!isDailyCardResponse(data)) throw new Error("invalid_daily_card");
        setDaily(data.daily);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(
          "O portal não conseguiu abrir a carta agora. Tente novamente em instantes."
        );
      });

    return () => controller.abort();
  }, [locale]);

  const dailyPayload = daily
    ? {
        date_key: daily.today.key,
        date_label: daily.today.label,
        opening_key: daily.openingKey,
        card: {
          key: daily.card.key,
          name: daily.card.name,
          reversed: daily.card.reversed,
          asset_path: daily.card.assetPath,
          keywords: daily.card.keywords,
        },
        reading: daily.reading,
        daily_context: daily.daily_context,
      }
    : null;

  return (
    <main className="pdu-home min-h-screen text-[#f8efe2]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09080d]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-[#efe2d2] hover:border-[#f4d58d]/45"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>

          <Link
            href="/baralho"
            className="hidden items-center gap-2 text-sm font-semibold text-[#cfc4b9] hover:text-white sm:inline-flex"
          >
            Ver baralho
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="relative px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="pdu-veil" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/25 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-normal text-[#f5d896]">
              <MoonStar size={14} />
              Carta do Dia
            </p>

            <h1 className="brand-serif max-w-4xl text-4xl font-semibold leading-[0.98] text-[#fff7e8] sm:text-6xl lg:text-7xl">
              Uma imagem para escutar melhor o seu momento.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#d8ccc0]">
              A carta de hoje não decide por você. Ela abre uma pausa simbólica
              para observar energia, direção e cuidado possível nas próximas
              horas.
            </p>

            {error ? (
              <p className="mt-6 rounded-[8px] border border-[#d9aaa8]/40 bg-[#4b1717]/36 p-4 text-sm leading-6 text-[#ffd8d5]">
                {error}
              </p>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Abertura",
                  value: daily?.today.label ?? "Abrindo o portal...",
                  icon: CalendarDays,
                },
                {
                  label: "Posição da carta",
                  value: daily
                    ? daily.card.reversed
                      ? "Reversa"
                      : "Direta"
                    : "...",
                  icon: Compass,
                },
                {
                  label: "Palavra do dia",
                  value: daily?.card.keywords[0] ?? "...",
                  icon: Sparkles,
                },
              ].map((item) => (
                <div key={item.label} className="pdu-micro-field">
                  <item.icon size={18} className="text-[#f5d896]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-[#9f958d]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#fff7e8]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {dailyPayload ? <SaveDailyCardButton payload={dailyPayload} /> : null}
              <Link
                href="/baralho"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#f8efe2] hover:border-[#f4d58d]/45 hover:bg-white/[0.1]"
              >
                Explorar o baralho
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <div className="pdu-card-float pdu-daily-card-reveal mx-auto w-full max-w-sm">
              <div className="pdu-daily-card-reveal__aura" />
              <div className="pdu-daily-card-reveal__ring" />
              {daily ? (
                <Image
                  src={daily.card.assetPath}
                  alt={`Carta do dia: ${daily.card.name}`}
                  width={520}
                  height={832}
                  priority
                  className={`relative z-10 h-auto w-full rounded-[18px] shadow-[0_48px_120px_rgba(0,0,0,0.56)] ${
                    daily.card.reversed ? "rotate-180" : ""
                  }`}
                />
              ) : (
                <div className="relative z-10 grid aspect-[5/8] w-full place-items-center rounded-[18px] border border-white/10 bg-white/[0.06] text-sm font-semibold text-[#d8ccc0] shadow-[0_48px_120px_rgba(0,0,0,0.36)]">
                  Abrindo sua carta...
                </div>
              )}
            </div>

            <article className="pdu-message-field">
              <p className="text-xs font-semibold uppercase tracking-normal text-[#f5d896]">
                Mensagem de orientação
              </p>
              <h2 className="brand-serif mt-2 text-4xl font-semibold text-[#fff7e8]">
                {daily
                  ? `${daily.card.name}${daily.card.reversed ? " reversa" : ""}`
                  : "O portal está abrindo"}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {(daily?.card.keywords ?? ["presença", "escuta", "clareza"]).map(
                  (keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-[#d8ccc0]"
                    >
                      {keyword}
                    </span>
                  )
                )}
              </div>

              <p className="brand-serif mt-6 text-2xl leading-9 text-[#fff3df]">
                {daily?.reading.meaning ??
                  "Respire por um instante. A carta do dia fica guardada para você até a meia-noite."}
              </p>

              {daily ? (
                <div className="mt-6 space-y-4 text-sm leading-7 text-[#d8ccc0]">
                  <p>
                    <span className="font-semibold text-[#f5d896]">
                      Conselho:
                    </span>{" "}
                    {daily.reading.counsel}
                  </p>
                  <p>
                    <span className="font-semibold text-[#f5d896]">
                      Pergunta:
                    </span>{" "}
                    {daily.reading.reflection_prompt}
                  </p>
                  <p>
                    <span className="font-semibold text-[#f5d896]">
                      Ritual:
                    </span>{" "}
                    {daily.reading.ritual}
                  </p>
                </div>
              ) : null}

              <div className="mt-7">
                <Link
                  href="/#leitura"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#f8efe2] hover:border-[#f4d58d]/45 hover:bg-white/[0.1]"
                >
                  Fazer leitura de 3 cartas
                  <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
