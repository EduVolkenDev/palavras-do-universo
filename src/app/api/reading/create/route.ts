import { NextResponse } from "next/server";
import { CARDS } from "@/lib/tarot/cards";
import { getDailyMessage, getDailyVisitorKey } from "@/lib/daily/message";
import { getZonedDay, normalizeTimeZone } from "@/lib/daily/time";
import {
  drawSpread,
  getSpreadForProduct,
  type SpreadType,
} from "@/lib/tarot/spreads";
import { generateReadingAI } from "@/lib/tarot/ai";
import { generateFallbackReading } from "@/lib/tarot/fallback";
import { sanitizeQuestion } from "@/lib/tarot/sanitizeQuestion";
import {
  ensureSupabaseProfile,
  getAuthenticatedUser,
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import {
  checkRepeatedQuestion,
  makeFingerprint,
} from "@/lib/tarot/repeatLimiter";
import { isPaidReadingProduct, shouldConsumeEntitlement } from "@/lib/product/access";
import { getAvailableEntitlementForProduct } from "@/lib/product/entitlements";
import { getOwnerEntitlementForProduct } from "@/lib/product/ownerAccess";
import {
  localizeTarotCard,
  localizeDailyMessage,
  translateOraclePosition,
} from "@/lib/i18n/oracle";
import { readJsonBody } from "@/lib/http/request";
import { LUME_AI_INSTRUCTIONS } from "@/lib/lume/persona";
import {
  createUserContext,
  formatPersonalizationMemory,
} from "@/lib/personalization/reading-context";

const memory: Record<string, { fingerprint: string; ts: number }[]> = {};
const freeUsage: Record<string, { day: string; used: number }> = {};
const FREE_PER_DAY = 1;
const ANONYMOUS_READING_COOKIE = "pdu_reader_id";
const ANONYMOUS_READING_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

type UsageSource = "memory" | "supabase";

type ReadingIdentity = {
  userId: string;
  anonymousUserId: string | null;
};

type ReadingBody = {
  locale?: unknown;
  onboardingFocus?: unknown;
  onboardingSignal?: unknown;
  readingProfile?: unknown;
  question?: unknown;
  theme?: unknown;
  userId?: unknown;
  productKey?: unknown;
  spreadType?: unknown;
  timeZone?: unknown;
};

type ReadingSpreadPayload = {
  position: string;
  cardKey: string;
  keyword: string;
  name: string;
  reversed: boolean;
  meaning: string;
  assetPath: string;
};

type MemoryReadingRow = {
  theme: string | null;
  question: string | null;
  mode: string | null;
  spread: unknown;
  created_at: string | null;
};

type MemorySavedMessageRow = {
  message_type: string | null;
  payload: unknown;
  created_at: string | null;
};

type ProfileMemoryRow = {
  display_name: string | null;
  favorite_themes: string[] | null;
  emotional_phase: string | null;
  sun_sign?: string | null;
  reading_profile?: unknown;
};

const EXPERIENCE_CONTRACTS: Record<
  string,
  {
    archetype: string;
    outcome: string;
    decision: string;
    emotion: string;
    ritual: string;
  }
> = {
  free_daily: {
    archetype: "espelho_de_entrada",
    outcome: "dar uma primeira clareza sem esgotar o assunto",
    decision: "sugerir um gesto pequeno e seguro para hoje",
    emotion: "nomear a sensação central com delicadeza",
    ritual: "fechar com uma prática simples de presença",
  },
  clareza_urgente: {
    archetype: "clareza_urgente",
    outcome: "transformar urgência emocional em eixo, limite e próximo passo possível",
    decision: "separar impulso, medo, necessidade real e ação segura para as próximas 24 horas",
    emotion: "acolher a pessoa sem dramatizar e devolver sensação de escolha",
    ritual: "fechar com aterramento, uma frase de proteção interna e um plano de 24 horas",
  },
  caminho_3_cartas: {
    archetype: "clareza_para_decisao",
    outcome: "transformar pergunta confusa em situação, sombra e direção",
    decision: "indicar o próximo passo mais honesto para a pessoa",
    emotion: "separar medo, desejo e possibilidade real",
    ritual: "propor micro-ações de 10 a 20 minutos",
  },
  sinais_do_amor: {
    archetype: "inteligencia_afetiva",
    outcome: "dar clareza para vínculo, limite, desejo e conversa",
    decision: "ajudar a escolher aproximação, pausa, limite ou cuidado",
    emotion: "acolher apego, expectativa e insegurança sem prometer controle sobre o outro",
    ritual: "propor um gesto de autocuidado ou comunicação madura",
  },
  energia_da_semana: {
    archetype: "ciclo_semanal",
    outcome: "organizar foco emocional para os próximos dias",
    decision: "mostrar onde colocar energia e onde não gastar força",
    emotion: "traduzir alertas internos sem fatalismo",
    ritual: "fechar com um ritual semanal de integração",
  },
  mapa_do_momento: {
    archetype: "mapa_de_fase",
    outcome: "revelar contexto, padrões e prioridade da fase atual",
    decision: "ajudar a decidir o que sustentar, soltar ou reorganizar",
    emotion: "reconhecer repetições emocionais sem reduzir a pessoa a uma carta",
    ritual: "propor um rito de integração e uma pergunta de diário",
  },
  circulo_do_universo: {
    archetype: "santuario_pessoal",
    outcome: "criar continuidade entre clareza, memória e ritual",
    decision: "conectar a resposta com escolhas internas e externas melhores para a pessoa",
    emotion: "devolver maturidade emocional e sensação de companhia íntima",
    ritual: "fechar com prática, registro e retorno ao histórico",
  },
  tirada_diamante: {
    archetype: "clareza_prismática",
    outcome: "organizar uma questão em camadas internas, externas e integradas",
    decision: "revelar o ponto que merece escolha, não mais esforço",
    emotion: "dar nitidez sem reduzir uma situação complexa a uma única resposta",
    ritual: "fechar com uma pergunta de diário e uma decisão pequena",
  },
  passaro_voando: {
    archetype: "movimento_com_altitude",
    outcome: "equilibrar sensibilidade, ação e medo em uma travessia real",
    decision: "mostrar o que é preparação e o que já pode ser movimento",
    emotion: "acolher medo sem deixá-lo dirigir a experiência",
    ritual: "fechar com um gesto corporal de expansão e um passo concreto",
  },
  a_chave: {
    archetype: "abertura_interior",
    outcome: "dar linguagem ao que estava oculto e abrir uma possibilidade de escolha",
    decision: "identificar a chave prática que libera a próxima conversa ou ação",
    emotion: "tratar conteúdos sensíveis com delicadeza e sem diagnóstico",
    ritual: "fechar com escrita privada e um cuidado de integração",
  },
  o_espelho: {
    archetype: "reflexo_relacional",
    outcome: "distinguir vínculo, projeção, necessidade e limite com maturidade",
    decision: "devolver para a pessoa o que está ao alcance dela em uma relação",
    emotion: "reduzir ansiedade sobre o outro e fortalecer autoescuta",
    ritual: "fechar com uma pergunta honesta antes de qualquer conversa",
  },
  cruz_celta: {
    archetype: "mapa_amplo",
    outcome: "organizar contexto, tensão, raízes, campo e direção de uma questão extensa",
    decision: "mostrar qual camada pede prioridade e qual não precisa ser resolvida hoje",
    emotion: "transformar complexidade em mapa legível e não em excesso de informação",
    ritual: "fechar com síntese, escolha e sequência de três passos",
  },
  relacionar: {
    archetype: "vínculo_consciente",
    outcome: "dar clareza para a energia de um encontro sem invadir a autonomia de ninguém",
    decision: "separar o que é comunicação, limite, tempo e escolha pessoal",
    emotion: "acolher desejo e insegurança sem alimentar vigilância",
    ritual: "fechar com uma frase de presença para o vínculo",
  },
  o_paradoxo: {
    archetype: "integração_de_contrários",
    outcome: "encontrar uma terceira leitura onde duas verdades parecem competir",
    decision: "ajudar a pausar antes de escolher uma falsa simplicidade",
    emotion: "normalizar ambivalência sem paralisar a pessoa",
    ritual: "fechar com silêncio, registro e um próximo gesto sem pressa",
  },
};

const EXPERIENCE_FORMATS: Record<string, string> = {
  free_daily: `
Formato de entrega para experiência gratuita:
- Entregue uma leitura simples, gentil e leve.
- Não prometa profundidade excessiva.
- Feche com uma ação pequena para hoje.
  `.trim(),
  clareza_urgente: `
Formato de entrega para Clareza Urgente:
- Trate a pergunta como um momento de pressão emocional que precisa de eixo agora.
- Inclua uma seção "PLANO DE 24 HORAS" com 3 passos: acalmar, decidir, agir.
- Inclua uma seção "LIMITE SEGURO" dizendo o que a pessoa não deve decidir no impulso.
- O tom deve ser direto, acolhedor e prático.
  `.trim(),
  caminho_3_cartas: `
Formato de entrega para Caminho das 3 Cartas:
- Estruture claramente situação, sombra e direção.
- A resposta deve resolver uma pergunta concreta.
- Inclua micro-ações simples, sem transformar em acompanhamento contínuo.
  `.trim(),
  sinais_do_amor: `
Formato de entrega para Sinais do Amor:
- Foque em vínculo, sentimento, limite e conversa madura.
- Não diga o que outra pessoa sente ou fará.
- Inclua uma seção "PERGUNTA SAUDÁVEL" reformulando a dúvida sem controle sobre o outro.
- Inclua uma ação de autocuidado ou comunicação responsável.
  `.trim(),
  energia_da_semana: `
Formato de entrega para Energia da Semana:
- Entregue como guia dos próximos 7 dias, não como resposta pontual.
- Inclua: tema da semana, alerta gentil, onde colocar energia, onde não gastar força.
- Inclua um ritual semanal e uma pergunta de diário para revisar no fim da semana.
  `.trim(),
  mapa_do_momento: `
Formato de entrega para Mapa do Momento:
- Entregue como retrato de fase, padrões e prioridade emocional.
- Inclua: fase atual, padrão recorrente, recurso disponível, direção principal.
- Use a memória do portal com mais peso quando houver recorrências reais.
- Feche com uma pergunta profunda de diário e um gesto de reorganização.
  `.trim(),
  circulo_do_universo: `
Formato de entrega para Círculo do Universo:
- Conecte a leitura à ideia de jornada contínua.
- Valorize memória, padrões, retorno ao histórico e ritual pessoal.
- Sugira o que registrar no Meu Universo.
  `.trim(),
  tirada_diamante: "Leia camadas internas, externas e a integração final como partes de uma única questão; não reduza a experiência a cinco mensagens soltas.",
  passaro_voando: "Crie uma leitura de movimento: acolha o medo, diferencie receptividade de ação e devolva uma forma concreta de ganhar altitude.",
  a_chave: "Aprofunde com delicadeza. Não trate o oculto como verdade absoluta, trauma ou diagnóstico; apresente-o como hipótese simbólica a ser observada.",
  o_espelho: "Em temas relacionais, não afirme o que a outra pessoa sente. Priorize projeção, necessidade, limite, conversa e escolha da pessoa que pergunta.",
  cruz_celta: "Construa um mapa claro: agrupe contexto, tensão, raízes, campo e integração para que dez cartas não virem ruído.",
  relacionar: "Use as quatro posições para devolver maturidade relacional, evitando previsões ou garantias sobre o outro.",
  o_paradoxo: "Honre a ambivalência. A tirada precisa revelar um novo olhar, não forçar uma resposta binária.",
};

function normalizeSpreadAxis(position: string) {
  if (position === "SITUAÇÃO" || position === "SITUATION") return "situation";
  if (position === "OBSTÁCULO" || position === "OBSTACLE") return "obstacle";
  if (position === "DIREÇÃO" || position === "DIRECTION") return "direction";
  return "position";
}

function buildSpreadCardMeaning(params: {
  locale: "pt-BR" | "en";
  question: string;
  position: string;
  cardName: string;
  keyword: string;
  reversed: boolean;
}) {
  const axis = normalizeSpreadAxis(params.position);
  const cleanQuestion = params.question.replace(/\s+/g, " ").trim();
  const suffix = cleanQuestion ? ` "${cleanQuestion}"` : "";
  const position = params.position.toLocaleLowerCase();

  if (params.locale === "en") {
    if (axis === "situation") {
      return `${params.cardName} shows where ${params.keyword} is already shaping your question${suffix} and deserves to be read before you decide.`;
    }
    if (axis === "obstacle") {
      return `${params.cardName}${params.reversed ? " reversed" : ""} reveals where ${params.keyword} can distort your question${suffix} through defense, haste, or avoidance.`;
    }
    if (axis === "direction") {
      return `${params.cardName}${params.reversed ? " reversed" : ""} points to the cleanest next movement: turn ${params.keyword} into one visible step for your question${suffix}.`;
    }
    return `${params.cardName}${params.reversed ? " reversed" : ""} speaks through the position ${position}: notice how ${params.keyword} changes the way you are holding your question${suffix}.`;
  }

  if (axis === "situation") {
    return `${params.cardName} mostra onde ${params.keyword} já está moldando sua pergunta${suffix} e precisa ser lido antes da decisão.`;
  }
  if (axis === "obstacle") {
    return `${params.cardName}${params.reversed ? " reversa" : ""} revela onde ${params.keyword} pode distorcer sua pergunta${suffix} por defesa, pressa ou evitação.`;
  }
  if (axis === "direction") {
    return `${params.cardName}${params.reversed ? " reversa" : ""} aponta o próximo movimento limpo: transforme ${params.keyword} em um passo visível para sua pergunta${suffix}.`;
  }
  return `${params.cardName}${params.reversed ? " reversa" : ""} fala a partir da posição ${position}: observe como ${params.keyword} muda a forma de sustentar sua pergunta${suffix}.`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseCookieHeader(header: string | null) {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey || !rawValue.length) continue;
    cookies.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

function isSafeAnonymousUserId(value: string) {
  return /^pdu_[a-z0-9]{12,80}$/i.test(value);
}

function createAnonymousUserId() {
  return `pdu_${crypto.randomUUID().replaceAll("-", "")}`;
}

function getRequestUserId(
  req: Request,
  authenticatedUserId: string | null,
  rawUserId: unknown
): ReadingIdentity {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const cookieUserId = cookies.get(ANONYMOUS_READING_COOKIE) ?? "";

  if (authenticatedUserId) {
    return {
      userId: authenticatedUserId,
      anonymousUserId: isSafeAnonymousUserId(cookieUserId) ? cookieUserId : null,
    };
  }

  if (isSafeAnonymousUserId(cookieUserId)) {
    return { userId: cookieUserId, anonymousUserId: cookieUserId };
  }

  const bodyUserId = typeof rawUserId === "string" ? rawUserId.trim() : "";
  const anonymousUserId = isSafeAnonymousUserId(bodyUserId)
    ? bodyUserId
    : createAnonymousUserId();

  return { userId: anonymousUserId, anonymousUserId };
}

function withAnonymousCookie<T extends NextResponse>(
  response: T,
  anonymousUserId: string | null
) {
  response.headers.set("Cache-Control", "no-store, max-age=0");

  if (!anonymousUserId) return response;

  response.cookies.set(ANONYMOUS_READING_COOKIE, anonymousUserId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ANONYMOUS_READING_COOKIE_MAX_AGE,
  });

  return response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function cleanContextText(value: unknown, max = 120) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";
}

function extractSpreadCards(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const name = asString(item.name);
      const position = asString(item.position);
      if (!name) return null;

      return {
        name,
        position,
        reversed: item.reversed === true,
      };
    })
    .filter((item): item is { name: string; position: string; reversed: boolean } =>
      Boolean(item)
    );
}

