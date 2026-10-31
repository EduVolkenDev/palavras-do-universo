export type DiaryReadingInput = {
  readingId: string | null;
  occurredAt: string;
  timezone: string;
  locale: string;
  question: string;
  spreadLabel: string;
  interpretation: string;
  cards: Array<{ name: string; position: string; reversed: boolean }>;
};

export function diaryOrigin(configured: string | undefined, development = false) {
  const value = configured || 'https://diario.palavrasdouniverso.com';
  const url = new URL(value);
  const official = url.origin === 'https://diario.palavrasdouniverso.com';
  const local = development && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((!official && !local) || url.origin !== value) throw new Error('Invalid Diary destination');
  return url.origin;
}

export async function buildDiaryReading(input: DiaryReadingInput) {
  if (!input.interpretation.trim() || input.interpretation.length > 20000 || input.question.length > 2000 || !input.spreadLabel.trim() || input.spreadLabel.length > 160) throw new Error('Invalid reading');
  if (!Number.isFinite(Date.parse(input.occurredAt))) throw new Error('Invalid reading date');
  new Intl.DateTimeFormat('pt-BR', {timeZone: input.timezone});
  if (!input.cards.length || input.cards.length > 22 || input.cards.some(card => !card.name.trim() || card.name.length > 160 || !card.position.trim() || card.position.length > 160 || typeof card.reversed !== 'boolean')) throw new Error('Invalid cards');
  let readingId = input.readingId;
  if (!readingId) {
    const fingerprint = JSON.stringify([input.question, input.interpretation, input.cards]);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
    readingId = `local_${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(readingId)) throw new Error('Invalid reading ID');
  const reading = {
    version: 1 as const, app: 'pdu' as const, readingId,
    occurredAt: new Date(input.occurredAt).toISOString(), timezone: input.timezone,
    locale: input.locale === 'en' ? 'en' as const : 'pt-BR' as const,
    question: input.question.trim(), spreadLabel: input.spreadLabel.trim(),
    interpretation: input.interpretation.trim(),
    cards: input.cards.map(card => ({ name: card.name, position: card.position, reversed: card.reversed })),
  };
  if (new TextEncoder().encode(JSON.stringify(reading)).length > 90000) throw new Error('Reading too large');
  return reading;
}

export function acceptsDiaryReply(event: {origin: string; source: unknown; data: unknown}, target: unknown, origin: string, nonce: string, type: string) {
  const data = event.data as Record<string, unknown> | null;
  return event.source === target && !!target && event.origin === origin && !!data && data.type === type && data.nonce === nonce;
}
