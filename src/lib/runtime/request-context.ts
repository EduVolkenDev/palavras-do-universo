const COUNTRY_CODE = /^[a-z]{2}$/i;
const IP_ADDRESS = /^[a-f0-9:.]+$/i;

/** Normalizes edge-provider request metadata without exposing provider details to UI code. */
export function getRequestCountry(headers: Headers) {
  const country = headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country");
  return country && COUNTRY_CODE.test(country) ? country.toUpperCase() : null;
}

/** Uses the provider's trusted client-IP header, retaining legacy host compatibility. */
export function getRequestIp(headers: Headers) {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-real-ip"),
    process.env.NODE_ENV === "production" ? null : headers.get("x-forwarded-for"),
  ];

  for (const candidate of candidates) {
    const ip = candidate?.split(",")[0]?.trim();
    if (ip && IP_ADDRESS.test(ip)) return ip;
  }

  return "unknown";
}

export function isProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.CF_PAGES === "1"
  );
}