function extractSavedDailyCard(row: MemorySavedMessageRow) {
  if (row.message_type !== "daily_card" || !isRecord(row.payload)) return null;

  const card = isRecord(row.payload.card) ? row.payload.card : null;
  const reading = isRecord(row.payload.reading) ? row.payload.reading : null;
  const name = card ? asString(card.name) : "";
  const keyword = reading ? asString(reading.keyword) : "";

  if (!name) return null;

  return {
    name,
    keyword,
    reversed: card?.reversed === true,
    createdAt: row.created_at ?? "",
  };
}

function topEntries(counts: Map<string, number>, limit: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => `${label}${count > 1 ? ` (${count}x)` : ""}`);
}

async function getPortalMemory(userId: string, remoteEnabled: boolean) {
  if (!remoteEnabled || !hasSupabaseConfig()) {
    return "Sem memória remota disponível nesta leitura.";
  }

  try {
    await ensureSupabaseProfile(userId);
    const supabase = getSupabaseAdmin();

    const [
      { data: profile, error: profileError },
      { data: readings, error: readingsError },
      { data: saved, error: savedError },
    ] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, favorite_themes, emotional_phase, sun_sign, reading_profile")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("readings")
          .select("theme, question, mode, spread, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("saved_messages")
          .select("message_type, payload, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

    if (profileError) throw profileError;
    if (readingsError) throw readingsError;
    if (savedError) throw savedError;

    const profileRow = profile as ProfileMemoryRow | null;
    const readingRows = (readings ?? []) as MemoryReadingRow[];
    const savedRows = (saved ?? []) as MemorySavedMessageRow[];
    const cardCounts = new Map<string, number>();
    const themeCounts = new Map<string, number>();
    const recentQuestions = readingRows
      .map((row) => asString(row.question).trim())
      .filter(Boolean)
      .slice(0, 4);
    const savedDailyCards = savedRows
      .map(extractSavedDailyCard)
      .filter((item): item is NonNullable<ReturnType<typeof extractSavedDailyCard>> =>
        Boolean(item)
      )
      .slice(0, 5);

    for (const row of readingRows) {
      const theme = asString(row.theme);
      if (theme) themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);

      for (const card of extractSpreadCards(row.spread)) {
        cardCounts.set(card.name, (cardCounts.get(card.name) ?? 0) + 1);
      }
    }

    for (const card of savedDailyCards) {
      cardCounts.set(card.name, (cardCounts.get(card.name) ?? 0) + 1);
    }

    const lines = [
      `Leituras recentes registradas: ${readingRows.length}.`,
      `Mensagens/carta salvas recentes: ${savedRows.length}.`,
    ];

    if (profileRow) {
      const userContext = createUserContext(profileRow, "remote");
      lines.push(...formatPersonalizationMemory(userContext));
    }

    const themes = topEntries(themeCounts, 4);
    if (themes.length) lines.push(`Temas que têm aparecido: ${themes.join(", ")}.`);

    const cards = topEntries(cardCounts, 5);
    if (cards.length) lines.push(`Cartas/símbolos recorrentes: ${cards.join(", ")}.`);

    if (recentQuestions.length) {
      lines.push(
        `Perguntas recentes, em resumo: ${recentQuestions
          .map((question) => `"${question.slice(0, 120)}"`)
          .join("; ")}.`
      );
    }

    if (savedDailyCards.length) {
      lines.push(
        `Cartas do dia salvas: ${savedDailyCards
          .map((card) =>
            `${card.name}${card.reversed ? " reversa" : ""}${
              card.keyword ? ` (${card.keyword})` : ""
            }`
          )
          .join(", ")}.`
      );
    }

    lines.push(
      "Use essa memória com delicadeza: só mencione recorrências quando elas ajudarem; não invente histórico que não está aqui."
    );

    return lines.join("\n");
  } catch (caught) {
    console.warn("Portal memory unavailable:", caught);
    return "A memória do portal não pôde ser consultada agora; responda apenas pela pergunta atual e pelas cartas desta leitura.";
  }
}

function routeMode(question: string) {
  const q = question.toLowerCase();

  if (/(ansiedade|panico|depress|luto|chor|esgot|burnout)/i.test(q))
    return "CURA";
  if (
    /(trabalho|emprego|proposta|carreira|dinheiro|grana|divida|contrato)/i.test(
      q
    )
  )
    return "ANCORA";
  if (/(mentira|mentindo|traicao|trai|ciume|volta|sumiu|ghost)/i.test(q))
    return "LAMINA";
  return "NEVOA";
}

function getMemoryUsage(userId: string, day: string) {
  const current = freeUsage[userId];
  if (!current || current.day !== day) {
    freeUsage[userId] = { day, used: 0 };
  }

  return freeUsage[userId].used;
}

async function getCurrentUsage(
  userId: string,
  day: string,
  remoteEnabled: boolean,
  additionalUserIds: string[] = []
) {
  const usageUserIds = [...new Set([userId, ...additionalUserIds].filter(Boolean))];

  if (!remoteEnabled || !hasSupabaseConfig()) {
    return {
      source: "memory" as const,
      used: Math.max(...usageUserIds.map((id) => getMemoryUsage(id, day)), 0),
    };
  }

  try {
    await Promise.all(usageUserIds.map((id) => ensureSupabaseProfile(id)));
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("usage_daily")
      .select("free_readings_used")
      .in("user_id", usageUserIds)
      .eq("day", day)
      .order("free_readings_used", { ascending: false })
      .limit(1);

    if (error) throw error;

    return {
      source: "supabase" as const,
      used:
        Array.isArray(data) && typeof data[0]?.free_readings_used === "number"
          ? data[0].free_readings_used
          : 0,
    };
  } catch (caught) {
    console.warn("Supabase usage fallback:", caught);
    return {
      source: "memory" as const,
      used: Math.max(...usageUserIds.map((id) => getMemoryUsage(id, day)), 0),
    };
  }
}

async function incrementFreeUsage(params: {
  userId: string;
  day: string;
  used: number;
  source: UsageSource;
  remoteEnabled: boolean;
  additionalUserIds?: string[];
}) {
  const { userId, day, used, source, remoteEnabled, additionalUserIds = [] } =
    params;
  const usageUserIds = [...new Set([userId, ...additionalUserIds].filter(Boolean))];

  if (remoteEnabled && source === "supabase" && hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdmin();
      const results = await Promise.all(
        usageUserIds.map((usageUserId) =>
          supabase.from("usage_daily").upsert(
            {
              user_id: usageUserId,
              day,
              free_readings_used: used + 1,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,day" }
          )
        )
      );

      const failed = results.find(({ error }) => error);
      if (failed?.error) throw failed.error;
      return;
    } catch (caught) {
      console.warn("Supabase usage increment fallback:", caught);
    }
  }

  usageUserIds.forEach((usageUserId) => {
    getMemoryUsage(usageUserId, day);
    freeUsage[usageUserId].used = used + 1;
  });
}

async function claimFreeReading(params: {
  userId: string;
  anonymousUserId: string | null;
  day: string;
  remoteEnabled: boolean;
}) {
  const { userId, anonymousUserId, day, remoteEnabled } = params;
  const additionalUserIds = anonymousUserId ? [anonymousUserId] : [];

  if (remoteEnabled && hasSupabaseConfig()) {
    try {
      await Promise.all(
        [userId, ...additionalUserIds].map((id) => ensureSupabaseProfile(id))
      );
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.rpc("claim_free_reading", {
        p_user_id: userId,
        p_alias_user_id: anonymousUserId,
        p_day: day,
      });

      if (!error && typeof data === "boolean") return data;
      if (error) throw error;
    } catch (caught) {
      // Keep older environments functional until the atomic migration is applied.
      console.warn("Atomic free reading claim unavailable:", caught);
    }
  }

  const usage = await getCurrentUsage(
    userId,
    day,
    remoteEnabled,
    additionalUserIds
  );
  if (usage.used >= FREE_PER_DAY) return false;

  await incrementFreeUsage({
    userId,
    day,
    used: usage.used,
    source: usage.source,
    remoteEnabled,
    additionalUserIds,
  });
  return true;
}

async function persistReading(params: {
  userId: string;
  email?: string | null;
  locale: "pt-BR" | "en";
  theme: string;
  question: string;
  mode: string;
  productKey: string | null;
  spreadType: SpreadType;
  spread: ReadingSpreadPayload[];
  interpretation: string;
  remoteEnabled: boolean;
}): Promise<string | null> {
  if (!params.remoteEnabled || !hasSupabaseConfig()) return null;

  try {
    await ensureSupabaseProfile(params.userId, params.email);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("readings")
      .insert({
        user_id: params.userId,
        email:
          typeof params.email === "string" && params.email.includes("@")
            ? params.email.trim().toLowerCase()
            : null,
        locale: params.locale,
        theme: params.theme,
        question: params.question,
        mode: params.mode,
        intent_key: params.productKey,
        sanitized_question: params.question,
        spread_type: params.spreadType,
        spread: params.spread,
        interpretation: params.interpretation,
      })
      .select("id")
      .single();

    if (error) throw error;
    return typeof data?.id === "string" ? data.id : null;
  } catch (caught) {
    console.warn("Supabase reading persistence skipped:", caught);
    return null;
  }
}

async function getAvailableEntitlement(params: {
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
  userId: string;
  productKey: string;
}) {
  const ownerEntitlement = getOwnerEntitlementForProduct(params.user, params.productKey);
  if (ownerEntitlement) return ownerEntitlement;

  if (!hasSupabaseConfig()) return null;
  return getAvailableEntitlementForProduct({
    userId: params.userId,
    productKey: params.productKey,
  });
}

async function consumeEntitlement(entitlementId: string, userId: string) {
  if (!hasSupabaseConfig()) return;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("consume_user_entitlement", {
    p_entitlement_id: entitlementId,
    p_user_id: userId,
  });
  if (error) throw error;
  if (data !== true) throw new Error("Entitlement is no longer available");
}

export async function POST(req: Request) {
  const parsed = await readJsonBody<ReadingBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const rawQuestion = String(body?.question ?? "");
  const theme = String(body?.theme ?? "love").trim();
  const productKey = String(body?.productKey ?? "free_daily").trim();
  const requestedSpreadType = String(body?.spreadType ?? "").trim() as SpreadType;
  const productSpread = getSpreadForProduct(productKey);
  const spreadType =
    requestedSpreadType && productSpread.type === requestedSpreadType
      ? requestedSpreadType
      : productSpread.type;
  const onboardingFocus = cleanContextText(body?.onboardingFocus);
  const onboardingSignal = cleanContextText(body?.onboardingSignal, 80);
  const locale = String(body?.locale ?? "pt-BR").startsWith("en")
    ? "en"
    : "pt-BR";
  const authenticatedUser = await getAuthenticatedUser();
  const remoteEnabled = Boolean(authenticatedUser);

  const s = sanitizeQuestion(rawQuestion);
  const question = s.sanitized.trim();

  if (question.length < 8) {
    return NextResponse.json({ error: "Question too short" }, { status: 400 });
  }
  const { userId, anonymousUserId } = getRequestUserId(
    req,
    authenticatedUser?.id ?? null,
    body?.userId
  );
  const paidProduct = isPaidReadingProduct(productKey);
  if (paidProduct && !authenticatedUser) {
    return withAnonymousCookie(
      NextResponse.json(
        {
          error: "Authentication required",
          code: "AUTH_REQUIRED",
          productKey,
        },
        { status: 401 }
      ),
      anonymousUserId
    );
  }
  const entitlement = paidProduct
    ? authenticatedUser
      ? await getAvailableEntitlement({ user: authenticatedUser, userId, productKey })
      : null
    : null;

  if (paidProduct && !entitlement) {
    return withAnonymousCookie(
      NextResponse.json(
        {
          error: "Entitlement required",
          paywall: true,
          productKey,
        },
        { status: 402 }
      ),
      anonymousUserId
    );
  }

  // Free limit (1 por dia). Paid/unlocked readings are controlled by entitlements.
  const day = todayISO();
  const freeReadingClaimed = paidProduct
    ? true
    : await claimFreeReading({
        userId,
        anonymousUserId,
        day,
        remoteEnabled: hasSupabaseConfig(),
      });
  if (!paidProduct && !freeReadingClaimed) {
    return withAnonymousCookie(
      NextResponse.json(
        { error: "Free limit reached", paywall: true, code: "FREE_DAILY_LIMIT" },
        { status: 402 }
      ),
      anonymousUserId
    );
  }

  // Anti-loop (3 repetições em 24h)
  const history = memory[userId] ?? [];
  const repeat = checkRepeatedQuestion({
    question,
    history,
    windowMs: 24 * 60 * 60 * 1000,
    maxRepeats: 3,
  });

  if (!repeat.allowed) {
    return withAnonymousCookie(
      NextResponse.json(
        {
          error: "REPEATED_QUESTION",
          title: "A resposta não muda. O ângulo muda.",
          message: repeat.message,
          suggestedRephrase: repeat.suggestedRephrase,
          guidedFollowUps: repeat.guidedFollowUps,
        },
        { status: 429 }
      ),
      anonymousUserId
    );
  }

  // registra fingerprint
  memory[userId] = [
    ...history,
    { fingerprint: makeFingerprint(question), ts: Date.now() },
  ].slice(-50);

  // 1) Mode + spread escolhido para esta experiência
  const mode = routeMode(question);
  const spreadConfig = productSpread;
  const spread = drawSpread(CARDS, spreadType);
  const spreadPayload = spread.map((d) => ({
    position: translateOraclePosition(d.position, locale),
    cardKey: d.card.key,
    keyword: localizeTarotCard(d.card, locale).keywords[0],
    name: localizeTarotCard(d.card, locale).name,
    reversed: d.reversed,
    meaning: buildSpreadCardMeaning({
      locale,
      question,
      position: translateOraclePosition(d.position, locale),
      cardName: localizeTarotCard(d.card, locale).name,
      keyword: localizeTarotCard(d.card, locale).keywords[0],
      reversed: d.reversed,
    }),
    assetPath: d.card.assetPath,
  }));

  const spreadText = spread
    .map((d) => {
      const card = localizeTarotCard(d.card, locale);
      const meaning = d.reversed ? card.reversed : card.upright;
      return `${translateOraclePosition(d.position, locale)}: ${card.name}${
        d.reversed ? (locale === "en" ? " (reversed)" : " (reversa)") : ""
      } — keyword: ${card.keywords[0]} — ${meaning}`;
    })
    .join("\n");
  const experience =
    EXPERIENCE_CONTRACTS[productKey] ?? EXPERIENCE_CONTRACTS.free_daily;
  const experienceFormat =
    EXPERIENCE_FORMATS[productKey] ?? EXPERIENCE_FORMATS.free_daily;
  const outputLimits = paidProduct
    ? spreadConfig.positions.length > 7
      ? { maxTokens: 2_100, maxCharacters: 6_800 }
      : { maxTokens: 1_700, maxCharacters: 5_200 }
    : { maxTokens: 900, maxCharacters: 3_000 };
  const isEnglish = locale === "en";
  const outputFormat = paidProduct
    ? isEnglish
      ? `
		Required format:
		1) DIRECT ANSWER (2-3 short sentences that answer the question without circling around it)
		2) SPREAD MAP (1 short paragraph connecting all ${spreadConfig.positions.length} positions as one movement)
		3) CARDS
		   One bullet per position. Each bullet must include: position, card, and one practical meaning for this question.
		4) ACTIONS
		   3 concrete micro-steps. One line each. Simple enough to do today.
		5) CLOSING
		   Mantra in one line + next question in one line.
		`.trim()
      : `
		Formato obrigatório:
		1) RESPOSTA DIRETA (2-3 frases curtas que respondem sem rodeio)
		2) MAPA DA TIRADA (1 parágrafo curto conectando as ${spreadConfig.positions.length} posições como um movimento só)
		3) CARTAS
		   Um bullet por posição. Cada bullet deve trazer: posição, carta e um significado prático para esta pergunta.
		4) AÇÕES
		   3 micro-passos concretos. Uma linha cada. Simples o bastante para fazer hoje.
		5) FECHAMENTO
		   Mantra em uma linha + próxima pergunta em uma linha.
		`.trim()
    : isEnglish
      ? `
		Required format for free reading:
		1) DIRECT ANSWER (2 short sentences)
		2) CARDS
		   3 bullets only: one for each card, with practical meaning for this question.
		3) ACTIONS
		   3 objective micro-steps. One line each.
		4) CLOSING
		   Mantra in one line + next question in one line.
		`.trim()
      : `
		Formato obrigatório para leitura gratuita:
		1) RESPOSTA DIRETA (2 frases curtas)
		2) CARTAS
		   3 bullets apenas: um para cada carta, com significado prático para esta pergunta.
		3) AÇÕES
		   3 micro-passos objetivos. Uma linha cada.
		4) FECHAMENTO
		   Mantra em uma linha + próxima pergunta em uma linha.
	`.trim();
  const portalMemory = await getPortalMemory(userId, remoteEnabled);
  const localUserContext = !remoteEnabled
    ? createUserContext(body?.readingProfile, "local")
    : null;
  const localProfileMemory = localUserContext
    ? formatPersonalizationMemory(localUserContext)
    : [];
  const localOnboardingMemory =
    !remoteEnabled &&
    (onboardingFocus || onboardingSignal || localProfileMemory.length)
      ? [
          "Contexto inicial local informado antes da leitura:",
          ...localProfileMemory,
          onboardingFocus ? `Fase/tema de entrada: ${onboardingFocus}.` : "",
          onboardingSignal ? `Sinal simbólico escolhido: ${onboardingSignal}.` : "",
          "Use isso apenas como ponto de partida; não trate como diagnóstico nem como identidade fixa.",
        ]
          .filter(Boolean)
          .join("\n")
      : "";
  const dailyDay = getZonedDay(normalizeTimeZone(String(body?.timeZone ?? "")));
  const dailyOpening = localizeDailyMessage(
    getDailyMessage({
      dateKey: dailyDay.key,
      timeZone: dailyDay.timeZone,
      visitorKey: getDailyVisitorKey(userId),
    }),
    locale
  );
  const dailyOpeningText = [
    `Data local: ${dailyOpening.dateKey} (${dailyOpening.timeZone}).`,
    `Energia: ${dailyOpening.energy}.`,
    `Mensagem: ${dailyOpening.message}`,
    `Conselho: ${dailyOpening.advice}`,
    `Afirmação: ${dailyOpening.affirmation}`,
    `Cartas da abertura diária: ${dailyOpening.spread
      .map(
        (card) =>
          `${card.position}: ${card.name}${
            card.reversed
              ? locale === "en"
                ? " (reversed)"
                : " reversa"
              : ""
          } (${card.keyword})`
      )
      .join("; ")}.`,
  ].join("\n");

  const prompt = `
	${LUME_AI_INSTRUCTIONS}

	Você está dentro de "Palavras do Universo", um ritual digital premium de reflexão interna, inteligência emocional e clareza para decisões.
	Você usa as cartas como linguagem simbólica, não como previsão fixa.
	Você escreve com elegância, presença e mistério, MAS precisa ser fácil de entender para qualquer pessoa.
	A resposta deve parecer pessoal, limpa e útil, não um texto longo de oráculo.

	Contrato da experiência:
	- Arquétipo: ${experience.archetype}
	- Transformação prometida: ${experience.outcome}
	- Suporte de decisão: ${experience.decision}
	- Suporte emocional: ${experience.emotion}
	- Ritual: ${experience.ritual}

	${experienceFormat}

	Postura humana:
	- Comece acolhendo a tensão por trás da pergunta, como alguém atento e gentil.
	- Responda como se a pessoa estivesse na sua frente, sem soar terapêutico demais, robótico ou professoral.
	- Use frases como "talvez o ponto sensível aqui seja..." apenas quando fizer sentido.
	- Não reduza a pessoa à carta. A carta é uma lente; a vida dela é maior.
	- Troque julgamento por maturidade: mostre cuidado, limite e escolha possível.
	- Quando a memória mostrar recorrência real, use frases como "isso já apareceu no seu caminho como..." ou "parece que esse tema retorna pedindo...".
	- Se a memória estiver vazia, não mencione memória.

	Memória viva do portal:
	${portalMemory}

	${localOnboardingMemory}

	Abertura diária individual deste usuário:
	${dailyOpeningText}

	Use a abertura diária como contexto de continuidade, não como repetição obrigatória. A leitura atual deve responder à pergunta, mas precisa conversar com a energia, o conselho e os símbolos já entregues para esta pessoa hoje.

	Obrigatório:
	- A primeira seção deve responder diretamente a pergunta feita, com base na combinação de todas as cartas.
	- Cada carta precisa ser interpretada como parte da situação perguntada, não como significado genérico de baralho.
	- Se existir perfil do usuário na memória, adapte tom, foco, limites e ação sem dizer que está usando dados de cadastro.
	
	${outputFormat}
	
	Tema: ${theme}
	Pergunta: ${question}
	Modo: ${mode}
	
	Tirada escolhida: ${spreadConfig.label}
	Esta tirada tem ${spreadConfig.positions.length} cartas e deve respeitar a função de cada posição.
	${spreadText}
	
	Regras:
	- Limite editorial absoluto: no máximo ${outputLimits.maxCharacters} caracteres, incluindo títulos e espaços.
	- Complete todas as seções dentro do limite; corte explicações secundárias antes de aumentar o texto.
	- Nenhum parágrafo pode ter mais de 2 frases curtas ou mais de 220 caracteres.
	- Bullets devem ter no máximo 26 palavras.
	- Use palavras simples, de conversa adulta e clara. Evite termos raros, místicos demais ou acadêmicos.
	- Não repita a mesma ideia com outras palavras. Se algo já foi dito, avance.
	- Não use aberturas genéricas como "as cartas mostram que" em todas as seções.
	- Varie ritmo e vocabulário; não reutilize frases prontas de leituras anteriores quando a memória indicar recorrência.
	- Explique a carta dentro da pergunta da pessoa; não liste significado genérico de baralho.
	- Escreva toda a resposta em ${locale === "en" ? "inglês claro e natural" : "português brasileiro claro e natural"}.
	- Sem fatalismo, sem datas e sem promessas absolutas.
	- Não diga que sabe o que outra pessoa sente ou fará.
	- Foque no que é melhor para a pessoa: clareza, cuidado, limite, decisão e presença.
	- Se a pergunta envolver amor, não alimente ansiedade; devolva eixo para a pessoa.
	- Se envolver dinheiro ou carreira, traduza intuição em ação prática.
	- Se envolver dor emocional, acolha sem diagnosticar.
	- Evite metáforas difíceis; se usar uma imagem, explique em linguagem comum na própria frase.
	- Em português, use português brasileiro simples. Em inglês, use plain English natural e acessível.
	`.trim();

  // 3) IA + fallback
  let interpretation = "";
  try {
    interpretation = await generateReadingAI(prompt, outputLimits);
  } catch {
    interpretation = "";
  }

  if (!interpretation) {
    interpretation = generateFallbackReading({
      daily: dailyOpening,
      hasPortalMemory:
        !portalMemory.startsWith("Sem memória") &&
        !portalMemory.includes("não pôde ser consultada"),
      locale,
      mode,
      onboardingFocus,
      onboardingSignal,
      personalization: localUserContext?.personalizationSignals,
      productKey,
      question,
      spread: spread.map((draw) => ({
        ...draw,
        card: localizeTarotCard(draw.card, locale),
        position: translateOraclePosition(draw.position, locale),
      })),
      theme,
      userId,
    });
  }

  const readingId = await persistReading({
    userId,
    email: authenticatedUser?.email ?? null,
    locale,
    theme,
    question,
    mode,
    productKey: paidProduct ? productKey : null,
    spreadType,
    spread: spreadPayload,
    interpretation,
    remoteEnabled,
  });
  if (paidProduct && entitlement?.id && shouldConsumeEntitlement(entitlement)) {
    await consumeEntitlement(entitlement.id, userId);
  }

  // Response
  return withAnonymousCookie(
    NextResponse.json({
      ok: true,
      readingId,
      theme,
      question,
      mode,
      productKey,
      spreadType,
      spreadLabel: spreadConfig.label,
      spread: spreadPayload,
      interpretation,
    }),
    anonymousUserId
  );
}
