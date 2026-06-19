export type RepeatCheckResult =
  | { allowed: true; fingerprint: string; repeatsInWindow: number }
  | {
      allowed: false;
      fingerprint: string;
      repeatsInWindow: number;
      message: string;
      suggestedRephrase: string;
      guidedFollowUps: string[];
    };

type StoredItem = { fingerprint: string; ts: number };

const STOPWORDS_PT = new Set([
  "a",
  "o",
  "os",
  "as",
  "um",
  "uma",
  "uns",
  "umas",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "por",
  "para",
  "pra",
  "com",
  "sem",
  "e",
  "ou",
  "que",
  "se",
  "eu",
  "voce",
  "você",
  "me",
  "minha",
  "meu",
  "meus",
  "minhas",
  "te",
  "tua",
  "seu",
  "sua",
  "dele",
  "dela",
  "isso",
  "isto",
  "aquele",
  "aquela",
  "aqui",
  "agora",
  "sobre",
  "como",
  "porque",
  "porquê",
  "pq",
]);

function normalizeForFingerprint(q: string) {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripStopwords(q: string) {
  const parts = q.split(" ").filter(Boolean);
  const filtered = parts.filter((w) => w.length > 2 && !STOPWORDS_PT.has(w));
  return filtered.join(" ");
}

function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function makeFingerprint(question: string) {
  const base = stripStopwords(normalizeForFingerprint(question));
  return fnv1a(base || normalizeForFingerprint(question));
}

export function checkRepeatedQuestion(params: {
  question: string;
  history: StoredItem[];
  windowMs?: number;
  maxRepeats?: number;
}): RepeatCheckResult {
  const {
    question,
    history,
    windowMs = 24 * 60 * 60 * 1000,
    maxRepeats = 3,
  } = params;

  const fp = makeFingerprint(question);
  const now = Date.now();
  const since = now - windowMs;

  const repeats = history.filter(
    (h) => h.fingerprint === fp && h.ts >= since
  ).length;

  if (repeats < maxRepeats) {
    return { allowed: true, fingerprint: fp, repeatsInWindow: repeats };
  }

  const suggestedRephrase =
    "Reformule em 1 frase com um detalhe novo (tempo, limite ou objetivo). Ex: “O que eu preciso fazer nesta semana para destravar X sem cair em Y?”";

  const guidedFollowUps = [
    "O que eu estou evitando admitir sobre isso?",
    "Qual limite eu preciso colocar para isso não me consumir?",
    "Qual é o próximo passo pequeno (10 minutos) que muda o jogo?",
    "O que eu preciso aceitar para sair do ciclo?",
  ];

  const message =
    "Você repetiu praticamente a mesma pergunta algumas vezes nas últimas 24h. Para o Tarot ficar útil (e não virar ruído), eu preciso de um ângulo novo.";

  return {
    allowed: false,
    fingerprint: fp,
    repeatsInWindow: repeats,
    message,
    suggestedRephrase,
    guidedFollowUps,
  };
}
