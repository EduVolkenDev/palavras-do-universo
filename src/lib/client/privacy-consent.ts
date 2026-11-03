export const CONSENT_KEY = "pdu_privacy_consent_v1";
export const CONSENT_EVENT = "pdu:privacy-consent";
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
let sessionChoice = "";

export function parseConsent(raw: string, now = Date.now()): boolean | null {
  try {
    const value = JSON.parse(raw);
    if (value.version !== 1 || typeof value.diagnostics !== "boolean" ||
      !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt >= MAX_AGE) return null;
    return value.diagnostics;
  } catch { return null; }
}

export function consentSnapshot() {
  if (typeof window === "undefined") return "loading";
  try {
    const raw = sessionChoice || window.localStorage.getItem(CONSENT_KEY) || "";
    return parseConsent(raw) === null ? "" : raw;
  } catch { return parseConsent(sessionChoice) === null ? "" : sessionChoice; }
}

export function diagnosticsAllowed() {
  return parseConsent(consentSnapshot()) === true;
}

export function saveConsent(diagnostics: boolean) {
  sessionChoice = JSON.stringify({ version: 1, diagnostics, savedAt: Date.now() });
  try { window.localStorage.setItem(CONSENT_KEY, sessionChoice); } catch { /* Session-only choice. */ }
  if (!diagnostics) {
    try { window.localStorage.removeItem("pdu_telemetry_id"); } catch { /* Storage may be disabled. */ }
    try { window.sessionStorage.removeItem("pdu_site_event_rate"); } catch { /* Storage may be disabled. */ }
    delete window.__pduLastAction;
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function subscribeConsent(listener: () => void) {
  const onStorage = () => { sessionChoice = ""; listener(); };
  window.addEventListener(CONSENT_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
