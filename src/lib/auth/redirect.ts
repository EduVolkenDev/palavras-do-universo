export const DEFAULT_AUTH_REDIRECT = "/meu-universo";

const INTERNAL_REDIRECT_BASE = "https://palavras.local";
const MAX_REDIRECT_LENGTH = 900;

function isUnsafeRedirectValue(value: string) {
  return (
    !value ||
    value.length > MAX_REDIRECT_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  );
}

export function sanitizeAuthRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT
) {
  const cleanFallback =
    typeof fallback === "string" && fallback.startsWith("/") && !fallback.startsWith("//")
      ? fallback
      : DEFAULT_AUTH_REDIRECT;

  if (typeof value !== "string") return cleanFallback;

  const trimmed = value.trim();
  if (isUnsafeRedirectValue(trimmed)) return cleanFallback;

  try {
    const parsed = new URL(trimmed, INTERNAL_REDIRECT_BASE);
    if (parsed.origin !== INTERNAL_REDIRECT_BASE) return cleanFallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || cleanFallback;
  } catch {
    return cleanFallback;
  }
}

export function buildAuthCallbackUrl(origin: string, nextPath: string) {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", sanitizeAuthRedirect(nextPath));
  return url.toString();
}

export function buildLoginPath(
  nextPath: string | null | undefined = DEFAULT_AUTH_REDIRECT,
  options: {
    error?: string | null;
    lang?: string | null;
    reason?: string | null;
  } = {}
) {
  const params = new URLSearchParams({
    next: sanitizeAuthRedirect(nextPath),
  });

  if (options.error) params.set("error", options.error);
  if (options.reason) params.set("reason", options.reason);
  if (options.lang === "en" || options.lang === "pt-BR") {
    params.set("lang", options.lang);
  }

  return `/entrar?${params.toString()}`;
}

export function buildLoginPathWithError(error: string, nextPath: string) {
  return buildLoginPath(nextPath, { error });
}
