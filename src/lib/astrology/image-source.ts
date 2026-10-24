/** Decorative astrology artwork must not crash a reading when an asset is absent. */
export function resolveAstrologyImageSource(source: unknown): string | null {
  if (typeof source !== "string") return null;

  const normalized = source.trim();
  return normalized.length > 0 ? normalized : null;
}
