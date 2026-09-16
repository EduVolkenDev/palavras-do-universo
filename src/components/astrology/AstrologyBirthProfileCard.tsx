"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Clock3, Info, LoaderCircle, MapPin, Sparkles } from "lucide-react";
import {
  createAstrologyBirthDataClient,
  type AstrologyBirthDataRecord,
} from "@/lib/astrology/birth-data-client";
import type { AstrologyBirthDataPayload } from "@/lib/astrology/birth-data";
import {
  resolveAstrologyBirthTime,
  type BirthTimeDisambiguation,
  type ServerBirthTimeResolution,
} from "@/lib/astrology/time-resolution";
import type { AstrologyLocationCandidate } from "@/lib/astrology/location";

type Locale = "pt-BR" | "en";

type BirthDraft = {
  localDate: string;
  localTime: string;
  locationLabel: string;
  countryCode: string;
  timezone: string;
  latitude: string;
  longitude: string;
  precision: "exact" | "approximate";
  disambiguation: BirthTimeDisambiguation | "";
};

const inputClass = "mt-2 w-full rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm text-[#332720] outline-none transition placeholder:text-[#a18f80] focus:border-[#8a6b3f] focus:ring-2 focus:ring-[#f4d58d]/45";

function initialDraft(): BirthDraft {
  return {
    localDate: "",
    localTime: "",
    locationLabel: "",
    countryCode: "",
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
    latitude: "",
    longitude: "",
    precision: "exact",
    disambiguation: "",
  };
}

function draftFromRecord(record: AstrologyBirthDataRecord): BirthDraft {
  return {
    localDate: record.localDate,
    localTime: record.localTime,
    locationLabel: record.location.label,
    countryCode: record.location.countryCode,
    timezone: record.timezone,
    latitude: String(record.location.latitude),
    longitude: String(record.location.longitude),
    precision: record.precision === "approximate" ? "approximate" : "exact",
    disambiguation: record.timeResolution.disambiguation ?? "",
  };
}

