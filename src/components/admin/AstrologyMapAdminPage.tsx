"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AstrologyChartExperience } from "@/components/astrology/AstrologyChartExperience";
import type { AstrologyBirthDataPayload, BirthPrecision } from "@/lib/astrology/birth-data";
import type { AstrologyLocationCandidate } from "@/lib/astrology/location";
import {
  resolveAstrologyBirthTime,
  type BirthTimeDisambiguation,
  type ServerBirthTimeResolution,
} from "@/lib/astrology/time-resolution";
import type { NatalChart } from "@/lib/astrology/natal-chart";

type MapDraft = {
  personName: string;
  localDate: string;
  localTime: string;
  locationLabel: string;
  countryCode: string;
  timezone: string;
  latitude: string;
  longitude: string;
  precision: BirthPrecision;
  disambiguation: BirthTimeDisambiguation | "";
};

const EMPTY_DRAFT: MapDraft = {
  personName: "",
  localDate: "",
  localTime: "",
  locationLabel: "",
  countryCode: "",
  timezone: "",
  latitude: "",
  longitude: "",
  precision: "exact",
  disambiguation: "",
};

const inputClass = "mt-2 w-full rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm text-[#332720] outline-none transition placeholder:text-[#a18f80] focus:border-[#8a6b3f] focus:ring-2 focus:ring-[#f4d58d]/45";

