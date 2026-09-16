import type { AstrologyBirthDataPayload } from "./birth-data";

export type AstrologyBirthDataRecord = AstrologyBirthDataPayload & {
  metadata: {
    calculationVersion: string;
    consentGrantedAt: string;
    createdAt: string;
    updatedAt: string;
  };
};

export interface AstrologyBirthDataClient {
  getBirthData(): Promise<AstrologyBirthDataRecord | null>;
  saveBirthData(input: { birthData: AstrologyBirthDataPayload }): Promise<AstrologyBirthDataRecord>;
  deleteBirthData(): Promise<void>;
}

interface BirthDataApiPayload {
  birthData?: unknown;
  code?: unknown;
}

interface BirthDataClientOptions {
  endpoint?: string;
  fetcher?: typeof fetch;
}

function isBirthDataRecord(value: unknown): value is AstrologyBirthDataRecord {
  if (typeof value !== "object" || value === null) return false;

  const data = value as Partial<AstrologyBirthDataRecord>;
  const location = data.location;
  const resolution = data.timeResolution;
  const metadata = data.metadata;

  return Boolean(
    typeof data.localDate === "string" &&
      typeof data.localTime === "string" &&
      data.timeInputMode === "local-clock" &&
      typeof data.timezone === "string" &&
      (data.precision === "exact" || data.precision === "approximate" || data.precision === "unknown") &&
      typeof location === "object" &&
      location !== null &&
      typeof location.label === "string" &&
      typeof location.countryCode === "string" &&
      typeof location.latitude === "number" &&
      Number.isFinite(location.latitude) &&
      typeof location.longitude === "number" &&
      Number.isFinite(location.longitude) &&
      typeof resolution === "object" &&
      resolution !== null &&
      resolution.status === "resolved" &&
      resolution.source === "iana-timezone-rules" &&
      typeof metadata === "object" &&
      metadata !== null &&
      typeof metadata.calculationVersion === "string" &&
      typeof metadata.consentGrantedAt === "string" &&
      typeof metadata.createdAt === "string" &&
      typeof metadata.updatedAt === "string"
  );
}

async function readApiPayload(response: Response): Promise<BirthDataApiPayload> {
  const payload = (await response.json().catch(() => null)) as BirthDataApiPayload | null;
  if (!response.ok) {
    const code = typeof payload?.code === "string" ? payload.code : "astrology-birth-data-request-failed";
    throw new Error(code);
  }
  return payload ?? {};
}

function parseBirthData(payload: BirthDataApiPayload) {
  if (payload.birthData === null || payload.birthData === undefined) return null;
  if (!isBirthDataRecord(payload.birthData)) throw new Error("astrology-birth-data-invalid-response");
  return payload.birthData;
}

/**
 * Same-origin browser bridge for the authenticated PDU birth-data contract.
 * The server remains responsible for canonical IANA resolution and persistence.
 */
export function createAstrologyBirthDataClient(options: BirthDataClientOptions = {}): AstrologyBirthDataClient {
  const endpoint = options.endpoint ?? "/api/astrology/birth-data";
  const fetcher = options.fetcher ?? globalThis.fetch;
  const requestDefaults: RequestInit = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };

  return {
    async getBirthData() {
      const response = await fetcher(endpoint, {
        ...requestDefaults,
        method: "GET",
        cache: "no-store",
      });
      return parseBirthData(await readApiPayload(response));
    },
    async saveBirthData({ birthData }) {
      const response = await fetcher(endpoint, {
        ...requestDefaults,
        method: "PUT",
        body: JSON.stringify({ birthData, consent: { storeBirthData: true } }),
      });
      const savedBirthData = parseBirthData(await readApiPayload(response));
      if (!savedBirthData) throw new Error("astrology-birth-data-empty-response");
      return savedBirthData;
    },
    async deleteBirthData() {
      const response = await fetcher(endpoint, {
        ...requestDefaults,
        method: "DELETE",
        cache: "no-store",
      });
      await readApiPayload(response);
    },
  };
}
