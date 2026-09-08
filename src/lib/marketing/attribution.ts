export const MARKETING_ATTRIBUTION_KEYS = [
  "campaign",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

export type MarketingAttributionKey = (typeof MARKETING_ATTRIBUTION_KEYS)[number];
export type MarketingAttribution = Partial<Record<MarketingAttributionKey, string>>;

const MAX_ATTRIBUTION_VALUE_LENGTH = 120;

function normalizeAttributionValue(value: unknown) {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized || normalized.length > MAX_ATTRIBUTION_VALUE_LENGTH) return null;
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalized)) return null;

  return normalized;
}

function readAttributionValue(input: unknown, key: MarketingAttributionKey) {
  if (input instanceof URLSearchParams) return input.get(key);

  if (input && typeof input === "object") {
    const value = (input as Record<string, unknown>)[key];
    return Array.isArray(value) ? value[0] : value;
  }

  return null;
}

/**
 * Campaign attribution stays useful without accepting search terms or free-form
 * text that could describe a visitor's personal situation.
 */
export function normalizeMarketingAttribution(input: unknown): MarketingAttribution {
  const attribution: MarketingAttribution = {};

  for (const key of MARKETING_ATTRIBUTION_KEYS) {
    const value = normalizeAttributionValue(readAttributionValue(input, key));
    if (value) attribution[key] = value;
  }

  return attribution;
}

export function appendMarketingAttribution(
  params: URLSearchParams,
  attribution: MarketingAttribution
) {
  for (const [key, value] of Object.entries(attribution)) {
    if (value) params.set(key, value);
  }
}

export function toStripeMarketingMetadata(attribution: MarketingAttribution) {
  return Object.fromEntries(
    Object.entries(attribution).map(([key, value]) => [`pdu_${key}`, value])
  );
}

export function getMarketingAttributionFromStripeMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const values: Record<string, unknown> = {};

  for (const key of MARKETING_ATTRIBUTION_KEYS) {
    values[key] = metadata?.[`pdu_${key}`];
  }

  return normalizeMarketingAttribution(values);
}