export default function AstrologyMapAdminPage({ ownerEmail }: { ownerEmail: string }) {
  const [draft, setDraft] = useState<MapDraft>(EMPTY_DRAFT);
  const [allowLocationLookup, setAllowLocationLookup] = useState(false);
  const [locationCandidates, setLocationCandidates] = useState<AstrologyLocationCandidate[]>([]);
  const [findingLocation, setFindingLocation] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [chart, setChart] = useState<NatalChart | null>(null);

  const calculationTime = draft.precision === "unknown" ? "12:00" : draft.localTime;
  const resolution = useMemo<ServerBirthTimeResolution | null>(() => {
    if (!draft.localDate || !calculationTime || !draft.timezone) return null;
    return resolveAstrologyBirthTime({
      localDate: draft.localDate,
      localTime: calculationTime,
      timezone: draft.timezone,
      disambiguation: draft.disambiguation || undefined,
    });
  }, [calculationTime, draft.disambiguation, draft.localDate, draft.timezone]);

  function updateField<K extends keyof MapDraft>(key: K, value: MapDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "locationLabel"
        ? { countryCode: "", timezone: "", latitude: "", longitude: "" }
        : {}),
      ...(key === "localDate" || key === "localTime" || key === "timezone"
        ? { disambiguation: "" }
        : {}),
    }));
    if (key === "locationLabel") setLocationCandidates([]);
    setNotice("");
    setError("");
  }

  function updatePrecision(precision: BirthPrecision) {
    setDraft((current) => ({
      ...current,
      precision,
      ...(precision === "unknown" ? { localTime: "", disambiguation: "" } : {}),
    }));
    setNotice("");
    setError("");
  }

  async function findLocation() {
    setError("");
    setNotice("");
    setLocationCandidates([]);
    if (!allowLocationLookup) {
      setError("Confirme a autorização da pessoa antes de buscar o local.");
      return;
    }
    if (draft.locationLabel.trim().length < 2) {
      setError("Informe a cidade e o país para buscar o local.");
      return;
    }

    setFindingLocation(true);
    try {
      const response = await fetch("/api/astrology/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: draft.locationLabel.trim(), consent: true }),
      });
      const payload = (await response.json()) as {
        candidates?: AstrologyLocationCandidate[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Não foi possível buscar o local.");
      const candidates = payload.candidates ?? [];
      setLocationCandidates(candidates);
      if (!candidates.length) setError("Nenhum local correspondente foi encontrado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível buscar o local.");
    } finally {
      setFindingLocation(false);
    }
  }

  function selectLocation(candidate: AstrologyLocationCandidate) {
    setDraft((current) => ({
      ...current,
      locationLabel: candidate.label,
      countryCode: candidate.countryCode,
      timezone: candidate.timezone,
      latitude: String(candidate.latitude),
      longitude: String(candidate.longitude),
      disambiguation: "",
    }));
    setLocationCandidates([]);
    setError("");
  }

  async function calculateMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (
      !draft.localDate ||
      (draft.precision !== "unknown" && !draft.localTime) ||
      !draft.locationLabel ||
      !draft.countryCode ||
      !draft.timezone ||
      !draft.latitude ||
      !draft.longitude
    ) {
      setError("Preencha a data, confirme o local e informe a hora quando souber.");
      return;
    }
    if (!resolution || resolution.status === "invalid") {
      setError("Confira a data, a hora e o local selecionado.");
      return;
    }
    if (resolution.status === "ambiguous") {
      setError("Essa hora aconteceu duas vezes nessa data. Escolha a ocorrência correta antes de calcular.");
      return;
    }
    if (resolution.status === "nonexistent") {
      setError("Essa hora local não existiu porque o relógio mudou. Escolha outro horário.");
      return;
    }

    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError("O local confirmado tem coordenadas inválidas. Busque o local novamente.");
      return;
    }

    const birthData: AstrologyBirthDataPayload = {
      localDate: draft.localDate,
      localTime: calculationTime,
      timeInputMode: "local-clock",
      timezone: draft.timezone,
      location: {
        label: draft.locationLabel.trim(),
        countryCode: draft.countryCode.trim().toUpperCase(),
        latitude,
        longitude,
      },
      precision: draft.precision,
      timeResolution: resolution as AstrologyBirthDataPayload["timeResolution"],
    };

    setCalculating(true);
    try {
      const response = await fetch("/api/admin/astrology/natal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthData, consent: true }),
      });
      const payload = (await response.json().catch(() => null)) as { chart?: NatalChart; error?: string } | null;
      if (!response.ok || !payload?.chart) {
        throw new Error(payload?.error || "Não foi possível calcular o mapa agora.");
      }
      setChart(payload.chart);
      setNotice("Mapa calculado. Os dados desta pessoa não foram salvos no banco.");
      window.setTimeout(() => document.getElementById("mapa-gerado")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível calcular o mapa agora.");
    } finally {
      setCalculating(false);
    }
  }

  function startAnotherMap() {
    setChart(null);
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (chart) {
    return (
      <main id="mapa-gerado" className="min-h-screen bg-[#f7f0e5] text-[#241b18]">
        <div className="sticky top-0 z-30 border-b border-[#d8c3a6] bg-[#fffaf2]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">Mapa interno · {draft.personName.trim() || "Pessoa atendida"}</p>
              <p className="mt-1 text-sm text-[#6f615a]">Visível somente para a conta proprietária · não salvo no banco</p>
            </div>
            <button type="button" onClick={startAnotherMap} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241b18] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] transition hover:bg-[#4a352b]">
              <Sparkles size={16} aria-hidden="true" />
              Criar outro mapa
            </button>
          </div>
        </div>
        <AstrologyChartExperience initialChart={chart} initialAccessLevel="full" adminMode />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f0e5] px-4 py-8 text-[#241b18] sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/codigos" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f] hover:text-[#4f4035]">
            <ArrowLeft size={15} aria-hidden="true" />
            Administração
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#caa96c]/50 bg-[#fffaf2] px-3 py-1.5 text-xs font-semibold text-[#6f5134]">
            <ShieldCheck size={15} aria-hidden="true" />
            Acesso exclusivo do proprietário
          </span>
        </div>

        <header className="mt-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6b3f]"><Sparkles size={15} aria-hidden="true" /> Consultoria · mapas natais</p>
          <h1 className="brand-serif mt-4 text-5xl font-semibold leading-[0.98] sm:text-7xl">Criar o mapa de uma pessoa.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#6f615a]">Preencha os dados de nascimento, confirme o local e abra a leitura completa para conduzir sua consulta com contexto, clareza e responsabilidade.</p>
        </header>

        <section className="mt-8 rounded-[28px] border border-[#d8c3a6] bg-[#fffaf2] p-5 shadow-[0_24px_70px_rgba(80,57,34,0.08)] sm:p-8" aria-labelledby="map-form-title">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e6d8c3] pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">Dados para esta consulta</p>
              <h2 id="map-form-title" className="brand-serif mt-2 text-3xl font-semibold">O céu começa no registro correto.</h2>
            </div>
            <p className="max-w-xs text-right text-xs leading-5 text-[#8a7667]">Conta autorizada: <strong>{ownerEmail || "proprietário"}</strong></p>
          </div>

          <form className="mt-7 space-y-7" onSubmit={calculateMap}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[#4f4035]">
                Nome da pessoa <span className="font-normal text-[#8a7667]">(opcional, não salvo)</span>
                <input className={inputClass} value={draft.personName} onChange={(event) => updateField("personName", event.target.value)} placeholder="Ex.: Ana" autoComplete="off" />
              </label>
              <label className="block text-sm font-semibold text-[#4f4035]">
                Data de nascimento
                <input className={inputClass} type="date" value={draft.localDate} onChange={(event) => updateField("localDate", event.target.value)} required />
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-[#4f4035]">Precisão do horário</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {([
                  ["exact", "Hora exata"],
                  ["approximate", "Hora aproximada"],
                  ["unknown", "Não sabe a hora"],
                ] as const).map(([value, label]) => (
                  <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${draft.precision === value ? "border-[#8a6b3f] bg-[#f8efe2] text-[#6f5134]" : "border-[#dfccb0] bg-white text-[#6f615a] hover:border-[#caa96c]"}`}>
                    <input type="radio" name="precision" value={value} checked={draft.precision === value} onChange={() => updatePrecision(value)} className="accent-[#8a6b3f]" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {draft.precision !== "unknown" ? (
              <label className="block max-w-sm text-sm font-semibold text-[#4f4035]">
                Hora local registrada
                <input className={inputClass} type="time" value={draft.localTime} onChange={(event) => updateField("localTime", event.target.value)} required />
                <span className="mt-2 block text-xs font-normal leading-5 text-[#8a7667]">Não adiante nem atrase uma hora por conta própria. O sistema verifica a regra histórica do fuso.</span>
              </label>
            ) : (
              <p className="rounded-2xl border border-[#e6d8c3] bg-[#f8efe2] p-4 text-sm leading-6 text-[#6f615a]">Sem horário, o mapa mostra os planetas, mas não inventa Ascendente nem casas.</p>
            )}

            <div className="rounded-2xl border border-[#e6d8c3] bg-white/65 p-4 sm:p-5">
              <label className="block text-sm font-semibold text-[#4f4035]">
                Cidade e país de nascimento
                <input className={inputClass} value={draft.locationLabel} onChange={(event) => updateField("locationLabel", event.target.value)} placeholder="Ex.: São Paulo, Brasil" autoComplete="off" required />
              </label>
              <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#6f615a]">
                <input type="checkbox" checked={allowLocationLookup} onChange={(event) => setAllowLocationLookup(event.target.checked)} className="mt-1 accent-[#8a6b3f]" />
                <span>Tenho autorização para usar os dados desta pessoa e permito a busca pontual do local para confirmar coordenadas e fuso horário.</span>
              </label>
              <button type="button" onClick={() => void findLocation()} disabled={findingLocation} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#8a6b3f]/45 bg-[#fffaf2] px-4 py-2.5 text-sm font-semibold text-[#6f5134] transition hover:bg-[#f8efe2] disabled:cursor-wait disabled:opacity-60">
                {findingLocation ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
                {findingLocation ? "Buscando local…" : "Buscar e confirmar local"}
              </button>
              {locationCandidates.length ? (
                <div className="mt-4 grid gap-2" aria-label="Locais encontrados">
                  {locationCandidates.map((candidate) => (
                    <button key={`${candidate.label}-${candidate.latitude}-${candidate.longitude}`} type="button" onClick={() => selectLocation(candidate)} className="flex items-start gap-3 rounded-2xl border border-[#dfccb0] bg-white p-4 text-left transition hover:border-[#8a6b3f] hover:bg-[#f8efe2]">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-[#8a6b3f]" aria-hidden="true" />
                      <span><strong className="block text-sm text-[#332720]">{candidate.label}</strong><span className="mt-1 block text-xs text-[#8a7667]">{candidate.countryCode} · {candidate.timezone}</span></span>
                    </button>
                  ))}
                </div>
              ) : null}
              {draft.timezone ? <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#3f786a]"><CheckCircle2 size={15} aria-hidden="true" /> Local confirmado · {draft.timezone}</p> : null}
            </div>

            {resolution?.status === "ambiguous" ? (
              <fieldset className="rounded-2xl border border-[#d8b877] bg-[#fff7dc] p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold text-[#6f5134]">Essa hora aconteceu duas vezes nessa data. Qual registro corresponde à pessoa?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(["earlier", "later"] as const).map((value) => (
                    <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8b877] bg-white/60 px-4 py-3 text-sm text-[#6f5134]">
                      <input type="radio" name="disambiguation" checked={draft.disambiguation === value} onChange={() => updateField("disambiguation", value)} className="accent-[#8a6b3f]" />
                      {value === "earlier" ? "Primeira ocorrência" : "Segunda ocorrência"}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {error ? <p className="rounded-2xl border border-[#d9aaa8] bg-[#fff1f0] p-4 text-sm leading-6 text-[#7b3330]" role="alert">{error}</p> : null}
            {notice ? <p className="rounded-2xl border border-[#bfd9cf] bg-[#edf7f2] p-4 text-sm leading-6 text-[#315d56]" role="status">{notice}</p> : null}

            <div className="flex flex-col gap-4 border-t border-[#e6d8c3] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-5 text-[#8a7667]">O mapa é calculado sob demanda para a consulta atual. Os dados de nascimento não entram no perfil da sua conta e não são persistidos por esta ferramenta.</p>
              <button type="submit" disabled={calculating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#241b18] px-6 py-3 text-sm font-semibold text-[#fff7e8] transition hover:bg-[#4a352b] disabled:cursor-wait disabled:opacity-60">
                {calculating ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
                {calculating ? "Calculando mapa…" : "Calcular mapa completo"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