function formatOffset(offset: number | null) {
  if (offset === null) return "";
  if (offset === 0) return "UTC±00:00";
  const sign = offset > 0 ? "+" : "−";
  const absolute = Math.abs(offset);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

export function AstrologyBirthProfileCard({ locale }: { locale: Locale }) {
  const isEnglish = locale === "en";
  const copy = isEnglish
    ? {
        eyebrow: "ASTROLOGY · PRIVATE CONTEXT",
        title: "Prepare your birth map",
        intro: "Give the sky a precise beginning. This context will later personalize your daily sky, pulse and symbolic convergences.",
        localTime: "Use the time shown on the local clock or birth record. Do not add or remove an hour yourself for daylight saving time; we verify the historical rule for the date.",
        date: "Birth date",
        time: "Local clock time",
        place: "Birth place",
        country: "Country code",
        timezone: "Historical timezone",
        latitude: "Latitude",
        longitude: "Longitude",
        precision: "Time precision",
        exact: "Exact time",
        approximate: "Approximate time",
        placeHelp: "Use the confirmed place and coordinates for the birth location.",
        findPlace: "Find this place",
        findingPlace: "Searching…",
        locationConsent: "I allow a one-time search of this place through OpenStreetMap to suggest coordinates and timezone.",
        consentRequired: "Allow the one-time place search before asking us to find coordinates.",
        noPlaces: "No matching place was found. Check the spelling and country code.",
        placeSearchError: "The place search is unavailable. You can still review the coordinates manually.",
        attribution: "Map data © OpenStreetMap contributors",
        timezoneHelp: "Example: Europe/London · America/Sao_Paulo",
        coordinatesHelp: "Coordinates keep the future houses and ascendant calculation tied to the right place.",
        save: "Save my birth context",
        saving: "Saving…",
        saved: "Birth context saved",
        loading: "Loading your saved context…",
        resolved: (offset: string, daylight: string) => `Local time understood. Applied ${offset}. Daylight saving: ${daylight}.`,
        active: "active",
        inactive: "not active",
        unknown: "not classified",
        ambiguous: "This clock time happened twice on that date. Choose which occurrence matches the record.",
        earlier: "First occurrence",
        later: "Second occurrence",
        nonexistent: "This local time did not exist because the clock changed. Choose a different time.",
        invalid: "Check the date, time and IANA timezone.",
        missing: "Complete the date, time, place, country, timezone and coordinates before saving.",
        saveError: "We could not save this context now. Please try again.",
        introSaved: "Your local birth time stays visible and auditable. The server recalculates the historical offset before accepting it.",
      }
    : {
        eyebrow: "ASTROLOGIA · CONTEXTO PRIVADO",
        title: "Preparar meu mapa",
        intro: "Dê ao céu um começo preciso. Este contexto vai personalizar depois seu céu diário, seu pulso e as convergências simbólicas.",
        localTime: "Use a hora que apareceu no relógio local ou no registro de nascimento. Não adiante nem atrase uma hora por conta própria por causa do horário de verão; verificaremos a regra histórica da data.",
        date: "Data de nascimento",
        time: "Hora local registrada",
        place: "Local de nascimento",
        country: "Código do país",
        timezone: "Fuso histórico",
        latitude: "Latitude",
        longitude: "Longitude",
        precision: "Precisão da hora",
        exact: "Hora exata",
        approximate: "Hora aproximada",
        placeHelp: "Use o local confirmado e as coordenadas de onde você nasceu.",
        findPlace: "Encontrar este local",
        findingPlace: "Buscando…",
        locationConsent: "Permito uma busca única deste local no OpenStreetMap para sugerir coordenadas e fuso.",
        consentRequired: "Permita a busca única do local antes de pedir as coordenadas.",
        noPlaces: "Nenhum local correspondente foi encontrado. Confira a grafia e o código do país.",
        placeSearchError: "A busca do local está indisponível. Você ainda pode revisar as coordenadas manualmente.",
        attribution: "Dados do mapa © OpenStreetMap contributors",
        timezoneHelp: "Exemplo: Europe/London · America/Sao_Paulo",
        coordinatesHelp: "As coordenadas mantêm as futuras casas e o ascendente ligados ao lugar correto.",
        save: "Salvar meu contexto de nascimento",
        saving: "Salvando…",
        saved: "Contexto de nascimento salvo",
        loading: "Carregando seu contexto salvo…",
        resolved: (offset: string, daylight: string) => `Hora local compreendida. Aplicamos ${offset}. Horário de verão: ${daylight}.`,
        active: "ativo",
        inactive: "não estava ativo",
        unknown: "não classificado",
        ambiguous: "Essa hora aconteceu duas vezes nessa data. Escolha qual ocorrência corresponde ao registro.",
        earlier: "Primeira ocorrência",
        later: "Segunda ocorrência",
        nonexistent: "Essa hora local não existiu porque o relógio mudou. Escolha outro horário.",
        invalid: "Confira a data, a hora e o fuso IANA.",
        missing: "Preencha data, hora, local, país, fuso e coordenadas antes de salvar.",
        saveError: "Não foi possível salvar agora. Tente novamente.",
        introSaved: "Sua hora local de nascimento permanece visível e auditável. O servidor recalcula o offset histórico antes de aceitar os dados.",
      };

  const client = useMemo(() => createAstrologyBirthDataClient(), []);
  const [draft, setDraft] = useState<BirthDraft>(initialDraft);
  const [savedRecord, setSavedRecord] = useState<AstrologyBirthDataRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [locationCandidates, setLocationCandidates] = useState<AstrologyLocationCandidate[]>([]);
  const [allowLocationLookup, setAllowLocationLookup] = useState(false);
  const [findingLocation, setFindingLocation] = useState(false);

  useEffect(() => {
    let active = true;
    void client.getBirthData().then((record) => {
      if (!active) return;
      if (record) {
        setSavedRecord(record);
        setDraft(draftFromRecord(record));
      }
    }).catch(() => {
      if (active) setError(copy.saveError);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [client, copy.saveError]);

  const resolution = useMemo<ServerBirthTimeResolution | null>(() => {
    if (!draft.localDate || !draft.localTime || !draft.timezone) return null;
    return resolveAstrologyBirthTime({
      localDate: draft.localDate,
      localTime: draft.localTime,
      timezone: draft.timezone,
      disambiguation: draft.disambiguation || undefined,
    });
  }, [draft.disambiguation, draft.localDate, draft.localTime, draft.timezone]);

  const update = <K extends keyof BirthDraft>(key: K, value: BirthDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(["localDate", "localTime", "timezone"].includes(key) ? { disambiguation: "" } : {}),
    }));
    if (key === "locationLabel" || key === "countryCode") setLocationCandidates([]);
    setNotice("");
    setError("");
  };

  const handleLocationSearch = async () => {
    setError("");
    setNotice("");
    setLocationCandidates([]);
    if (!allowLocationLookup) {
      setError(copy.consentRequired);
      return;
    }
    if (!draft.locationLabel.trim() || !/^[A-Za-z]{2}$/.test(draft.countryCode)) {
      setError(copy.missing);
      return;
    }

    setFindingLocation(true);
    try {
      const response = await fetch("/api/astrology/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: draft.locationLabel.trim(), countryCode: draft.countryCode.trim().toUpperCase(), consent: true }),
      });
      const payload = (await response.json()) as { candidates?: AstrologyLocationCandidate[]; errorCode?: string };
      if (!response.ok) throw new Error(payload.errorCode ?? "location-search-failed");
      const candidates = payload.candidates ?? [];
      setLocationCandidates(candidates);
      if (!candidates.length) setError(copy.noPlaces);
    } catch {
      setError(copy.placeSearchError);
    } finally {
      setFindingLocation(false);
    }
  };

  const selectLocation = (candidate: AstrologyLocationCandidate) => {
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
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!draft.localDate || !draft.localTime || !draft.locationLabel || !/^[A-Za-z]{2}$/.test(draft.countryCode) || !draft.timezone || !draft.latitude || !draft.longitude) {
      setError(copy.missing);
      return;
    }
    if (!resolution || resolution.status === "invalid") {
      setError(copy.invalid);
      return;
    }
    if (resolution.status === "ambiguous") {
      setError(copy.ambiguous);
      return;
    }
    if (resolution.status === "nonexistent") {
      setError(copy.nonexistent);
      return;
    }
    if (resolution.status !== "resolved") {
      setError(copy.invalid);
      return;
    }

    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError(copy.missing);
      return;
    }

    setSaving(true);
    try {
      const record = await client.saveBirthData({
        birthData: {
          localDate: draft.localDate,
          localTime: draft.localTime,
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
        },
      });
      setSavedRecord(record);
      setDraft(draftFromRecord(record));
      setNotice(copy.saved);
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "BIRTH_DATA_CONSENT_REQUIRED" ? copy.saveError : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const daylightLabel = resolution?.daylightSaving === "active" ? copy.active : resolution?.daylightSaving === "inactive" ? copy.inactive : copy.unknown;

  return (
    <section id="preparar-meu-mapa" className="mt-8 overflow-hidden rounded-[30px] border border-[#241b18]/10 bg-[#fffaf2] shadow-[0_30px_90px_rgba(80,57,34,0.12)]">
      <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative overflow-hidden bg-[#241b18] p-6 text-[#fff7e8] sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#f4d58d]/20 bg-[radial-gradient(circle,rgba(244,213,141,0.24),transparent_66%)]" aria-hidden="true" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/25 bg-white/[0.06] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
              <Sparkles size={13} />
              {copy.eyebrow}
            </p>
            <h2 className="brand-serif mt-5 text-4xl font-semibold leading-tight sm:text-5xl">{copy.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">{copy.intro}</p>
            <div className="mt-7 rounded-2xl border border-[#f4d58d]/20 bg-white/[0.06] p-4 text-sm leading-6 text-[#f4e6ce]">
              <div className="flex gap-3">
                <Info className="mt-0.5 shrink-0 text-[#f5d896]" size={17} />
                <p>{copy.localTime}</p>
              </div>
            </div>
            {savedRecord ? (
              <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#a7d7c5]">
                <CheckCircle2 size={15} />
                {copy.introSaved}
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-[#6f615a]">
              <LoaderCircle className="animate-spin" size={18} />
              {copy.loading}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]"><CalendarDays size={14} />{copy.date}</span>
                  <input className={inputClass} type="date" value={draft.localDate} onChange={(event) => update("localDate", event.target.value)} required />
                </label>
                <label className="block">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]"><Clock3 size={14} />{copy.time}</span>
                  <input className={inputClass} type="time" value={draft.localTime} onChange={(event) => update("localTime", event.target.value)} required />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]"><MapPin size={14} />{copy.place}</span>
                  <input className={inputClass} value={draft.locationLabel} onChange={(event) => update("locationLabel", event.target.value)} placeholder={isEnglish ? "London, United Kingdom" : "São Paulo, Brasil"} required />
                  <span className="mt-2 block text-xs leading-5 text-[#8a7667]">{copy.placeHelp}</span>
                </label>
                <label className="block sm:w-28">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{copy.country}</span>
                  <input className={`${inputClass} uppercase`} maxLength={2} value={draft.countryCode} onChange={(event) => update("countryCode", event.target.value.toUpperCase())} placeholder="BR" required />
                </label>
              </div>
              <div className="rounded-2xl border border-[#dfccb0] bg-[#f8efe2] p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#6f615a]">
                  <input className="mt-1 h-4 w-4 accent-[#8a6b3f]" type="checkbox" checked={allowLocationLookup} onChange={(event) => setAllowLocationLookup(event.target.checked)} />
                  <span>{copy.locationConsent}</span>
                </label>
                <button type="button" onClick={handleLocationSearch} disabled={findingLocation} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#8a6b3f]/40 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f5134] transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-60">
                  {findingLocation ? <LoaderCircle className="animate-spin" size={15} /> : <MapPin size={15} />}
                  {findingLocation ? copy.findingPlace : copy.findPlace}
                </button>
                {locationCandidates.length ? (
                  <div className="mt-3 grid gap-2" aria-label={copy.findPlace}>
                    {locationCandidates.map((candidate) => (
                      <button key={candidate.id} type="button" onClick={() => selectLocation(candidate)} className="rounded-xl border border-[#d8c3a6] bg-white p-3 text-left text-sm text-[#4d3c31] transition hover:border-[#8a6b3f] hover:bg-[#fffaf2]">
                        <span className="block font-semibold">{candidate.label}</span>
                        <span className="mt-1 block text-xs text-[#8a7667]">{candidate.timezone} · {candidate.latitude.toFixed(4)}, {candidate.longitude.toFixed(4)}</span>
                      </button>
                    ))}
                    <span className="text-[0.68rem] text-[#8a7667]">{copy.attribution}</span>
                  </div>
                ) : null}
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{copy.timezone}</span>
                <input className={inputClass} value={draft.timezone} onChange={(event) => update("timezone", event.target.value)} placeholder="America/Sao_Paulo" required />
                <span className="mt-2 block text-xs leading-5 text-[#8a7667]">{copy.timezoneHelp}</span>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{copy.latitude}</span>
                  <input className={inputClass} type="number" step="any" min="-90" max="90" value={draft.latitude} onChange={(event) => update("latitude", event.target.value)} placeholder="-23.5505" required />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{copy.longitude}</span>
                  <input className={inputClass} type="number" step="any" min="-180" max="180" value={draft.longitude} onChange={(event) => update("longitude", event.target.value)} placeholder="-46.6333" required />
                </label>
              </div>
              <p className="-mt-2 text-xs leading-5 text-[#8a7667]">{copy.coordinatesHelp}</p>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{copy.precision}</span>
                <select className={inputClass} value={draft.precision} onChange={(event) => update("precision", event.target.value as BirthDraft["precision"])}>
                  <option value="exact">{copy.exact}</option>
                  <option value="approximate">{copy.approximate}</option>
                </select>
              </label>

              {resolution?.status === "ambiguous" ? (
                <fieldset className="rounded-2xl border border-[#c69a4f]/45 bg-[#fff7df] p-4 text-sm text-[#5d4727]">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">{copy.ambiguous}</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(["earlier", "later"] as const).map((choice) => (
                      <label key={choice} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8c3a6] bg-white/70 px-3 py-3">
                        <input type="radio" name="birth-time-disambiguation" checked={draft.disambiguation === choice} onChange={() => update("disambiguation", choice)} />
                        <span>{choice === "earlier" ? copy.earlier : copy.later}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {resolution?.status === "resolved" ? (
                <div className="rounded-2xl border border-[#a9cdbf] bg-[#eef8f2] p-4 text-sm leading-6 text-[#315d56]">
                  <CheckCircle2 className="mb-1 inline-block mr-2" size={16} />
                  {copy.resolved(formatOffset(resolution.utcOffsetMinutes), daylightLabel)}
                </div>
              ) : null}
              {resolution?.status === "nonexistent" ? <div className="rounded-2xl border border-[#d9aaa8] bg-[#fff1f0] p-4 text-sm leading-6 text-[#7b3330]">{copy.nonexistent}</div> : null}
              {resolution?.status === "invalid" ? <div className="rounded-2xl border border-[#d9aaa8] bg-[#fff1f0] p-4 text-sm leading-6 text-[#7b3330]">{copy.invalid}</div> : null}
              {error ? <div className="rounded-2xl border border-[#d9aaa8] bg-[#fff1f0] p-4 text-sm leading-6 text-[#7b3330]" role="alert">{error}</div> : null}
              {notice ? <div className="rounded-2xl border border-[#a9cdbf] bg-[#eef8f2] p-4 text-sm leading-6 text-[#315d56]" role="status">{notice}</div> : null}

              <button type="submit" disabled={saving || loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8] shadow-[0_18px_50px_rgba(36,27,24,0.16)] transition hover:bg-[#3a2920] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6b3f]">
                {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}
                {saving ? copy.saving : copy.save}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
