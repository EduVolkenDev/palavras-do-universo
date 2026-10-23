// Existing checkout, invitations and continuity links must retain their original
// handlers. A plain visit to / must not restore a reading or open onboarding.
const LEGACY_HOME_PARAMS = ["product", "resume", "acao", "corrente", "continuar", "readingOnly"];
const LEGACY_HOME_HASHES = new Set(["#leitura", "#produtos", "#circulo", "#acao", "#reading-opened"]);

export function hasLegacyHomeIntent(params: Record<string, unknown>) {
  return LEGACY_HOME_PARAMS.some((key) => Object.hasOwn(params, key));
}

export function hasLegacyHomeHash(hash: string) {
  return LEGACY_HOME_HASHES.has(hash);
}
