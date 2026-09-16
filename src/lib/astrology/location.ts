import tzLookup from "tz-lookup";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const APPLICATION_USER_AGENT = "PalavrasDoUniversoAstrology/0.1";
const MIN_REQUEST_INTERVAL_MS = 1_100;

let lastRequestAt = 0;

export type AstrologyLocationCandidate = {
  id: string;
  label: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: "nominatim";
  attribution: "© OpenStreetMap contributors";
};

interface NominatimResult {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: { country_code?: string };
}

export class LocationProviderError extends Error {
  constructor(public readonly reason: "rate-limit" | "upstream") {
    super(reason);
  }
}

export async function resolveAstrologyLocation(input: { label: string; countryCode: string }): Promise<AstrologyLocationCandidate[]> {
  const now = Date.now();
  if (now - lastRequestAt < MIN_REQUEST_INTERVAL_MS) throw new LocationProviderError("rate-limit");
  lastRequestAt = now;

  const params = new URLSearchParams({
    q: input.label,
    format: "jsonv2",
    limit: "3",
    addressdetails: "1",
    countrycodes: input.countryCode.toLowerCase(),
  });

  let response: Response;
  try {
    response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": APPLICATION_USER_AGENT },
      cache: "no-store",
    });
  } catch {
    throw new LocationProviderError("upstream");
  }
  if (!response.ok) throw new LocationProviderError("upstream");

  const results = (await response.json()) as NominatimResult[];
  return results.map((result) => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    const label = typeof result.display_name === "string" ? result.display_name.trim() : "";
    const countryCode = result.address?.country_code?.toUpperCase() ?? input.countryCode.toUpperCase();
    if (!result.place_id || !label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      id: String(result.place_id),
      label,
      countryCode,
      latitude,
      longitude,
      timezone: tzLookup(latitude, longitude),
      source: "nominatim" as const,
      attribution: "© OpenStreetMap contributors" as const,
    };
  }).filter((candidate): candidate is AstrologyLocationCandidate => candidate !== null);
}
