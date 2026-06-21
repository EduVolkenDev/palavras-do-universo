import { NextResponse } from "next/server";
import { CARDS } from "@/lib/tarot/cards";
import { getDailyMessage, getDailyVisitorKey } from "@/lib/daily/message";
import { getZonedDay, normalizeTimeZone } from "@/lib/daily/time";
import { drawThree } from "@/lib/tarot/draw3";
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
import { isPaidReadingProduct } from "@/lib/product/access";
import {
  localizeTarotCard,
  localizeDailyMessage,
  translateOraclePosition,
} from "@/lib/i18n/oracle";
import { readJsonBody } from "@/lib/http/request";

const memory: Record<string, { fingerprint: string; ts: number }[]> = {};
const freeUsage: Record<string, { day: string; used: number }> = {};
const FREE_PER_DAY = 1;

type UsageSource = "memory" | "supabase";

type ReadingBody = {
  locale?: unknown;
  question?: unknown;
  theme?: unknown;
  userId?: unknown;
  productKey?: unknown;
  timeZone?: unknown;
};

type ReadingSpreadPayload = {
  position: string;
  cardKey: string;
  name: string;
  reversed: boolean;
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
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
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

    const [{ data: readings, error: readingsError }, { data: saved, error: savedError }] =
      await Promise.all([
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

    if (readingsError) throw readingsError;
    if (savedError) throw savedError;

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

function incrementMemoryUsage(userId: string, day: string) {
  getMemoryUsage(userId, day);
  freeUsage[userId].used += 1;
}

async function getCurrentUsage(
  userId: string,
  day: string,
  remoteEnabled: boolean
) {
  if (!remoteEnabled || !hasSupabaseConfig()) {
    return { source: "memory" as const, used: getMemoryUsage(userId, day) };
  }

  try {
    await ensureSupabaseProfile(userId);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("usage_daily")
      .select("free_readings_used")
      .eq("user_id", userId)
      .eq("day", day)
      .maybeSingle();

    if (error) throw error;

    return {
      source: "supabase" as const,
      used:
        data && typeof data.free_readings_used === "number"
          ? data.free_readings_used
          : 0,
    };
  } catch (caught) {
    console.warn("Supabase usage fallback:", caught);
    return { source: "memory" as const, used: getMemoryUsage(userId, day) };
  }
}

async function incrementFreeUsage(params: {
  userId: string;
  day: string;
  used: number;
  source: UsageSource;
  remoteEnabled: boolean;
}) {
  const { userId, day, used, source, remoteEnabled } = params;

  if (remoteEnabled && source === "supabase" && hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("usage_daily").upsert(
        {
          user_id: userId,
          day,
          free_readings_used: used + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,day" }
      );

      if (error) throw error;
      return;
    } catch (caught) {
      console.warn("Supabase usage increment fallback:", caught);
    }
  }

  incrementMemoryUsage(userId, day);
}

async function persistReading(params: {
  userId: string;
  theme: string;
  question: string;
  mode: string;
  productKey: string | null;
  spread: ReadingSpreadPayload[];
  interpretation: string;
  remoteEnabled: boolean;
}): Promise<string | null> {
  if (!params.remoteEnabled || !hasSupabaseConfig()) return null;

  try {
    await ensureSupabaseProfile(params.userId);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("readings")
      .insert({
        user_id: params.userId,
        theme: params.theme,
        question: params.question,
        mode: params.mode,
        intent_key: params.productKey,
        sanitized_question: params.question,
        spread_type: "situation_obstacle_direction",
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
  userId: string;
  productKey: string;
}) {
  if (!hasSupabaseConfig()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("available_entitlements")
    .select("id, source, usage_limit, usage_count")
    .eq("user_id", params.userId)
    .eq("product_key", params.productKey)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
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
  const userId = authenticatedUser?.id ?? String(body?.userId ?? "local-user");
  const paidProduct = isPaidReadingProduct(productKey);
  if (paidProduct && !authenticatedUser) {
    return NextResponse.json(
      {
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        productKey,
      },
      { status: 401 }
    );
  }
  const entitlement = paidProduct
    ? await getAvailableEntitlement({ userId, productKey })
    : null;

  if (paidProduct && !entitlement) {
    return NextResponse.json(
      {
        error: "Entitlement required",
        paywall: true,
        productKey,
      },
      { status: 402 }
    );
  }

  // Free limit (1 por dia). Paid/unlocked readings are controlled by entitlements.
  const day = todayISO();
  const usage = paidProduct
    ? ({ source: "memory", used: 0 } as const)
    : await getCurrentUsage(userId, day, remoteEnabled);
  if (!paidProduct && usage.used >= FREE_PER_DAY) {
    return NextResponse.json(
      { error: "Free limit reached", paywall: true },
      { status: 402 }
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
    return NextResponse.json(
      {
        error: "REPEATED_QUESTION",
        title: "A resposta não muda. O ângulo muda.",
        message: repeat.message,
        suggestedRephrase: repeat.suggestedRephrase,
        guidedFollowUps: repeat.guidedFollowUps,
      },
      { status: 429 }
    );
  }

  // registra fingerprint
  memory[userId] = [
    ...history,
    { fingerprint: makeFingerprint(question), ts: Date.now() },
  ].slice(-50);
  if (!paidProduct) {
    await incrementFreeUsage({
      userId,
      day,
      used: usage.used,
      source: usage.source,
      remoteEnabled,
    });
  }

  // 1) Mode + 3 cartas
  const mode = routeMode(question);
  const spread = drawThree(CARDS);
  const spreadPayload = spread.map((d) => ({
    position: translateOraclePosition(d.position, locale),
    cardKey: d.card.key,
    name: localizeTarotCard(d.card, locale).name,
    reversed: d.reversed,
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
    ? { maxTokens: 2_000, maxCharacters: 7_500 }
    : { maxTokens: 1_300, maxCharacters: 5_000 };
  const isEnglish = locale === "en";
  const outputFormat = paidProduct
    ? isEnglish
      ? `
		Required format:
		1) INITIAL LISTENING (2-3 sentences)
		2) MANTRA (1 sentence) + plain meaning (1 sentence)
		3) THE THREE THREADS: Truth, Shadow, and Direction (1 short sentence each)
		4) READING BY POSITION
		   For each card: practical meaning (up to 2 sentences), emotional intelligence (1 sentence), and grounding (1 sentence).
		5) ACTIONS: 3 executable micro-steps of 10-20 min (1 line each)
		6) INTEGRATION RITUAL: short practice + journal sentence starting with "I choose..."
		7) DIRECT SUMMARY: 3 short bullets
		8) NEXT QUESTION: recommended question + suggestion for deeper reading
		`.trim()
      : `
		Formato obrigatório:
		1) ESCUTA INICIAL (2–3 frases)
		2) MANTRA (1 frase) + tradução simples (1 frase)
	3) TRÍADE: Verdade, Sombra e Direção (1 frase curta para cada)
	4) LEITURA POR POSIÇÃO
	   Para cada carta: significado prático (até 2 frases), inteligência emocional (1 frase) e firmeza (1 frase).
	5) AÇÕES: 3 micro-passos executáveis de 10–20 min (1 linha cada)
	6) RITUAL DE INTEGRAÇÃO: prática curta + frase de diário começando com "Eu escolho..."
		7) RESUMO DIRETO: 3 bullets curtos
		8) GANCHO: pergunta recomendada + sugestão de aprofundamento
		`.trim()
    : isEnglish
      ? `
		Required format for free reading:
		1) INITIAL LISTENING (2 sentences)
		2) MANTRA (1 sentence) + plain meaning (1 sentence)
		3) THE THREE THREADS: Truth, Shadow, and Direction (1 short sentence each)
		4) READING BY POSITION
		   For each card: practical meaning (1 sentence) and direction (1 sentence).
		5) ACTIONS: 3 objective micro-steps (1 line each)
		6) CLOSING: short ritual, 3-bullet summary, and recommended question
		`.trim()
      : `
		Formato obrigatório para leitura gratuita:
		1) ESCUTA INICIAL (2 frases)
		2) MANTRA (1 frase) + tradução simples (1 frase)
	3) TRÍADE: Verdade, Sombra e Direção (1 frase curta para cada)
	4) LEITURA POR POSIÇÃO
	   Para cada carta: significado prático (1 frase) e direção (1 frase).
	5) AÇÕES: 3 micro-passos objetivos (1 linha cada)
	6) FECHAMENTO: ritual curto, resumo em 3 bullets e pergunta recomendada
	`.trim();
  const portalMemory = await getPortalMemory(userId, remoteEnabled);
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
	Você é "Palavras do Universo", um oráculo digital premium de entretenimento, reflexão interna, inteligência emocional e clareza para decisões.
	Você usa as cartas como linguagem simbólica, não como previsão fixa.
	Você escreve com elegância, presença e mistério, MAS precisa ser fácil de entender para qualquer pessoa.

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

	Abertura diária individual deste usuário:
	${dailyOpeningText}

	Use a abertura diária como contexto de continuidade, não como repetição obrigatória. A leitura atual deve responder à pergunta, mas precisa conversar com a energia, o conselho e os símbolos já entregues para esta pessoa hoje.
	
	${outputFormat}
	
	Tema: ${theme}
	Pergunta: ${question}
	Modo: ${mode}
	
	Jogo 3 Cartas:
	${spreadText}
	
	Regras:
	- Limite editorial absoluto: no máximo ${outputLimits.maxCharacters} caracteres, incluindo títulos e espaços.
	- Complete todas as seções dentro do limite; não prolongue reflexões nem repita ideias.
	- Use no máximo 2 frases curtas por item, exceto onde o formato exigir menos.
	- Escreva toda a resposta em ${locale === "en" ? "inglês claro e natural" : "português brasileiro claro e natural"}.
	- Sem fatalismo, sem datas e sem promessas absolutas.
	- Não diga que sabe o que outra pessoa sente ou fará.
	- Foque no que é melhor para a pessoa: clareza, cuidado, limite, decisão e presença.
	- Se a pergunta envolver amor, não alimente ansiedade; devolva eixo para a pessoa.
	- Se envolver dinheiro ou carreira, traduza intuição em ação prática.
	- Se envolver dor emocional, acolha sem diagnosticar.
	- Evite metáforas difíceis; se usar, explique na “Tradução simples”.
	- Linguagem clara, brasileira, sem jargão esotérico.
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
    theme,
    question,
    mode,
    productKey: paidProduct ? productKey : null,
    spread: spreadPayload,
    interpretation,
    remoteEnabled,
  });
  if (paidProduct && entitlement?.id) {
    await consumeEntitlement(entitlement.id, userId);
  }

  // Response
  return NextResponse.json({
    ok: true,
    readingId,
    theme,
    question,
    mode,
    productKey,
    spread: spreadPayload,
    interpretation,
  });
}
