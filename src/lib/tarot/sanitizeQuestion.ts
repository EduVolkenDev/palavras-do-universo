export type SanitizeResult = {
  sanitized: string;
  removed: { emails: number; phones: number; urls: number; ids: number };
  flags: string[];
};

const normalizeSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_RE = /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/gi;
const PHONE_RE =
  /\b(?:\+?\d{1,3}\s*)?(?:\(?\d{2,3}\)?\s*)?(?:9?\d{4})[-\s]?\d{4}\b/g;
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

export function sanitizeQuestion(inputRaw: string): SanitizeResult {
  const flags: string[] = [];
  let s = (inputRaw ?? "").toString();

  const removed = { emails: 0, phones: 0, urls: 0, ids: 0 };

  const emails = s.match(EMAIL_RE)?.length ?? 0;
  removed.emails += emails;
  s = s.replace(EMAIL_RE, "[email]");

  const urls = s.match(URL_RE)?.length ?? 0;
  removed.urls += urls;
  s = s.replace(URL_RE, "[link]");

  const phones = s.match(PHONE_RE)?.length ?? 0;
  removed.phones += phones;
  s = s.replace(PHONE_RE, "[telefone]");

  const cpfs = s.match(CPF_RE)?.length ?? 0;
  removed.ids += cpfs;
  s = s.replace(CPF_RE, "[id]");

  s = normalizeSpaces(s).replace(/([!?.,])\1{2,}/g, "$1$1");

  if (s.length < 8) flags.push("too_short");

  return { sanitized: s, removed, flags };
}
