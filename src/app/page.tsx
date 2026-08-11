"use client";

import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Check,
  CircleDollarSign,
  Compass,
  ExternalLink,
  Feather,
  HandHeart,
  Heart,
  History,
  LifeBuoy,
  Menu,
  MoonStar,
  Quote,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  X,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  pricingPlans,
  productCards,
} from "@/lib/product/catalog";
import type { DailyMessage } from "@/lib/daily/message";
import {
  PRODUCT_DEFAULT_QUESTIONS,
  PRODUCT_THEMES,
} from "@/lib/product/access";
import {
  getLocalActiveReading,
  getLocalReadingDraft,
  getOrCreateLocalUserId,
  removeLocalImpactCommitments,
  removeLocalSavedMessages,
  saveLocalActiveReading,
  saveLocalImpactCommitment,
  saveLocalReadingDraft,
  saveLocalReadingMessage,
  type LocalActiveReading,
  type LocalImpactCommitment,
  updateLocalImpactCommitment,
} from "@/lib/client/localUniverse";
import { usePduAtmosphere } from "@/lib/ui/usePduAtmosphere";
import { usePduScrollRecovery } from "@/lib/ui/usePduScrollRecovery";
import { usePushNotifications } from "@/lib/push/usePushNotifications";
import { useI18n } from "@/components/I18nProvider";
import FeedbackDialog from "@/components/FeedbackDialog";
import { normalizeLocale, type Locale } from "@/lib/i18n/config";
import { localizeTarotCard, translateOraclePosition } from "@/lib/i18n/oracle";
import {
  getImpactAction,
  IMPACT_AREA_LABELS,
  getRecommendedImpactActions,
} from "@/lib/impact/actions";
import { CARDS } from "@/lib/tarot/cards";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";
import { PduAssetStory } from "@/components/PduAssetStory";
import { LUME_NAME } from "@/lib/lume/persona";
import { LumePresence, requestLumeOpen } from "@/components/LumeGuide";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ApiOk = {
  ok: true;
  readingId: string | null;
  theme: string;
  question: string;
  mode: string;
  spread: {
    position: string;
    cardKey: string;
    keyword?: string;
    name: string;
    reversed: boolean;
    meaning?: string;
    assetPath: string;
  }[];
  interpretation: string;
};

type ReadingSpreadCard = ApiOk["spread"][number];

type ApiPaywall = {
  error: string;
  paywall: true;
};

type ApiRepeat = {
  error: "REPEATED_QUESTION";
  title?: string;
  message: string;
  suggestedRephrase?: string;
  guidedFollowUps?: string[];
};

type ApiError = {
  error: string;
};

type HeroMarkCandidate = {
  assetPath: string;
  mobileAssetPath?: string;
};

const READING_PORTAL_MINIMUM_MS = 1200;
const READING_REQUEST_TIMEOUT_MS = 45_000;

const glossyIcons = {
  book: PDU_ASSETS.icons.book,
  bookmark: PDU_ASSETS.icons.bookmark,
  heart: PDU_ASSETS.icons.heart,
  meditation: PDU_ASSETS.icons.meditation,
  moon: PDU_ASSETS.icons.moon,
  shield: PDU_ASSETS.icons.shield,
  sprout: PDU_ASSETS.icons.sprout,
} as const;

const themeOptions = [
  { value: "love", label: "Amor", icon: Heart },
  { value: "career", label: "Carreira", icon: Compass },
  { value: "money", label: "Dinheiro", icon: CircleDollarSign },
  { value: "family", label: "Família", icon: UserRound },
  { value: "spirit", label: "Espiritual", icon: MoonStar },
];

type JourneyStep = {
  label: string;
  text: string;
  icon: LucideIcon;
  assetPath: string;
  visualClass?: string;
};

const journeySteps: JourneyStep[] = [
  {
    label: "1. Mensagem do dia",
    text: "Abre o clima emocional do dia. É uma orientação curta, não uma resposta para uma pergunta.",
    icon: Sparkles,
    assetPath: PDU_ASSETS.icons.moon,
  },
  {
    label: "2. Carta do dia",
    text: "Mostra um símbolo para contemplar. A carta ilumina um tema; a leitura aprofunda uma escolha.",
    icon: Star,
    assetPath: PDU_ASSETS.icons.sprout,
  },
  {
    label: "3. Leitura",
    text: "Você faz uma pergunta e recebe 3 cartas com direção prática, conselho e próximos passos.",
    icon: Compass,
    assetPath: PDU_ASSETS.icons.book,
  },
  {
    label: "4. Ritual",
    text: "Transforma a leitura em uma ação simples para levar a clareza para o corpo e para a rotina.",
    icon: Sun,
    assetPath: PDU_ASSETS.icons.meditation,
  },
  {
    label: "5. Meu Universo",
    text: "Guarda mensagens, leituras e padrões para você rever sua jornada com contexto.",
    icon: Bookmark,
    assetPath: PDU_ASSETS.icons.bookmark,
  },
];

const heroArtifacts = [
  {
    label: "1. Mensagem do dia",
    assetPath: PDU_ASSETS.icons.book,
  },
  {
    label: "2. Carta do dia",
    assetPath: PDU_ASSETS.icons.bookmark,
  },
  {
    label: "4. Ritual",
    assetPath: PDU_ASSETS.icons.meditation,
  },
] as const;

const portalIntentOptions = [
  {
    id: "atravessar",
    label: "Atravessar",
    purpose: "Para transições",
    theme: "spirit",
    title: "Quando algo em você já sabe que mudou.",
    from: "Ruído: tentar explicar tudo antes de sentir.",
    to: "Clareza: nomear o primeiro passo sem se violentar.",
    question: "O que eu preciso atravessar com mais presença agora?",
    assetPath: PDU_ASSETS.editorial.portal,
  },
  {
    id: "abrir",
    label: "Abrir",
    purpose: "Para amor e vínculos",
    theme: "love",
    title: "Quando o coração pede uma chave, não uma sentença.",
    from: "Ruído: procurar garantia onde existe vínculo vivo.",
    to: "Clareza: ouvir o que o sentimento está tentando ensinar.",
    question: "Que chave emocional eu ainda não estou querendo enxergar?",
    assetPath: PDU_ASSETS.editorial.key,
  },
  {
    id: "desembaçar",
    label: "Desembaçar",
    purpose: "Para decisões",
    theme: "career",
    title: "Quando a mente está cheia, mas a direção ainda respira.",
    from: "Ruído: confundir urgência com chamado.",
    to: "Clareza: separar desejo, medo e movimento possível.",
    question: "Qual direção fica mais honesta quando eu retiro a pressa?",
    assetPath: PDU_ASSETS.editorial.mirror,
  },
  {
    id: "firmar",
    label: "Firmar",
    purpose: "Para ação concreta",
    theme: "money",
    title: "Quando o invisível precisa virar gesto concreto.",
    from: "Ruído: esperar o momento perfeito para agir.",
    to: "Clareza: escolher uma atitude pequena, limpa e possível.",
    question: "Que gesto concreto sustenta melhor a minha energia hoje?",
    assetPath: PDU_ASSETS.editorial.crystal,
  },
];

const THEME_INTENT_ID: Record<string, string> = {
  spirit: "atravessar",
  love: "abrir",
  career: "desembaçar",
  money: "firmar",
};

const PT_POSITION_LABELS: Record<string, string> = {
  SITUATION: "SITUAÇÃO",
  OBSTACLE: "OBSTÁCULO",
  DIRECTION: "DIREÇÃO",
};

const ritualPrompts = [
  "Respire antes de perguntar",
  "Escolha um tema com honestidade",
  "Leia como espelho, não sentença",
];

const readingOutcomeSteps = [
  { label: "Cartas", text: "Observe o símbolo antes de procurar resposta." },
  { label: "Direção", text: "Leia o que pede atenção neste momento." },
  { label: "Gesto", text: "Escolha uma atitude possível para as próximas 24h." },
];

const ptCardInsightTemplates = [
  [
    "{card} enquadra {topic}{theme}: {keyword} aparece como primeiro sinal para ler antes de decidir.",
    "Na situação, {card} traz {keyword} para {topic}{theme}; comece separando fato, desejo e medo.",
    "{card} mostra o terreno inicial de {topic}{theme}: observe onde {keyword} já está organizando a cena.",
    "A primeira camada passa por {card}; leia esse tema como contexto vivo, não como sentença.",
  ],
  [
    "{card} mostra a tensão dentro de {topic}{theme}: {keyword} virou ponto de pressão e pede menos automático.",
    "No obstáculo, {card} revela onde {topic}{theme} pode estar sendo atravessado por defesa, excesso ou pressa.",
    "{card} mostra onde {keyword} precisa ser visto antes que a escolha saia no impulso.",
    "A sombra aparece em {card}: faça uma pausa para que {keyword} não vire repetição.",
  ],
  [
    "{card} leva a resposta para ação: use {keyword} para fazer uma escolha possível agora.",
    "Como direção, {card} pede que {topic}{theme} vire um gesto concreto guiado por {keyword}.",
    "{card} aponta o movimento mais limpo: transforme esse tema em uma decisão pequena e visível.",
    "A saída aberta por {card} não exige certeza total; pede um passo que confirme {keyword}.",
  ],
];

const enCardInsightTemplates = [
  [
    "{card} frames {topic}{theme}: {keyword} appears as the first signal to read before deciding.",
    "In the situation, {card} brings {keyword} into {topic}{theme}; begin by separating fact, desire, and fear.",
    "{card} shows the starting ground of {topic}{theme}: notice where {keyword} is already shaping the scene.",
    "The first layer moves through {card}; read this theme as living context, not a verdict.",
  ],
  [
    "{card} shows the tension inside {topic}{theme}: {keyword} has become pressure and asks for less automatic response.",
    "As the obstacle, {card} reveals where {topic}{theme} may be crossed by defense, excess, or haste.",
    "{card} shows where {keyword} needs to be seen before the choice comes from impulse.",
    "The shadow appears through {card}: pause so {keyword} does not become repetition.",
  ],
  [
    "{card} turns the answer toward action: use {keyword} to make one possible choice now.",
    "As direction, {card} asks {topic}{theme} to become one concrete gesture guided by {keyword}.",
    "{card} points to the cleanest movement: turn this theme into a small, visible decision.",
    "The way opened by {card} does not demand total certainty; it asks for one step that confirms {keyword}.",
  ],
];

const experiencePillars = [
  "Clareza emocional",
  "Firmeza nas decisões",
  "Ritual significativo",
  "Histórico que revela padrões",
];

const experienceAccessPaths = [
  {
    label: "Comece grátis",
    text: "Mensagem e Carta do Dia para criar o hábito sem compromisso.",
    icon: Sparkles,
    assetPath: PDU_ASSETS.products.messageOfTheDay,
  },
  {
    label: "Resolva uma questão",
    text: "Leituras avulsas para amor, decisões ou clareza urgente.",
    icon: Compass,
    assetPath: PDU_ASSETS.products.urgentClarity,
  },
  {
    label: "Acompanhe sua jornada",
    text: "Círculo para histórico, padrões e experiências contínuas.",
    icon: History,
    assetPath: PDU_ASSETS.ambient.allConnected,
  },
];

const atmosphereWords = [
  "clareza",
  "travessia",
  "ritual",
  "presença",
  "ciclos",
  "sinais",
  "escuta",
  "direção",
];

const floatingSymbols = [
  { label: "Mensagens salvas", assetPath: PDU_ASSETS.icons.bookmark },
  { label: "Ciclos", assetPath: PDU_ASSETS.icons.moon },
  { label: "Vínculos", assetPath: PDU_ASSETS.icons.heart },
  { label: "Ritual", assetPath: PDU_ASSETS.icons.meditation },
];

const universeFeatureTokens = [
  "Signo e fase emocional",
  "Temas favoritos",
  "Mensagens salvas",
  "Leituras anteriores",
  "Áreas da vida em foco",
  "Padrões recorrentes",
];

const productActionClass =
  "pdu-product-action mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold";

const testimonials = [
  {
    name: "Camila R.",
    location: "São Paulo, SP",
    stars: 5,
    text: "Eu esperava algo genérico, mas a leitura foi cirúrgica. Nomeou exatamente o que eu não estava conseguindo verbalizar sobre minha situação no trabalho. Fiz a Clareza Urgente e tomei uma decisão que há meses eu adiava.",
  },
  {
    name: "Thiago M.",
    location: "Belo Horizonte, MG",
    stars: 5,
    text: "Nunca fui de tarot, mas o tom aqui é diferente — sem fatalismo, sem promessa vazia. É mais como uma conversa honesta com você mesmo mediada por símbolos. Já uso a mensagem diária todo dia antes de começar o trabalho.",
  },
  {
    name: "Fernanda L.",
    location: "Florianópolis, SC",
    stars: 5,
    text: "Assino o Círculo há dois meses. O que mais me surpreendeu foi perceber padrões no meu histórico de leituras — sempre aparecem as mesmas cartas quando entro em ciclos de ansiedade. Isso sozinho já valeu a assinatura.",
  },
];

const onboardingOptions: {
  id: string;
  label: string;
  description: string;
  signal: string;
  assetPath: string;
  icon: LucideIcon;
}[] = [
  {
    id: "atravessando",
    label: "Atravessando uma transição",
    description: "Algo mudou por dentro ou por fora e pede uma direção mais limpa.",
    signal: "mudança",
    assetPath: glossyIcons.moon,
    icon: Compass,
  },
  {
    id: "decidindo",
    label: "No meio de uma decisão difícil",
    description: "Existe um caminho pedindo escolha, limite ou coragem prática.",
    signal: "decisão",
    assetPath: glossyIcons.shield,
    icon: ShieldCheck,
  },
  {
    id: "amor",
    label: "Vivendo uma questão afetiva",
    description: "Um vínculo, desejo ou expectativa precisa ser olhado com presença.",
    signal: "vínculo",
    assetPath: glossyIcons.heart,
    icon: Heart,
  },
  {
    id: "criando",
    label: "Criando algo novo",
    description: "Uma ideia, fase ou projeto quer ganhar forma sem perder alma.",
    signal: "criação",
    assetPath: glossyIcons.sprout,
    icon: Sparkles,
  },
  {
    id: "descansando",
    label: "Buscando paz interior",
    description: "O corpo e a mente pedem silêncio, integração e menos ruído.",
    signal: "recolhimento",
    assetPath: glossyIcons.meditation,
    icon: MoonStar,
  },
];

const marketplaceSignals = [
  {
    title: "Perfil público",
    text: "Bio, especialidades, idiomas e presença reconhecível.",
    icon: UserRound,
  },
  {
    title: "Preço social",
    text: "Cada profissional decide quando abrir uma faixa acessível.",
    icon: HandHeart,
  },
  {
    title: "Atendimento gratuito",
    text: "Vagas solidárias e atendimento aberto por escolha do profissional.",
    icon: Heart,
  },
  {
    title: "Briefing privado",
    text: "A conversa começa com contexto e respeito, sem exposição pública.",
    icon: ShieldCheck,
  },
] as const;

const marketplaceFlow = [
  {
    title: "Quando procurar",
    text: "Use depois de uma leitura quando o tema pedir escuta humana, acompanhamento ou presença profissional.",
    assetPath: PDU_ASSETS.icons.moon,
  },
  {
    title: "Como escolher",
    text: "Compare especialidade, idioma, estilo de cuidado e faixa de acesso antes de iniciar contato.",
    assetPath: PDU_ASSETS.icons.shield,
  },
  {
    title: "Como conectar",
    text: "Envie um briefing privado apenas quando fizer sentido continuar a conversa com alguém qualificado.",
    assetPath: PDU_ASSETS.icons.heart,
  },
] as const;

const fallbackSpread: DailyMessage["spread"] = [
  {
    position: "SITUAÇÃO",
    name: "A Lua",
    reversed: false,
    assetPath: "/tarot/cards/major-18-the-moon.webp",
    keyword: "sensibilidade",
    meaning: "Nem tudo que assusta é ameaça. Observe antes de concluir.",
  },
  {
    position: "OBSTÁCULO",
    name: "Sete de Paus",
    reversed: false,
    assetPath: "/tarot/cards/wands-seven.webp",
    keyword: "posição",
    meaning: "Defenda o que importa sem se explicar para todos.",
  },
  {
    position: "DIREÇÃO",
    name: "A Estrela",
    reversed: false,
    assetPath: "/tarot/cards/major-17-the-star.webp",
    keyword: "esperança",
    meaning: "Há uma luz discreta indicando caminho.",
  },
];

const fallbackDailyMessage: DailyMessage = {
  dateKey: "fallback",
  timeZone: "UTC",
  energy: "Recomeço silencioso",
  message:
    "Há algo se reorganizando dentro de você. Nem toda mudança chega com barulho; algumas chegam como cansaço do que já não faz sentido.",
  advice: "Não force respostas hoje. Observe o que se repete.",
  affirmation:
    "Eu confio no tempo das coisas que estão se alinhando para mim.",
  reflection:
    "O que eu estou tentando controlar que poderia apenas observar?",
  ritual:
    "Escreva uma frase que começa com: hoje eu solto a pressa de...",
  spread: fallbackSpread,
};

const productIconVisuals: Record<
  string,
  {
    assetPath: string;
    mobileAssetPath?: string;
    fallbackIcon: LucideIcon;
    tone: "gold" | "mint" | "blue" | "rose";
    variant?: "three-card-path";
  }
> = {
  "Mensagem do Dia": {
    assetPath: PDU_ASSETS.products.messageOfTheDay,
    fallbackIcon: Sparkles,
    tone: "gold",
  },
  "Carta do Dia": {
    assetPath: PDU_ASSETS.products.cardOfTheDayDisplay,
    mobileAssetPath: PDU_ASSETS.products.cardOfTheDayMobile,
    fallbackIcon: MoonStar,
    tone: "blue",
  },
  "Clareza Urgente": {
    assetPath: PDU_ASSETS.products.urgentClarity,
    fallbackIcon: LifeBuoy,
    tone: "rose",
  },
  "Caminho das 3 Cartas": {
    assetPath: PDU_ASSETS.products.threeCardPath,
    mobileAssetPath: PDU_ASSETS.products.threeCardPathMobile,
    fallbackIcon: Compass,
    tone: "mint",
    variant: "three-card-path",
  },
  "Sinais do Amor": {
    assetPath: PDU_ASSETS.products.loveSignalsDisplay,
    mobileAssetPath: PDU_ASSETS.products.loveSignalsMobile,
    fallbackIcon: Heart,
    tone: "rose",
  },
  "Energia da Semana": {
    assetPath: PDU_ASSETS.products.weekEnergyDisplay,
    mobileAssetPath: PDU_ASSETS.products.weekEnergyMobile,
    fallbackIcon: Sun,
    tone: "gold",
  },
  "Mapa do Momento": {
    assetPath: PDU_ASSETS.products.momentMapDisplay,
    mobileAssetPath: PDU_ASSETS.products.momentMapMobile,
    fallbackIcon: UserRound,
    tone: "blue",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asApiError(value: unknown): ApiError {
  if (isRecord(value) && typeof value.error === "string") {
    return { error: value.error };
  }

  return { error: "Erro inesperado" };
}

function getReadingShareText(reading: string) {
  if (!reading) return "Minha mensagem de hoje no Palavras do Universo.";
  return reading.split("\n").filter(Boolean).slice(0, 4).join("\n");
}

function shouldUseInstantScroll() {
  if (typeof window === "undefined") return true;

  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function scrollToId(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: shouldUseInstantScroll() ? "auto" : "smooth" });
}

const fallbackHeroMark =
  PDU_ASSETS.brand.heroMarkRotation[
    PDU_ASSETS.brand.heroMarkRotation.length - 1
  ];

function isUuid(value: string | null) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      )
  );
}

function splitReadingIntoBlocks(reading: string) {
  const clean = reading
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^#{1,6}\s*/g, "")
        .replace(/^\s*[-*_]{3,}\s*$/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/^>\s?/g, "")
        .trim()
    )
    .filter((line) => line && !/^[^\p{L}\p{N}]*palavras do universo$/iu.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return [];

  const blocks = clean
    .split(
      /\n(?=(?:\d\)\s|DIRECT ANSWER|RESPOSTA DIRETA|INITIAL LISTENING|THE THREE THREADS|READING BY POSITION|ACTIONS|INTEGRATION|MANTRA|TR[IÍ]ADE|LEITURA|AÇÕES|ACOES|RESUMO|GANCHO))/i
    )
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.length ? blocks : [clean];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stableTextHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;

    try {
      data = JSON.parse(text);
    } catch {
      data = { error: "Resposta inválida do servidor" };
    }

    return { response, data };
  } finally {
    window.clearTimeout(timer);
  }
}

function fillTextTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

function firstMeaningfulLine(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !/^\d\)\s/.test(line) &&
        !/^(MANTRA|TR[IÍ]ADE|AÇÕES|ACOES|ACTIONS|INTEGRATION|INTEGRAÇÃO)$/i.test(
          line
        )
    );
}

function getReadingMantra(reading: string, fallback: string) {
  const match = reading.match(
    /(?:^|\n)\s*(?:\d\)\s*)?MANTRA\s*\n+([\s\S]*?)(?=\n\s*(?:\d\)\s*)?(?:TR[IÍ]ADE|THE THREE THREADS|LEITURA|READING BY POSITION|AÇÕES|ACTIONS|INTEGRAÇÃO|INTEGRATION)\b|$)/i
  );
  const line = match ? firstMeaningfulLine(match[1]) : "";
  return line?.replace(/^[-•]\s*/, "") || fallback;
}

function localizeReadingPosition(position: string, locale: Locale) {
  if (locale === "en") {
    return translateOraclePosition(position, locale);
  }

  return PT_POSITION_LABELS[position.toUpperCase()] ?? position;
}

function localizeReadingSpreadCard(
  card: ReadingSpreadCard,
  locale: Locale
): ReadingSpreadCard {
  const sourceCard = CARDS.find((item) => item.key === card.cardKey);
  const localizedCard = sourceCard ? localizeTarotCard(sourceCard, locale) : null;
  const meaning = localizedCard
    ? card.reversed
      ? localizedCard.reversed
      : localizedCard.upright
    : card.meaning;

  return {
    ...card,
    position: localizeReadingPosition(card.position, locale),
    name: localizedCard?.name ?? card.name,
    keyword: localizedCard?.keywords[0] ?? card.keyword,
    meaning,
    assetPath: localizedCard?.assetPath ?? card.assetPath,
  };
}

function buildLocalizedReadingText(params: {
  cards: ReadingSpreadCard[];
  locale: Locale;
  dailyOpening: DailyMessage;
}) {
  const isEnglish = params.locale === "en";
  const reversedSuffix = isEnglish ? " (reversed)" : " reversa";
  const title = isEnglish
    ? "READING IN THE SELECTED LANGUAGE"
    : "LEITURA NO IDIOMA SELECIONADO";
  const direct = isEnglish
    ? "Read this answer through the question you opened and the three cards now visible."
    : "Leia esta resposta a partir da pergunta que você abriu e das três cartas agora visíveis.";
  const advice = isEnglish
    ? "Choose one small, visible action today before trying to solve the whole path."
    : "Escolha uma ação pequena e visível hoje antes de tentar resolver todo o caminho.";
  const cardLines = params.cards.map((card) => {
    const name = `${card.name}${card.reversed ? reversedSuffix : ""}`;
    return `- ${card.position}: ${name} — ${card.meaning ?? ""}`;
  });

  return [
    title,
    "",
    isEnglish ? "1) DIRECT ANSWER" : "1) RESPOSTA DIRETA",
    direct,
    "",
    isEnglish ? "2) CARDS" : "2) CARTAS",
    ...cardLines,
    "",
    isEnglish ? "3) ADVICE" : "3) CONSELHO",
    advice,
    "",
    isEnglish ? "4) MANTRA" : "4) MANTRA",
    params.dailyOpening.affirmation ||
      (isEnglish
        ? "I can listen with honesty and move with calm."
        : "Eu posso me escutar com honestidade e agir com calma."),
  ].join("\n");
}

function getReadingAction(reading: string, fallback: string) {
  const match = reading.match(
    /(?:^|\n)\s*(?:\d\)\s*)?(?:AÇÕES|ACOES|ACTIONS)\s*\n+([\s\S]*?)(?=\n\s*(?:\d\)\s*)?(?:INTEGRAÇÃO|INTEGRATION|RITUAL|RESUMO|SUMMARY)\b|$)/i
  );
  const line = match ? firstMeaningfulLine(match[1]) : "";
  return line?.replace(/^[-•]\s*/, "") || fallback;
}

function getCardInsightFromReading(
  reading: string,
  card: {
    keyword?: string;
    meaning?: string;
    name: string;
    position: string;
    reversed?: boolean;
  },
  fallback?: string,
  context?: {
    dailyKey?: string;
    index?: number;
    locale: string;
    question: string;
    themeLabel?: string;
  }
) {
  const deckMeaning = card.meaning || fallback || "";
  if (!reading) return getContextualCardInsight(card, deckMeaning, context);
  const section = reading.match(
    new RegExp(
      `(?:^|\\n)\\s*(?:[-•]\\s*)?(?:${escapeRegExp(
        card.position
      )}\\s*(?:[—:-]|\\||em|:)\\s*)?${escapeRegExp(
        card.name
      )}(?:\\s*\\([^)]*\\))?[\\s\\S]*?(?=\\n\\s*(?:[-•]\\s*)?(?:[A-ZÁ-Ú][\\p{L}\\s]+\\s*[—:-]\\s*)?[A-ZÁ-Ú][\\p{L}\\s]+(?:\\s*\\([^)]*\\))?\\s*(?:[—:-]|\\n)|\\n\\s*\\d\\)\\s|$)`,
      "iu"
    )
  )?.[0];
  const practice = section?.match(
    /(?:Na prática|Significado prático|Practical meaning|In practice|Direção|Direction):\s*([^\n]+)/i
  )?.[1];
  const firstLine = section ? firstMeaningfulLine(section.replace(card.name, "")) : "";
  const candidate = practice?.trim() || firstLine?.replace(/^[-•]\s*/, "").trim();
  if (
    candidate &&
    candidate.length > 24 &&
    !isGenericDeckMeaning(candidate, deckMeaning) &&
    !/^(significado prático|practical meaning|direção|direction)$/i.test(candidate)
  ) {
    return candidate;
  }
  return getContextualCardInsight(card, deckMeaning, context);
}

function isGenericDeckMeaning(candidate: string, deckMeaning: string) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const a = normalize(candidate);
  const b = normalize(deckMeaning);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function getContextualCardInsight(
  card: { position: string; name: string; reversed?: boolean; keyword?: string },
  deckMeaning: string,
  context?: { dailyKey?: string; index?: number; locale: string; question: string; themeLabel?: string }
) {
  const isEnglish = context?.locale === "en";
  const position = card.position.toLowerCase();
  const question = context?.question?.trim();
  const topic = question
    ? isEnglish
      ? `your question "${question}"`
      : `sua pergunta "${question}"`
    : isEnglish
      ? "this moment"
      : "este momento";
  const theme = context?.themeLabel
    ? isEnglish
      ? ` in ${context.themeLabel}`
      : ` em ${context.themeLabel}`
    : "";
  const orientation = card.reversed
    ? isEnglish
      ? "as a point of resistance"
      : "como ponto de resistência"
    : isEnglish
      ? "as a usable resource"
      : "como recurso disponível";
  const base = deckMeaning
    .replace(/\s+/g, " ")
    .replace(/[.!?]\s.*$/, "")
    .trim();
  const positionIndex =
    typeof context?.index === "number"
      ? context.index
      : position.includes("obst") || position.includes("shadow") || position.includes("sombra")
        ? 1
        : position.includes("dire") || position.includes("direction")
          ? 2
          : 0;
  const templates = isEnglish ? enCardInsightTemplates : ptCardInsightTemplates;
  const templateGroup = templates[positionIndex] ?? templates[0];
  const hash = stableTextHash(
    [
      context?.dailyKey ?? "",
      context?.question ?? "",
      context?.themeLabel ?? "",
      card.position,
      card.name,
      card.reversed ? "r" : "u",
      base,
    ].join("|")
  );
  const template = templateGroup[hash % templateGroup.length];

  return fillTextTemplate(template, {
    card: card.name,
    keyword: card.keyword || base.split(" ")[0] || (isEnglish ? "presence" : "presença"),
    meaning: base || (isEnglish ? "the first honest signal" : "o primeiro sinal honesto"),
    theme,
    topic,
    orientation,
  });
}

function isPrefixPriceCadence(cadence: string) {
  const normalized = cadence.trim().toLowerCase();
  return normalized === "a partir de" || normalized === "starting at";
}

function OnboardingIconOption({
  option,
  onSelect,
}: {
  option: (typeof onboardingOptions)[number];
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="pdu-onboarding-option group relative min-h-[230px] overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#f4d58d]/45 hover:bg-white/[0.075] hover:shadow-[0_22px_70px_rgba(0,0,0,0.28)] focus:outline-none focus:ring-2 focus:ring-[#f4d58d]/55"
    >
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f4d58d]/12 blur-2xl" />
        <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-[#a7d7c5]/10 blur-2xl" />
      </div>
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <span className="pdu-onboarding-option__visual relative -ml-3 -mt-3 grid h-28 w-28 place-items-center">
            <Image
              src={option.assetPath}
              alt=""
              width={224}
              height={224}
              className="pdu-onboarding-option__image h-28 w-28 object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.38)] transition duration-300 group-hover:scale-105"
            />
            <Icon
              size={20}
              strokeWidth={1.7}
              className="absolute bottom-1 right-1 rounded-full border border-[#f4d58d]/24 bg-[#0f0e19]/78 p-1 text-[#f5d896] opacity-70"
            />
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#a7d7c5]">
            {option.signal}
          </span>
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight text-[#fff7e8]">
            {option.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#bfb5ad]">
            {option.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const { locale, t } = useI18n();
  const [userId, setUserId] = useState("");
  const [theme, setTheme] = useState("love");
  const [portalIntentId, setPortalIntentId] = useState("atravessar");
  const [readingProductKey, setReadingProductKey] = useState("free_daily");
  const [resumeCheckoutProduct, setResumeCheckoutProduct] = useState<string | null>(null);
  const [question, setQuestion] = useState(
    "O que eu preciso enxergar sobre o meu momento?"
  );
  const [suggestedQuestionSource, setSuggestedQuestionSource] = useState(
    "O que eu preciso enxergar sobre o meu momento?"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultLocale, setResultLocale] = useState<Locale | null>(null);
  const [spreadLine, setSpreadLine] = useState("");
  const [spreadCards, setSpreadCards] = useState<ApiOk["spread"]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [readingNotice, setReadingNotice] = useState("");
  const [paywall, setPaywall] = useState<ApiPaywall | null>(null);
  const [repeat, setRepeat] = useState<ApiRepeat | null>(null);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const initialImpactAction = getRecommendedImpactActions("love")[0];
  const [impactActionKey, setImpactActionKey] = useState(initialImpactAction.key);
  const [impactPlan, setImpactPlan] = useState(initialImpactAction.suggestedPlan);
  const [impactBeneficiary, setImpactBeneficiary] = useState("");
  const [impactFirstStep, setImpactFirstStep] = useState("");
  const [impactScheduledFor, setImpactScheduledFor] = useState("");
  const [impactCommitment, setImpactCommitment] =
    useState<LocalImpactCommitment | null>(null);
  const [impactNotice, setImpactNotice] = useState("");
  const [impactSaving, setImpactSaving] = useState(false);
  const [invitedBy, setInvitedBy] = useState("");
  const [showInvitedAction, setShowInvitedAction] = useState(false);
  const [dailyOpening, setDailyOpening] =
    useState<DailyMessage>(fallbackDailyMessage);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingFocusId, setOnboardingFocusId] = useState("");
  const [readingStateHydrated, setReadingStateHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedHeroMark, setSelectedHeroMark] =
    useState<HeroMarkCandidate>(fallbackHeroMark);
  const hasRestoredReadingStateRef = useRef(false);
  const shouldScrollToOpenedReadingRef = useRef(false);
  const startCheckoutRef = useRef<(productKey: string) => Promise<void>>(
    async () => undefined
  );

  usePduAtmosphere();
  usePduScrollRecovery();
  const push = usePushNotifications();

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    setUserId(getOrCreateLocalUserId());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function pickHeroMark() {
      try {
        const surface = window.matchMedia("(max-width: 768px)").matches
          ? "mobile"
          : "desktop";
        const response = await fetch(`/api/assets/hero-marks?surface=${surface}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as { marks?: HeroMarkCandidate[] };
        const marks = Array.isArray(data.marks) ? data.marks : [];

        if (cancelled || marks.length === 0) return;

        const randomValue =
          typeof window.crypto?.getRandomValues === "function"
            ? window.crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now()
            : Date.now();

        setSelectedHeroMark(marks[randomValue % marks.length] ?? fallbackHeroMark);
      } catch {
        // The stable brand mark remains visible if the manifest request fails.
      }
    }

    void pickHeroMark();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleHeroMarkError() {
    setSelectedHeroMark(fallbackHeroMark);
  }

  useEffect(() => {
    if (hasRestoredReadingStateRef.current) return;
    hasRestoredReadingStateRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const hasRouteOverride =
      params.has("product") || params.has("acao") || params.has("corrente");

    if (!hasRouteOverride) {
      const storedDraft = getLocalReadingDraft();
      if (storedDraft) {
        setTheme(storedDraft.theme);
        setReadingProductKey(storedDraft.product_key);
        setSuggestedQuestionSource(storedDraft.suggested_question_source);
        setQuestion(
          storedDraft.suggested_question_source
            ? t(storedDraft.suggested_question_source)
            : storedDraft.question
        );
        if (
          portalIntentOptions.some(
            (option) => option.id === storedDraft.portal_intent_id
          )
        ) {
          setPortalIntentId(storedDraft.portal_intent_id);
        }
      }

      const storedReading = getLocalActiveReading();
      if (storedReading && storedReading.locale === locale) {
        setTheme(storedReading.theme);
        setReadingProductKey(storedReading.product_key);
        setSuggestedQuestionSource(storedReading.suggested_question_source);
        setQuestion(
          storedReading.suggested_question_source
            ? t(storedReading.suggested_question_source)
            : storedReading.question
        );
        setSpreadLine(storedReading.spread_line);
        setSpreadCards(storedReading.spread_cards);
        setResult(storedReading.result);
        setResultLocale(normalizeLocale(storedReading.locale));
        setReadingId(storedReading.reading_id);
        if (
          portalIntentOptions.some(
            (option) => option.id === storedReading.portal_intent_id
          )
        ) {
          setPortalIntentId(storedReading.portal_intent_id);
        }
      }
    }

    setReadingStateHydrated(true);
  }, [locale, t]);

  useEffect(() => {
    const storedFocus = localStorage.getItem("pdu_focus") ?? "";
    if (storedFocus) setOnboardingFocusId(storedFocus);
    const seen = localStorage.getItem("pdu_onboarding_done");
    if (!seen) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShowOnboarding(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const activeUserId = userId || getOrCreateLocalUserId();
    if (!userId) setUserId(activeUserId);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams({
      tz: timeZone,
      locale,
      userId: activeUserId,
    });

    fetch(`/api/daily-message?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!isRecord(data) || !isRecord(data.daily)) return;
        setDailyOpening(data.daily as DailyMessage);
      })
      .catch(() => {
        // O fallback local mantém a home funcional se a abertura diária falhar.
      });

    return () => controller.abort();
  }, [locale, userId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");
    const resume = params.get("resume");
    const invitedActionKey = params.get("acao");
    const chainId = params.get("corrente");

    if (invitedActionKey) {
      const invitedAction = getImpactAction(invitedActionKey);
      if (invitedAction) {
        setShowInvitedAction(true);
        setImpactActionKey(invitedAction.key);
        setImpactPlan(invitedAction.suggestedPlan);
        setInvitedBy(isUuid(chainId) ? chainId ?? "" : "");
        window.setTimeout(() => scrollToId("acao"), 160);
      }
    }

    const isCheckoutProduct = Boolean(
      product &&
        (productCards.some((item) => item.productKey === product) ||
          pricingPlans.some((item) => item.productKey === product))
    );
    if (resume === "checkout" && isCheckoutProduct && product) {
      setResumeCheckoutProduct(product);
    }

    if (!product || !PRODUCT_DEFAULT_QUESTIONS[product]) return;

    setReadingProductKey(product);
    setTheme(PRODUCT_THEMES[product] ?? "spirit");
    setSuggestedQuestionSource(PRODUCT_DEFAULT_QUESTIONS[product]);
    setQuestion(PRODUCT_DEFAULT_QUESTIONS[product]);
    window.setTimeout(
      () => scrollToId(resume === "checkout" ? "produtos" : "leitura"),
      120
    );
  }, []);

  const selectedTheme = useMemo(
    () => themeOptions.find((option) => option.value === theme),
    [theme]
  );
  const SelectedThemeIcon = selectedTheme?.icon;
  const selectedPortalIntent = useMemo(
    () =>
      portalIntentOptions.find((option) => option.id === portalIntentId) ??
      portalIntentOptions[0],
    [portalIntentId]
  );
  const localizedAtmosphereWords = useMemo(
    () => atmosphereWords.map((word) => t(word)),
    [t]
  );
  const impactActions = useMemo(() => getRecommendedImpactActions(theme), [theme]);

  useEffect(() => {
    if (suggestedQuestionSource) {
      setQuestion(t(suggestedQuestionSource));
    }
  }, [locale, suggestedQuestionSource, t]);

  useEffect(() => {
    if (!readingStateHydrated) return;
    saveLocalReadingDraft({
      theme,
      portalIntentId,
      productKey: readingProductKey,
      question,
      suggestedQuestionSource,
    });
  }, [
    question,
    readingProductKey,
    readingStateHydrated,
    suggestedQuestionSource,
    theme,
    portalIntentId,
  ]);

  useEffect(() => {
    if (!shouldScrollToOpenedReadingRef.current) return;
    if (!loading && !result) return;

    const timer = window.setTimeout(() => {
      // During the ritual, show Lume's opening state. Once the new spread is
      // ready, return to the top of the reading so the three cards are the
      // first thing the person sees instead of opening below the fold.
      scrollToId(loading ? "reading-opened" : "leitura");
      if (!loading && result) {
        shouldScrollToOpenedReadingRef.current = false;
      }
    }, loading ? 180 : 90);

    return () => window.clearTimeout(timer);
  }, [loading, result]);

  const canRun = useMemo(
    () => !loading,
    [loading]
  );

  function restoreActiveReading(
    storedReading: LocalActiveReading,
    notice?: string
  ) {
    setTheme(storedReading.theme);
    setReadingProductKey(storedReading.product_key);
    setSuggestedQuestionSource(storedReading.suggested_question_source);
    setQuestion(
      storedReading.suggested_question_source
        ? t(storedReading.suggested_question_source)
        : storedReading.question
    );
    setSpreadLine(storedReading.spread_line);
    setSpreadCards(storedReading.spread_cards);
    setResult(storedReading.result);
    setResultLocale(normalizeLocale(storedReading.locale));
    setReadingId(storedReading.reading_id);
    saveLocalReadingMessage({
      readingId: storedReading.reading_id,
      payload: {
        savedAt: storedReading.updated_at,
        locale: storedReading.locale,
        theme: storedReading.theme,
        productKey: storedReading.product_key,
        question: storedReading.question,
        spreadLine: storedReading.spread_line,
        spreadCards: storedReading.spread_cards,
        result: storedReading.result,
      },
    });
    if (
      portalIntentOptions.some(
        (option) => option.id === storedReading.portal_intent_id
      )
    ) {
      setPortalIntentId(storedReading.portal_intent_id);
    }
    if (notice) setReadingNotice(notice);
    shouldScrollToOpenedReadingRef.current = true;
  }

  async function run(customQuestion?: string) {
    const q = (customQuestion ?? question).trim();
    if (q.length < 8) {
      setPaywall(null);
      setRepeat(null);
      setError("Escreva uma pergunta com pelo menos 8 caracteres para abrir a leitura.");
      return;
    }

    const activeUserId = userId || getOrCreateLocalUserId();
    if (!userId) setUserId(activeUserId);
    const previousActiveReading = getLocalActiveReading();

    shouldScrollToOpenedReadingRef.current = true;
    setLoading(true);
    setResult("");
    setResultLocale(null);
    setSpreadLine("");
    setSpreadCards([]);
    setReadingId(null);
    setPaywall(null);
    setRepeat(null);
    setError("");
    setSaved(false);
    setSaveNotice("");
    setReadingNotice("");

    try {
      const [{ response: res, data }] = await Promise.all([
        fetchJsonWithTimeout("/api/reading/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: activeUserId,
            theme,
            question: q,
            productKey: readingProductKey,
            locale,
            onboardingFocus: onboardingFocusOption
              ? t(onboardingFocusOption.label)
              : "",
            onboardingSignal: onboardingFocusOption?.signal ?? "",
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }, READING_REQUEST_TIMEOUT_MS),
        new Promise((resolve) =>
          window.setTimeout(resolve, READING_PORTAL_MINIMUM_MS)
        ),
      ]);

      if (res.status === 402 && isRecord(data)) {
        setPaywall({
          error:
            typeof data.error === "string"
              ? data.error
              : "Free limit reached",
          paywall: true,
        });
        if (previousActiveReading) {
          restoreActiveReading(
            previousActiveReading,
            t("Você já usou a leitura gratuita de hoje. Reabrimos sua última tirada para você rever as cartas, o conselho e o caminho indicado.")
          );
        } else {
          setError(
            t("Você já usou a leitura gratuita de hoje. Crie uma conta grátis para proteger e rever esta tirada no Meu Universo, sem precisar assinar um plano.")
          );
        }
        return;
      }

      if (res.status === 429 && isRecord(data)) {
        setRepeat({
          error: "REPEATED_QUESTION",
          title: typeof data.title === "string" ? data.title : undefined,
          message:
            typeof data.message === "string"
              ? data.message
              : "Vamos mudar o ângulo da pergunta.",
          suggestedRephrase:
            typeof data.suggestedRephrase === "string"
              ? data.suggestedRephrase
              : undefined,
          guidedFollowUps: Array.isArray(data.guidedFollowUps)
            ? data.guidedFollowUps.filter(
                (item): item is string => typeof item === "string"
              )
            : [],
        });
        return;
      }

      if (!res.ok) {
        setError(asApiError(data).error);
        return;
      }

      if (!isRecord(data) || data.ok !== true) {
        setError("Resposta incompleta do servidor");
        return;
      }

      const ok = data as ApiOk;
      const line = ok.spread
        .map((card) => {
          const reversed = card.reversed
            ? locale === "en"
              ? " (reversed)"
              : " reversa"
            : "";
          return `${card.position}: ${card.name}${reversed}`;
        })
        .join(" | ");

      setSpreadLine(line);
      setSpreadCards(ok.spread);
      setResult(ok.interpretation);
      setResultLocale(locale);
      setReadingId(ok.readingId);
      saveLocalActiveReading({
        locale,
        theme,
        portalIntentId,
        productKey: readingProductKey,
        question: q,
        suggestedQuestionSource,
        spreadLine: line,
        spreadCards: ok.spread,
        result: ok.interpretation,
        readingId: ok.readingId,
      });
      saveLocalReadingMessage({
        readingId: ok.readingId,
        payload: {
          savedAt: new Date().toISOString(),
          locale,
          theme,
          productKey: readingProductKey,
          question: q,
          spreadLine: line,
          spreadCards: ok.spread,
          result: ok.interpretation,
        },
      });
      if (!invitedBy && !impactCommitment) {
        const recommended = getRecommendedImpactActions(theme)[0];
        setImpactActionKey(recommended.key);
        setImpactPlan(recommended.suggestedPlan);
      }
    } catch (caught) {
      const previousActiveReading = getLocalActiveReading();
      if (previousActiveReading) {
        restoreActiveReading(
          previousActiveReading,
          t("A conexão caiu durante a nova leitura. Reabrimos sua última tirada salva para você não perder o fio.")
        );
      }
      const networkMessage =
        caught instanceof DOMException && caught.name === "AbortError"
          ? t("A leitura demorou mais que o esperado. Sua última tirada continua disponível e você pode tentar novamente em instantes.")
          : t("A conexão oscilou antes da leitura abrir. Nada foi perdido; tente novamente quando a página estabilizar.");
      setError(networkMessage);
    } finally {
      setLoading(false);
    }
  }

  function selectThemeOption(nextTheme: string) {
    setTheme(nextTheme);

    const mappedIntentId = THEME_INTENT_ID[nextTheme];
    if (!mappedIntentId) return;

    const mappedIntent = portalIntentOptions.find(
      (option) => option.id === mappedIntentId
    );
    if (!mappedIntent) return;

    setPortalIntentId(mappedIntent.id);

    const trimmedQuestion = question.trim();
    const translatedSuggestedQuestion = t(suggestedQuestionSource).trim();
    const canRefreshSuggestedQuestion =
      !trimmedQuestion || trimmedQuestion === translatedSuggestedQuestion;

    if (canRefreshSuggestedQuestion) {
      setSuggestedQuestionSource(mappedIntent.question);
      setQuestion(t(mappedIntent.question));
    }
  }

  function openPortalIntent(intent: (typeof portalIntentOptions)[number]) {
    setPortalIntentId(intent.id);
    setReadingProductKey("free_daily");
    setTheme(intent.theme);
    setSuggestedQuestionSource(intent.question);
    setQuestion(t(intent.question));
  }

  async function saveReading() {
    if (!result) return;

    const activeUserId = userId || getOrCreateLocalUserId();
    if (!userId) setUserId(activeUserId);

    const payload = {
      savedAt: new Date().toISOString(),
      locale,
      theme,
      productKey: readingProductKey,
      question,
      spreadLine,
      spreadCards,
      result,
    };

    const localMessage = saveLocalReadingMessage({
      readingId,
      payload,
    });
    setSaved(true);
    setSaveNotice("Leitura salva neste navegador. Sincronizando com o histórico...");

    try {
      const res = await fetch("/api/saved-messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientKey: localMessage.id,
          readingId,
          messageType: "reading",
          payload,
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      removeLocalSavedMessages([localMessage.id]);
      setSaved(true);
      setSaveNotice("Leitura guardada no seu histórico.");
    } catch {
      setSaved(true);
      setSaveNotice("Leitura salva neste navegador. Depois sincronizamos com sua conta.");
    }
  }

  async function shareReading() {
    const text = getReadingShareText(result || dailyOpening.message);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Palavras do Universo",
          text,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // User cancelled native share sheet.
    }
  }

  function selectImpactAction(actionKey: string) {
    const action = getImpactAction(actionKey);
    if (!action) return;
    setImpactActionKey(action.key);
    setImpactPlan(action.suggestedPlan);
    setImpactCommitment(null);
    setImpactNotice("");
    setImpactBeneficiary("");
    setImpactFirstStep("");
    setImpactScheduledFor("");
  }

  async function commitImpactAction() {
    const action = getImpactAction(impactActionKey);
    const plan = impactPlan.trim();
    if (!action || plan.length < 8) return;

    setImpactSaving(true);
    setImpactNotice("");
    const localCommitment = saveLocalImpactCommitment({
      actionKey: action.key,
      actionTitle: action.title,
      area: action.area,
      plan,
      beneficiary: impactBeneficiary.trim(),
      firstStep: impactFirstStep.trim(),
      scheduledFor: impactScheduledFor || null,
      sourceReadingId: readingId,
      invitedBy,
      existingId: impactCommitment?.id,
      publicToken: impactCommitment?.public_token,
      publicCompletionSecret: impactCommitment?.public_completion_secret,
      rootChainToken: impactCommitment?.root_chain_token,
      parentPublicToken: impactCommitment?.parent_public_token ?? invitedBy,
    });
    setImpactCommitment(localCommitment);

    try {
      const publicRes = await fetch("/api/actions/public", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actionKey: action.key,
          publicToken: localCommitment.public_token,
          completionSecret: localCommitment.public_completion_secret,
          rootChainToken: localCommitment.root_chain_token,
          parentPublicToken: localCommitment.parent_public_token ?? invitedBy,
        }),
      });
      const publicData = (await publicRes.json()) as unknown;
      if (
        publicRes.ok &&
        isRecord(publicData) &&
        isRecord(publicData.participation)
      ) {
        const participation = publicData.participation;
        const chained = updateLocalImpactCommitment(localCommitment.id, {
          public_token:
            typeof participation.public_token === "string"
              ? participation.public_token
              : null,
          public_completion_secret:
            typeof participation.completion_secret === "string"
              ? participation.completion_secret
              : null,
          root_chain_token:
            typeof participation.root_chain_token === "string"
              ? participation.root_chain_token
              : null,
          parent_public_token:
            typeof participation.parent_public_token === "string"
              ? participation.parent_public_token
              : null,
        });
        if (chained) {
          Object.assign(localCommitment, chained);
          setImpactCommitment(chained);
        }
      }

      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientKey: localCommitment.id,
          actionKey: action.key,
          plan,
          beneficiary: impactBeneficiary.trim(),
          firstStep: impactFirstStep.trim(),
          scheduledFor: impactScheduledFor || null,
          sourceReadingId: readingId,
          invitedBy,
          publicToken: localCommitment.public_token,
          publicCompletionSecret: localCommitment.public_completion_secret,
          rootChainToken: localCommitment.root_chain_token,
          parentPublicToken: localCommitment.parent_public_token ?? invitedBy,
        }),
      });

      if (!res.ok) throw new Error("Remote save unavailable");
      removeLocalImpactCommitments([localCommitment.id]);
      setImpactNotice("Compromisso protegido na sua conta. Agora transforme a palavra em ação.");
    } catch {
      setImpactNotice("Compromisso guardado neste navegador. Você pode realizá-lo sem criar conta.");
    } finally {
      setImpactSaving(false);
    }
  }

  async function shareImpactAction() {
    const action = getImpactAction(impactCommitment?.action_key ?? impactActionKey);
    if (!action) return;

    const chainId = impactCommitment?.public_token ?? invitedBy;
    const url = chainId
      ? new URL(`/acao/${encodeURIComponent(chainId)}`, window.location.origin)
      : new URL(window.location.origin);
    if (!chainId) {
      url.searchParams.set("acao", action.key);
      url.hash = "acao";
    }
    const text = `Eu transformei uma palavra em ação: ${action.title}. Continue esta corrente com um gesto possível para você.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Uma palavra virou ação",
          text,
          url: url.toString(),
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url.toString()}`);
        setImpactNotice("Convite copiado. Envie para alguém continuar a corrente.");
      }
    } catch {
      // User cancelled native share sheet.
    }
  }

  async function startCheckout(productKey: string) {
    const activeUserId = userId || getOrCreateLocalUserId();
    if (!userId) setUserId(activeUserId);

    setCheckoutLoading(productKey);
    setCheckoutError("");

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productKey, locale }),
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        const next = `/?product=${encodeURIComponent(
          productKey
        )}&resume=checkout#produtos`;
        window.location.href = `/entrar?next=${encodeURIComponent(next)}`;
        return;
      }

      if (!res.ok || !isRecord(data) || typeof data.checkoutUrl !== "string") {
        const message =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Não foi possível abrir o checkout.";
        throw new Error(message);
      }

      window.location.href = data.checkoutUrl;
    } catch (caught) {
      setCheckoutError(
        caught instanceof Error ? caught.message : "Falha ao abrir o checkout."
      );
    } finally {
      setCheckoutLoading("");
    }
  }

  startCheckoutRef.current = startCheckout;

  useEffect(() => {
    if (!resumeCheckoutProduct) return;

    const supabaseClient = getSupabaseBrowserClient();
    if (!supabaseClient) return;
    const client = supabaseClient;
    const productKey = resumeCheckoutProduct;

    let cancelled = false;
    let started = false;
    let timer: number | undefined;

    async function resumeCheckout() {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (cancelled || started || !session) return;

      started = true;
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("resume");
      window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      setResumeCheckoutProduct(null);
      timer = window.setTimeout(() => {
        if (!cancelled) void startCheckoutRef.current(productKey);
      }, 220);
    }

    void resumeCheckout();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session) void resumeCheckout();
    });

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [resumeCheckoutProduct]);

  const localizedSpreadCards = useMemo(
    () => spreadCards.map((card) => localizeReadingSpreadCard(card, locale)),
    [locale, spreadCards]
  );
  const shownSpread = spreadCards.length ? localizedSpreadCards : dailyOpening.spread;
  const reversedSuffix = locale === "en" ? " (reversed)" : " reversa";
  const activeReading = Boolean(result);
  const readingQuestion = question.trim();
  const readingNeedsLocaleSurface =
    activeReading && resultLocale !== null && resultLocale !== locale;
  const localizedSpreadLine = shownSpread.length
    ? shownSpread
        .map(
          (card) =>
            `${card.position}: ${card.name}${card.reversed ? reversedSuffix : ""}`
        )
        .join(" | ")
    : spreadLine;
  const readingText =
    readingNeedsLocaleSurface
      ? buildLocalizedReadingText({
          cards: localizedSpreadCards,
          locale,
          dailyOpening,
        })
      : result ||
    [
      "MANTRA",
      dailyOpening.affirmation,
      "",
      locale === "en" ? "THE THREE THREADS" : "TRÍADE",
      ...dailyOpening.spread.map(
        (card) =>
          `- ${card.position}: ${card.name}${card.reversed ? reversedSuffix : ""} — ${card.meaning}`
      ),
      "",
      `${locale === "en" ? "Reflection question" : "Pergunta de reflexão"}: ${dailyOpening.reflection}`,
      `${locale === "en" ? "Ritual" : "Ritual"}: ${dailyOpening.ritual}`,
    ].join("\n");
  const readingBlocks = splitReadingIntoBlocks(readingText);
  const openingTitle = loading
    ? t("Lume está abrindo uma nova leitura.")
    : activeReading
      ? readingQuestion || "Sua leitura foi aberta."
      : dailyOpening.message;
  const openingAdvice = loading
    ? t("Lume recolheu as cartas anteriores e está formando um caminho novo para esta pergunta.")
    : activeReading && readingNeedsLocaleSurface
      ? locale === "en"
        ? "Choose one small action from the three cards and test it today."
        : "Escolha uma ação pequena a partir das três cartas e teste hoje."
      : activeReading
        ? getReadingAction(result, "Leia primeiro o conjunto das três cartas; depois escolha uma ação pequena para hoje.")
      : dailyOpening.advice;
  const openingAffirmation = loading
    ? t("Eu deixo Lume abrir a leitura nova antes de concluir.")
    : activeReading && readingNeedsLocaleSurface
      ? dailyOpening.affirmation
      : activeReading
        ? getReadingMantra(result, dailyOpening.affirmation)
      : dailyOpening.affirmation;
  const openingEyebrow = loading
    ? t("Lume em movimento")
    : activeReading
      ? "Leitura desta pergunta"
      : "Sua energia de hoje";
  const cardMeanings = shownSpread.map((card, index) => {
    const dailyCard = dailyOpening.spread.find(
      (item) => item.position === card.position && item.name === card.name
    );
    return {
      position: card.position,
      name: card.name,
      reversed: card.reversed,
      insight: getCardInsightFromReading(
        result,
        { ...card, keyword: card.keyword || dailyCard?.keyword },
        card.meaning || dailyCard?.meaning,
        {
          dailyKey: dailyOpening.dateKey,
          index,
          locale,
          question: activeReading ? readingQuestion : "",
          themeLabel: selectedTheme ? t(selectedTheme.label) : undefined,
        }
      ),
    };
  });
  const onboardingFocusOption = useMemo(
    () => onboardingOptions.find((option) => option.id === onboardingFocusId),
    [onboardingFocusId]
  );

  function completeOnboarding(focus?: string) {
    localStorage.setItem("pdu_onboarding_done", "1");
    if (focus) {
      localStorage.setItem("pdu_focus", focus);
      setOnboardingFocusId(focus);
    }
    setShowOnboarding(false);

    // Persist to Supabase profile so the AI reading uses it via "Fase atual declarada"
    if (focus) {
      const label = onboardingOptions.find((o) => o.id === focus)?.label ?? focus;
      fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPhase: label }),
      }).catch(() => {
        // Silently ignore — localStorage already captured the selection
      });
    }
  }

  return (
    <main className="pdu-home min-h-screen text-[#f8efe2]">

      {showOnboarding ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Qual fase você está vivendo?"
          className="pdu-onboarding-overlay fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#03030a]/82 px-4 py-8 backdrop-blur-xl sm:items-center"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,213,141,0.2),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(167,215,197,0.16),transparent_30%),linear-gradient(135deg,rgba(255,247,232,0.08),transparent_38%)]" />
          <div className="pointer-events-none absolute left-[12%] top-[18%] h-24 w-24 rounded-full border border-[#f4d58d]/18 shadow-[0_0_70px_rgba(244,213,141,0.16)]" />
          <div className="pointer-events-none absolute bottom-[14%] right-[12%] h-32 w-32 rounded-full border border-[#a7d7c5]/14 shadow-[0_0_90px_rgba(167,215,197,0.13)]" />
          <div className="pdu-onboarding-panel relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-[#f4d58d]/22 bg-[#0f0e19]/94 shadow-[0_50px_160px_rgba(0,0,0,0.78)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f4d58d]/70 to-transparent" />
            <div className="grid gap-0 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="pdu-onboarding-copy relative overflow-hidden border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:border-white/10">
                <div className="absolute -right-16 top-10 h-48 w-48 rounded-full border border-[#f4d58d]/14 bg-[#f4d58d]/5" />
                <span className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/24 bg-[#f4d58d]/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  <Sparkles size={13} />
                  Antes de começar
                </span>
                <div className="pdu-onboarding-lume" aria-label={locale === "en" ? "Lume is guiding this beginning" : "Lume guia este começo"}>
                  <span className="pdu-onboarding-lume__seal relative">
                    <Image
                      src={PDU_ASSETS.symbolic.wingOracle}
                      alt=""
                      fill
                      sizes="38px"
                      quality={84}
                      className="object-contain"
                    />
                  </span>
                  <span>
                    <strong>Lume</strong>
                    <small>{locale === "en" ? "is shaping this beginning" : "está guiando este começo"}</small>
                  </span>
                </div>
                <h2 className="pdu-onboarding-title brand-serif mt-5 text-4xl font-semibold leading-[1.02] text-[#fff7e8] sm:text-5xl">
                  Qual energia está mais presente agora?
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#d8ccc0]">
                  Escolha um ponto de partida. A leitura fica mais precisa sem
                  presumir gênero, crença ou jeito de viver espiritualidade.
                </p>
                <div className="pdu-onboarding-points mt-7 grid gap-3 text-sm text-[#d8ccc0]">
                  {["Linguagem neutra", "Sem fatalismo", "Contexto imediato"].map(
                    (item) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#a7d7c5] shadow-[0_0_18px_rgba(167,215,197,0.65)]" />
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="pdu-onboarding-choices p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                    Selecione uma fase
                  </p>
                  <button
                    type="button"
                    onClick={() => completeOnboarding()}
                    aria-label="Pular"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-[#8d837b] transition hover:border-[#f4d58d]/40 hover:text-[#d8ccc0]"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {onboardingOptions.map((opt) => (
                    <OnboardingIconOption
                      key={opt.id}
                      option={opt}
                      onSelect={() => completeOnboarding(opt.id)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => completeOnboarding()}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#d8ccc0] transition hover:border-[#f4d58d]/35 hover:text-[#fff7e8]"
                >
                  Entrar sem calibrar agora
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <header className="pdu-site-header fixed left-0 right-0 top-0 border-b border-white/10 bg-[#09080d]/62 backdrop-blur-2xl">
        <div className="pdu-site-header__inner mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="#topo"
            className="pdu-site-header__brand group flex min-w-0 items-center gap-3 sm:gap-4"
            aria-label="Palavras do Universo"
          >
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border border-[#d7b66b]/24 bg-[#f4d58d]/8 shadow-[0_0_34px_rgba(215,182,107,0.14)] sm:h-16 sm:w-16">
              <Image
                src="/assets/palavras-symbol.webp"
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-contain p-1.5 sm:p-2"
              />
            </span>
            <span className="relative block h-9 w-[min(12rem,41vw)] shrink sm:h-12 sm:w-72">
              <Image
                src="/assets/pdu-new-wordmark-transparent-ofi.webp"
                alt="Palavras do Universo"
                fill
                priority
                sizes="(max-width: 640px) 41vw, 288px"
                className="object-contain object-left"
              />
            </span>
          </a>

          <nav className="pdu-site-header__nav hidden items-center text-sm text-[#cfc4b9] md:flex">
            <a href="#leitura" className="hover:text-white">
              Leitura
            </a>
            <Link href="/carta-do-dia" className="hover:text-white">
              Carta do Dia
            </Link>
            <a href="#ritual" className="hover:text-white">
              Ritual
            </a>
            <a href="#produtos" className="hover:text-white">
              Leituras
            </a>
            <Link href="/tiradas" className="hover:text-white">
              {t("Tiradas")}
            </Link>
            <Link href="/baralho" className="hover:text-white">
              Baralho
            </Link>
            <Link href="/profissionais" className="hover:text-white">
              Profissionais
            </Link>
            <Link href="/profissionais/me" className="hover:text-white">
              Sou profissional
            </Link>
            <Link href="/meu-universo" className="hover:text-white">
              Meu Universo
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => scrollToId("leitura")}
            className="pdu-site-header__cta hidden items-center gap-2 rounded-full bg-[#f4d58d] px-4 py-2 text-sm font-semibold text-[#1c1308] shadow-[0_14px_38px_rgba(244,213,141,0.22)] hover:bg-[#ffe3a3] sm:inline-flex"
          >
            <Sun size={16} />
            Mensagem de hoje
          </button>

          <button
            type="button"
            className="pdu-site-header__mobile-toggle inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] p-2.5 text-[#f5d896] md:hidden"
            aria-label={mobileMenuOpen ? t("Fechar menu") : t("Abrir menu")}
            aria-controls="pdu-mobile-menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div
            id="pdu-mobile-menu"
            className="pdu-mobile-menu border-t border-white/10 bg-[#09080d]/98 px-4 pb-5 pt-3 md:hidden"
            role="dialog"
            aria-label={t("Navegação principal")}
          >
            <nav className="grid gap-1" aria-label={t("Navegação principal")}>
              <a href="#leitura" onClick={() => setMobileMenuOpen(false)}>
                {t("Leitura")}
              </a>
              <Link href="/carta-do-dia" onClick={() => setMobileMenuOpen(false)}>
                {t("Carta do Dia")}
              </Link>
              <a href="#ritual" onClick={() => setMobileMenuOpen(false)}>
                {t("Ritual")}
              </a>
              <a href="#produtos" onClick={() => setMobileMenuOpen(false)}>
                {t("Leituras")}
              </a>
              <Link href="/tiradas" onClick={() => setMobileMenuOpen(false)}>
                {t("Tiradas")}
              </Link>
              <Link href="/baralho" onClick={() => setMobileMenuOpen(false)}>
                {t("Baralho")}
              </Link>
              <Link href="/profissionais" onClick={() => setMobileMenuOpen(false)}>
                {t("Profissionais")}
              </Link>
              <Link href="/profissionais/me" onClick={() => setMobileMenuOpen(false)}>
                {t("Sou profissional")}
              </Link>
              <Link href="/meu-universo" onClick={() => setMobileMenuOpen(false)}>
                {t("Meu Universo")}
              </Link>
            </nav>
            <button
              type="button"
              className="pdu-mobile-menu__cta mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-4 py-3 text-sm font-semibold text-[#1c1308]"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToId("leitura");
              }}
            >
              <Sun size={16} />
              {t("Mensagem de hoje")}
            </button>
          </div>
        ) : null}
      </header>

      {loading ? <ReadingCeremonyOverlay locale={locale} /> : null}

      <section
        id="topo"
        className="relative min-h-screen overflow-x-clip px-4 pb-16 pt-20 sm:px-6 lg:px-8"
      >
        <div className="pdu-veil" />
        <div className="pdu-hero-stars" aria-hidden="true" />

        <div className="pdu-hero-shell mx-auto max-w-7xl">
          <div className="pdu-hero-grid">
            <div className="pdu-reveal pdu-hero-copy relative z-10">
              <p className="pdu-hero-kicker">
                <MoonStar size={14} />
                Ritual diário de clareza
              </p>

              <h1 className="brand-serif pdu-hero-title">
                A magia ainda existe. Às vezes, ela fala baixo.
              </h1>

              <p className="pdu-hero-body">
                Palavras do Universo é um ritual diário para escutar os sinais
                da vida com tarot, mensagens e ciclos. Uma pausa bonita para
                lembrar que o invisível também acompanha o seu caminho.
              </p>

              <LumePresence />

              <div className="pdu-hero-actions">
                <button
                  type="button"
                  onClick={() => scrollToId("leitura")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] shadow-[0_18px_50px_rgba(244,213,141,0.24)] hover:bg-[#ffe3a3] sm:w-auto"
                >
                  <Sparkles size={18} />
                  Receber minha mensagem de hoje
                </button>
                <a
                  href="#produtos"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#f8efe2] backdrop-blur hover:border-[#f4d58d]/45 hover:bg-white/[0.1] sm:w-auto"
                >
                  Conhecer as leituras
                  <ArrowRight size={17} />
                </a>
              </div>

              <div className="pdu-hero-proof">
                <div className="pdu-proof-chip">
                  <span className="pdu-mini-sigil">
                    <Image src={PDU_ASSETS.icons.shield} alt="" fill sizes="1.6rem" className="object-contain" />
                  </span>
                  Sem fatalismo
                </div>
                <div className="pdu-proof-chip">
                  <span className="pdu-mini-sigil">
                    <Image src={PDU_ASSETS.icons.sprout} alt="" fill sizes="1.6rem" className="object-contain" />
                  </span>
                  Clareza prática
                </div>
                <div className="pdu-proof-chip">
                  <span className="pdu-mini-sigil">
                    <Image src={PDU_ASSETS.icons.bookmark} alt="" fill sizes="1.6rem" className="object-contain" />
                  </span>
                  Jornada privada
                </div>
                <div className="pdu-proof-chip pdu-proof-chip--gold">
                  <span className="pdu-mini-sigil">
                    <Image src={PDU_ASSETS.icons.moon} alt="" fill sizes="1.6rem" className="object-contain" />
                  </span>
                  {(1240 + (new Date().getDate() * 37 + new Date().getMonth() * 113) % 380).toLocaleString(locale)}
                  {" "}
                  {locale === "en" ? "readings opened today" : "leituras abertas hoje"}
                </div>
              </div>

              {push.state === "default" ? (
                <button
                  type="button"
                  onClick={() => push.subscribe()}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-[#d8ccc0] backdrop-blur hover:border-[#f4d58d]/40 hover:text-[#f4d58d]"
                >
                  <MoonStar size={14} />
                  Receber mensagem diária por notificação
                </button>
              ) : push.state === "granted" ? (
                <button
                  type="button"
                  onClick={() => push.unsubscribe()}
                  className="mt-5 inline-flex items-center gap-2 text-xs text-[#8d837b] hover:text-[#d8ccc0]"
                >
                  <BadgeCheck size={14} className="text-[#a7d7c5]" />
                  Notificações ativas — clique para desativar
                </button>
              ) : null}

            </div>

            <div className="pdu-reveal pdu-hero-side pdu-hero-side--logo">
              <div className="pdu-hero-mark" aria-hidden="true">
                <picture key={selectedHeroMark.assetPath}>
                  {selectedHeroMark.mobileAssetPath ? (
                    <source
                      media="(max-width: 768px)"
                      srcSet={selectedHeroMark.mobileAssetPath}
                    />
                  ) : null}
                  <img
                    src={selectedHeroMark.assetPath}
                    alt=""
                    width={1600}
                    height={1600}
                    decoding="async"
                    fetchPriority="high"
                    className="h-full w-full object-contain"
                    onError={handleHeroMarkError}
                  />
                </picture>
                {marketplaceSignals.map((signal, index) => {
                  const Icon = signal.icon;
                  return (
                    <span
                      key={signal.title}
                      className="pdu-hero-mark__orbit"
                      style={{ "--pdu-market-index": index } as CSSProperties}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                  );
                })}
              </div>
              <div className="pdu-hero-artifact-rail" aria-label={t("Âncoras da experiência")}>
                {heroArtifacts.map((artifact) => (
                  <div className="pdu-hero-artifact" key={artifact.label}>
                    <span className="pdu-hero-artifact__visual relative">
                      <Image
                        src={artifact.assetPath}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 4rem, 5rem"
                        quality={75}
                        className="object-contain"
                      />
                    </span>
                    <strong>{t(artifact.label)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            id="ritual"
            className="pdu-reveal pdu-mobile-deferred pdu-journey-map"
            aria-label={t("Como a experiência funciona")}
          >
            {journeySteps.map((step) => (
              <div key={step.label} className="pdu-journey-map__item">
                <span className={`pdu-journey-map__icon ${step.visualClass ?? ""}`}>
                  <Image
                    src={step.assetPath}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 4.75rem, 7.25rem"
                    className="object-contain"
                  />
                </span>
                <div>
                  <strong>{t(step.label)}</strong>
                  <p>{t(step.text)}</p>
                </div>
              </div>
            ))}
          </div>

          <section
            className="pdu-reveal pdu-mobile-deferred pdu-marketplace-band"
            id="profissionais"
            aria-labelledby="profissionais-title"
          >
            <div className="pdu-marketplace-band__head">
              <div>
                <SectionEyebrow dark>{t("Cuidado humano opcional")}</SectionEyebrow>
                <h2 id="profissionais-title" className="brand-serif">
                  {t(
                    "Quando uma leitura pede presença humana, você pode procurar profissionais com ética, idioma e faixa de acesso clara."
                  )}
                </h2>
              </div>
              <p>
                {t(
                  "Profissionais não substituem a sua leitura e a leitura não substitui cuidado humano. Este espaço existe para continuar a conversa quando você quiser apoio real, com escolha e privacidade."
                )}
              </p>
            </div>

            <div className="pdu-marketplace-flow">
              {marketplaceFlow.map((item, index) => {
                return (
                  <article
                    key={item.title}
                    className="pdu-marketplace-flow__card"
                    style={
                      { "--pdu-market-index": index } as CSSProperties
                    }
                  >
                    <span className="pdu-marketplace-flow__icon relative">
                      <Image
                        src={item.assetPath}
                        alt=""
                        fill
                        sizes="2.5rem"
                        className="object-contain"
                      />
                    </span>
                    <strong>{t(item.title)}</strong>
                    <p>{t(item.text)}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="pdu-reveal pdu-mobile-deferred pdu-portal-entry">
            <div className="pdu-portal-entry__art" aria-hidden="true">
              <div className="pdu-portal-entry__art-glow" />
              <Image
                key={selectedPortalIntent.id}
                src={selectedPortalIntent.assetPath}
                alt=""
                fill
                sizes="(max-width: 1120px) 180px, 220px"
                quality={84}
                className="object-contain"
              />
              <span>{t(selectedPortalIntent.label)}</span>
            </div>
            <div className="pdu-portal-entry__copy">
              <p className="pdu-portal-console__eyebrow">{t("Antes da pergunta")}</p>
              <h2 className="brand-serif">{t(selectedPortalIntent.title)}</h2>
              <p>
                {t(
                  "Escolha o tipo de clareza que você quer abrir. Isso muda a pergunta sugerida, o tema da leitura e o tom da resposta."
                )}
              </p>
            </div>
            <div className="pdu-portal-entry__controls">
              <div className="pdu-portal-current">
                <span>{t("Intenção selecionada")}</span>
                <strong>{t(selectedPortalIntent.label)}</strong>
                <p>{t(selectedPortalIntent.purpose)}</p>
              </div>
              <div className="pdu-portal-transform" aria-live="polite">
                <div>
                  <span>{t("Antes")}</span>
                  <p>{t(selectedPortalIntent.from)}</p>
                </div>
                <ArrowRight size={18} />
                <div>
                  <span>{t("Depois")}</span>
                  <p>{t(selectedPortalIntent.to)}</p>
                </div>
              </div>
              <div className="pdu-portal-intents">
                {portalIntentOptions.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => openPortalIntent(intent)}
                    data-active={intent.id === selectedPortalIntent.id}
                    aria-pressed={intent.id === selectedPortalIntent.id}
                    aria-label={`${t(intent.label)}: ${t(intent.purpose)}`}
                    className="pdu-touch-choice relative z-[1] touch-manipulation select-none"
                  >
                    <strong>{t(intent.label)}</strong>
                    <span>{t(intent.purpose)}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollToId("leitura")}
                className="pdu-portal-console__cta"
              >
                Abrir leitura com esta intenção
                <Sparkles size={16} />
              </button>
            </div>
          </div>

          <div
            id="leitura"
            className="pdu-reveal pdu-mobile-deferred pdu-hero-reading relative z-10 mx-auto w-full max-w-6xl scroll-mt-28"
          >
            <div className="pdu-oracle-shell p-4 sm:p-5">
                <div
                  className="pdu-lume-reading-signature"
                  aria-label={locale === "en" ? "Reading guided by Lume" : "Leitura guiada por Lume"}
                >
                  <span className="pdu-lume-reading-signature__seal relative">
                    <Image
                      src={PDU_ASSETS.symbolic.wingOracle}
                      alt=""
                      fill
                      sizes="40px"
                      quality={86}
                      className="object-contain"
                    />
                  </span>
                  <span className="pdu-lume-reading-signature__copy">
                    <strong>{locale === "en" ? "A reading with Lume" : "Uma leitura com Lume"}</strong>
                    <span>
                      {locale === "en"
                        ? "Interpretation with context, possibility and choice."
                        : "Interpretação com contexto, possibilidade e escolha."}
                    </span>
                  </span>
                  <button type="button" onClick={requestLumeOpen} className="pdu-lume-reading-signature__button">
                    {locale === "en" ? "Meet Lume" : "Conhecer Lume"}
                    <ArrowRight size={13} />
                  </button>
                </div>
                <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
                      {openingEyebrow}
                    </p>
                    <h2 className="brand-serif mt-1 text-3xl font-semibold text-[#fff7e8]">
                      {activeReading || loading
                        ? "Caminho das 3 cartas"
                        : dailyOpening.energy}
                    </h2>
                  </div>
                  <span className="pdu-reading-header-art relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#f4d58d]/25 bg-[#f4d58d]/10 text-[#f5d896]">
                    <Image
                      src={PDU_ASSETS.products.threeCardPathMobile}
                      alt=""
                      fill
                      sizes="3.5rem"
                      className="object-contain"
                    />
                  </span>
                </div>

                <div className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
                  <div className="space-y-4 order-2">
                    <div className="pdu-ritual-whisper">
                      <span className="pdu-ritual-whisper__icon">
                        <Feather size={15} />
                      </span>
                      <span>
                        Antes da carta, uma pausa. O oráculo responde melhor
                        quando a pergunta vem inteira.
                      </span>
                    </div>
                    <p className="brand-serif text-xl leading-8 text-[#fff3df]">
                      {openingTitle}
                    </p>
                    <div className="space-y-3 text-sm leading-6 text-[#cfc4b9]">
                      <p>
                        <span className="font-semibold text-[#f5d896]">
                          Conselho:
                        </span>{" "}
                        {openingAdvice}
                      </p>
                      <p>
                        <span className="font-semibold text-[#f5d896]">
                          Afirmação:
                        </span>{" "}
                        {openingAffirmation}
                      </p>
                    </div>

                    {loading ? (
                      <ReadingSpreadPortal locale={locale} />
                    ) : !activeReading ? (
                      <div className="pdu-reading-awaiting">
                        <span>
                          <Sparkles size={17} />
                        </span>
                        <strong>Escreva sua pergunta para revelar as cartas.</strong>
                        <p>
                          As três cartas aparecem aqui somente depois que a
                          leitura começar, para não confundir mensagem diária
                          com resposta da sua pergunta.
                        </p>
                      </div>
                    ) : (
                      <div
                        key={spreadCards.length ? spreadLine : dailyOpening.dateKey}
                        className={`pdu-reading-card-grid grid grid-cols-3 gap-2 ${
                          spreadCards.length ? "is-revealed" : ""
                        }`}
                      >
                        {shownSpread.map((card, index) => (
                          <div
                            key={card.position}
                            style={{ "--pdu-card-index": index } as CSSProperties}
                          >
                            <TarotFrame
                              card={card}
                              compact
                              locale={locale}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {!loading && activeReading ? (
                      <div className="pdu-spread-meaning-list">
                        {cardMeanings.map((card) => (
                          <div key={`${card.position}-${card.name}`}>
                            <span>{card.position}</span>
                            <strong>
                              {card.name}
                              {card.reversed ? reversedSuffix : ""}
                            </strong>
                            <p>
                              {card.insight ||
                                "Leia esta carta junto da resposta direta e da tríade abaixo."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="order-1">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
                          Caminho das 3 Cartas
                        </p>
                        <p className="mt-1 text-sm text-[#cfc4b9]">
                          {readingProductKey === "free_daily"
                            ? "Situação, sombra e direção."
                            : "Leitura desbloqueada para este produto."}
                        </p>
                      </div>
                      {SelectedThemeIcon ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-xs text-[#efe2d2]">
                          <SelectedThemeIcon size={14} />
                          {selectedTheme?.label}
                        </div>
                      ) : null}
                    </div>

                    {readingProductKey !== "free_daily" ? (
                      <div className="mb-4 rounded-[8px] border border-[#a7d7c5]/24 bg-[#a7d7c5]/10 p-3 text-sm leading-6 text-[#d8fff0]">
                        Acesso ativo para{" "}
                        <span className="font-semibold text-[#fff7e8]">
                          {getProductName(readingProductKey)}
                        </span>
                        . Esta leitura vai usar o desbloqueio correspondente.
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                      {themeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => selectThemeOption(option.value)}
                          disabled={loading}
                          aria-pressed={theme === option.value}
                          data-active={theme === option.value}
                          className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${
                            theme === option.value
                              ? "border-[#f4d58d] bg-[#f4d58d] text-[#1c1308]"
                              : "border-white/12 bg-white/[0.05] text-[#d8ccc0] hover:border-[#f4d58d]/45"
                          } pdu-touch-choice relative z-[1] touch-manipulation select-none disabled:cursor-wait disabled:opacity-50`}
                        >
                          <option.icon size={15} />
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {onboardingFocusOption ? (
                      <div className="mt-4 rounded-[8px] border border-[#f4d58d]/20 bg-[#f4d58d]/8 p-3 text-sm leading-6 text-[#efe2d2]">
                        <span className="font-semibold text-[#f5d896]">
                          {locale === "en" ? "Starting point:" : "Ponto de partida:"}
                        </span>{" "}
                        {t(onboardingFocusOption.label)}.{" "}
                        <span className="text-[#cfc4b9]">
                          {locale === "en"
                            ? "This signal helps shape the tone of this reading."
                            : "Esse sinal ajuda a moldar o tom desta leitura."}
                        </span>
                      </div>
                    ) : null}

                    <label
                      htmlFor="question"
                      className="mt-4 block text-sm font-semibold text-[#fff3df]"
                    >
                      Sua pergunta
                    </label>
                    <div
                      className="pdu-ritual-prompts"
                      aria-label={t("Como abrir a leitura")}
                    >
                      {ritualPrompts.map((prompt) => (
                        <span key={prompt}>{prompt}</span>
                      ))}
                    </div>
                    <textarea
                      id="question"
                      value={question}
                      onChange={(event) => {
                        setSuggestedQuestionSource("");
                        setQuestion(event.target.value);
                      }}
                      disabled={loading}
                      className="mt-2 min-h-28 w-full resize-none rounded-[8px] border border-white/12 bg-black/24 p-3 text-base leading-6 text-[#fff7e8] outline-none placeholder:text-[#8d837b] focus:border-[#f4d58d]/70 focus:ring-2 focus:ring-[#f4d58d]/10 sm:text-sm"
                      placeholder="O que eu preciso enxergar sobre este momento?"
                    />

                    <button
                      type="button"
                      onClick={() => run()}
                      disabled={!canRun}
                      data-testid="open-reading-button"
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#a7d7c5] px-5 py-3 text-sm font-semibold text-[#07120e] shadow-[0_18px_46px_rgba(167,215,197,0.18)] hover:bg-[#c1ecdc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={18} />
                      {loading ? "Abrindo a leitura..." : "Fazer minha leitura"}
                    </button>

                    {paywall ? (
                      <StatusPanel
                        tone="gold"
                        title={t("Sua tirada continua disponível")}
                        message={t("A leitura gratuita de hoje já foi usada. Crie uma conta grátis para proteger e rever esta tirada no Meu Universo, sem precisar assinar um plano.")}
                        actionLabel={t("Criar conta grátis")}
                        onAction={() => {
                          window.location.href = `/entrar?reason=reading-history&next=${encodeURIComponent("/meu-universo?from=reading")}`;
                        }}
                      />
                    ) : null}

                    {repeat ? (
                      <div className="mt-4 rounded-[8px] border border-[#f4d58d]/24 bg-[#f4d58d]/8 p-4">
                        <h3 className="font-semibold text-[#fff3df]">
                          {repeat.title ?? "Vamos mudar o ângulo."}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#d8ccc0]">
                          {repeat.message}
                        </p>
                        {repeat.suggestedRephrase ? (
                          <p className="mt-3 rounded-[8px] bg-black/20 p-3 text-sm text-[#efe2d2]">
                            {repeat.suggestedRephrase}
                          </p>
                        ) : null}
                        {repeat.guidedFollowUps?.length ? (
                          <div className="mt-3 space-y-2">
                            {repeat.guidedFollowUps.map((followUp) => (
                              <button
                                key={followUp}
                                type="button"
                                onClick={() => {
                                  setQuestion(followUp);
                                  run(followUp);
                                }}
                                className="w-full rounded-[8px] border border-white/12 bg-white/[0.05] px-3 py-2 text-left text-sm text-[#efe2d2] hover:border-[#f4d58d]/45"
                              >
                                {followUp}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {error ? (
                      <StatusPanel
                        tone="rose"
                        title="A leitura não abriu"
                        message={error}
                      />
                    ) : null}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {result || loading ? (
      <section
        id="reading-opened"
        className="pdu-mobile-deferred pdu-depth-section relative overflow-hidden border-y border-white/10 px-4 py-14 text-[#f8efe2] scroll-mt-28 sm:px-6 lg:px-8"
      >
        <div className="pdu-open-reading-layout pdu-reveal is-visible mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.56fr_1.44fr] lg:items-start">
          <div>
            <SectionEyebrow dark>
              {loading ? t("Lume está abrindo") : t("Leitura aberta")}
            </SectionEyebrow>
            <h2 className="brand-serif max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              {loading
                ? t("Lume está encontrando a posição das suas cartas.")
                : t("Clareza que vira próximo passo.")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#d8ccc0]">
              {loading
                ? t("As cartas antigas foram recolhidas. Lume está formando um caminho exclusivo para a pergunta que você acabou de fazer.")
                : t("O Palavras do Universo não promete prever sua vida. Lume ajuda a escutar melhor o momento que você está vivendo.")}
            </p>
            {result ? (
              <div className="pdu-reading-outcome-guide mt-6">
                {readingOutcomeSteps.map((step, index) => (
                  <div key={step.label}>
                    <span>0{index + 1}</span>
                    <strong>{step.label}</strong>
                    <p>{step.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {result ? (
              <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveReading}
                disabled={!result}
                data-state={saved ? "saved" : "idle"}
                className="pdu-save-action pdu-save-action--ghost inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/30 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#fff3df] hover:border-[#f4d58d]/65 disabled:opacity-45"
              >
                <span className="pdu-save-action__content inline-flex items-center gap-2">
                  <Bookmark size={16} />
                  {saved ? "Mensagem salva" : "Salvar mensagem"}
                </span>
              </button>
              <button
                type="button"
                onClick={shareReading}
                className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/30 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#fff3df] hover:border-[#f4d58d]/65"
              >
                <Share2 size={16} />
                Compartilhar
              </button>
              <FeedbackDialog source="reading" readingId={readingId} locale={locale} />
              </div>
            ) : null}
            {readingNotice ? (
              <StatusPanel
                tone="gold"
                title={t("Última tirada reaberta")}
                message={readingNotice}
              />
            ) : null}
            {saveNotice ? (
              <p className="mt-3 text-sm leading-6 text-[#cfc4b9]">
                {saveNotice}{" "}
                <a
                  href="/meu-universo"
                  className="font-semibold text-[#f5d896]"
                >
                  Ver no Meu Universo
                </a>
              </p>
            ) : null}
          </div>

          <div className="pdu-result-stage">
            {loading ? (
              <ReadingSpreadPortal immersive locale={locale} />
            ) : (
              <div className="pdu-result-card-strip" aria-label={localizedSpreadLine}>
                {shownSpread.map((card, index) => (
                  <article
                    key={`${card.position}-${card.name}`}
                    className="pdu-result-card-strip__item"
                    style={{ "--pdu-card-index": index } as CSSProperties}
                  >
                    <TarotFrame card={card} compact locale={locale} />
                    <div>
                      <span>{card.position}</span>
                      <strong>
                        {card.name}
                        {card.reversed ? reversedSuffix : ""}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="pdu-reading-transcript">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                {loading
                  ? t("Lume está escolhendo suas cartas")
                  : localizedSpreadLine || t("Mensagem do Universo")}
              </div>
              <div
                key={result ? readingId ?? spreadLine : "reading-preview"}
                className="pdu-reading-blocks min-h-72"
              >
                {loading ? (
                  <p className="pdu-reading-block text-sm leading-7 text-[#efe2d2]">
                    {t("Sua pergunta chegou até Lume. Um novo caminho está sendo formado para este momento.")}
                  </p>
                ) : (
                  readingBlocks.map((block, index) => (
                    <p
                      key={`${block.slice(0, 18)}-${index}`}
                      className="pdu-reading-block whitespace-pre-wrap text-sm leading-7 text-[#efe2d2]"
                      style={{ "--pdu-block-index": index } as CSSProperties}
                    >
                      {block}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {result && readingProductKey === "free_daily" ? (
      <section className="pdu-mobile-deferred border-b border-white/10 bg-[#0d0d16] px-4 py-16 text-[#f8efe2] sm:px-6 lg:px-8">
        <div className="pdu-reveal is-visible mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f4d58d]">
            {t("Próximos caminhos")}
          </p>
          <h2 className="pdu-next-paths__title brand-serif mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            {t("Sua leitura pode continuar no")}
            <br aria-hidden="true" />
            <span className="pdu-next-paths__destination">
              {t("Meu Universo")}.
            </span>
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
            {t("Crie uma conta grátis para proteger esta tirada, rever suas cartas e construir um contexto que poderá tornar as próximas orientações mais pessoais.")}
          </p>
          <a
            href={`/entrar?reason=reading-history&next=${encodeURIComponent("/meu-universo?from=reading")}`}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-6 py-3 text-sm font-semibold text-[#1c1308] transition hover:bg-[#ffe6a8]"
          >
            <UserRound size={17} />
            {t("Criar conta grátis")}
            <ArrowRight size={16} />
          </a>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-[#a9cdbf]">
            {t("Quer abrir uma nova leitura agora?")}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <a
              href={`/entrar?next=${encodeURIComponent("/?product=clareza_urgente&resume=checkout#produtos")}`}
              className="group flex flex-col rounded-[10px] border border-[#f4d58d]/30 bg-white/[0.05] p-6 text-left transition hover:border-[#f4d58d]/60 hover:bg-white/[0.08]"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f4d58d]">
                {t("Leitura individual")}
              </span>
              <span className="brand-serif mt-2 text-xl font-semibold leading-snug">
                Clareza Urgente
              </span>
              <span className="mt-2 text-sm leading-6 text-[#d8ccc0]">
                {t("Uma leitura premium para respirar, entender o que pesa e escolher o próximo passo hoje.")}
              </span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f4d58d]">
                {t("Quero clareza agora")} — R$19,90
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </a>
            <a
              href={`/entrar?next=${encodeURIComponent("/?product=circulo_do_universo&resume=checkout#produtos")}`}
              className="group flex flex-col rounded-[10px] border border-[#a9cdbf]/30 bg-white/[0.05] p-6 text-left transition hover:border-[#a9cdbf]/60 hover:bg-white/[0.08]"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9cdbf]">
                {t("Assinatura")}
              </span>
              <span className="brand-serif mt-2 text-xl font-semibold leading-snug">
                Círculo do Universo
              </span>
              <span className="mt-2 text-sm leading-6 text-[#d8ccc0]">
                {t("Histórico vivo, rituais semanais e leituras premium para transformar orientação em jornada.")}
              </span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#a9cdbf]">
                {t("Entrar no Círculo")} — R$29,90/mês
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </a>
          </div>
        </div>
      </section>
      ) : null}

      {result || showInvitedAction ? (
      <section
        id="acao"
        className="pdu-mobile-deferred border-b border-white/10 bg-[#101019] px-4 py-20 text-[#f8efe2] sm:px-6 lg:px-8"
      >
        <div className="pdu-reveal is-visible mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <SectionEyebrow dark>Palavras que viram ação</SectionEyebrow>
              <h2 className="brand-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Clareza só muda a vida quando encontra um gesto.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#d8ccc0]">
                Escolha uma ação pequena, possível e concreta para realizar nas
                próximas 24 horas. Depois, convide alguém para continuar a
                corrente.
              </p>
              {invitedBy ? (
                <div className="mt-6 rounded-[8px] border border-[#a9cdbf]/35 bg-[#a9cdbf]/10 p-4 text-sm leading-6 text-[#d9f4e8]">
                  Alguém convidou você para continuar uma corrente de cuidado.
                  Adapte o gesto à sua realidade e faça apenas o que for seguro
                  e possível.
                </div>
              ) : null}
            </div>

            <div className="rounded-[8px] border border-[#f4d58d]/24 bg-white/[0.045] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.2)] sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {impactActions.map((action, index) => {
                  const selected = action.key === impactActionKey;
                  return (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => selectImpactAction(action.key)}
                      className={`rounded-[8px] border p-4 text-left transition ${
                        selected
                          ? "border-[#f4d58d]/70 bg-[#f4d58d]/12"
                          : "border-white/10 bg-black/10 hover:border-white/25"
                      }`}
                    >
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
                        {index < 3 ? "Recomendada · " : ""}
                        {IMPACT_AREA_LABELS[action.area]}
                      </span>
                      <strong className="mt-2 block text-sm text-[#fff7e8]">
                        {action.title}
                      </strong>
                      <span className="mt-2 block text-xs leading-5 text-[#bfb3a9]">
                        {action.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label
                htmlFor="impact-plan"
                className="mt-6 block text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d896]"
              >
                Meu plano concreto
              </label>
              <textarea
                id="impact-plan"
                value={impactPlan}
                onChange={(event) => setImpactPlan(event.target.value)}
                maxLength={500}
                rows={3}
                className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-4 py-3 text-base leading-6 text-[#fff7e8] outline-none placeholder:text-[#8d837b] focus:border-[#f4d58d]/60 sm:text-sm"
                placeholder="Quando, onde e como você realizará esta ação?"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8ccc0]">
                  Para quem ou onde?
                  <input
                    value={impactBeneficiary}
                    onChange={(event) => setImpactBeneficiary(event.target.value)}
                    maxLength={240}
                    className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 py-2.5 text-base font-normal normal-case tracking-normal text-[#fff7e8] outline-none focus:border-[#f4d58d]/60 sm:text-sm"
                    placeholder="Ex.: uma amiga, minha rua, minha casa"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8ccc0]">
                  Quando?
                  <input
                    type="datetime-local"
                    value={impactScheduledFor}
                    onChange={(event) => setImpactScheduledFor(event.target.value)}
                    className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 py-2.5 text-base font-normal normal-case tracking-normal text-[#fff7e8] outline-none focus:border-[#f4d58d]/60 sm:text-sm"
                  />
                </label>
              </div>
              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[#d8ccc0]">
                Menor primeiro passo
                <input
                  value={impactFirstStep}
                  onChange={(event) => setImpactFirstStep(event.target.value)}
                  maxLength={500}
                  className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 py-2.5 text-base font-normal normal-case tracking-normal text-[#fff7e8] outline-none focus:border-[#f4d58d]/60 sm:text-sm"
                  placeholder="Ex.: abrir a conversa e escrever a primeira frase"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={commitImpactAction}
                  disabled={impactSaving || impactPlan.trim().length < 8}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] disabled:opacity-50"
                >
                  <HandHeart size={17} />
                  {impactSaving
                    ? "Guardando compromisso..."
                    : impactCommitment
                      ? "Atualizar meu compromisso"
                      : "Assumir este compromisso"}
                </button>
                {impactCommitment ? (
                  <button
                    type="button"
                    onClick={shareImpactAction}
                    className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/35 px-5 py-3 text-sm font-semibold text-[#fff3df]"
                  >
                    <Share2 size={17} />
                    Convidar alguém
                  </button>
                ) : null}
              </div>

              {impactNotice ? (
                <p className="mt-4 text-sm leading-6 text-[#d8ccc0]">
                  {impactNotice}{" "}
                  <a href="/meu-universo" className="font-semibold text-[#f5d896]">
                    Acompanhar no Meu Universo
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      <PduAssetStory {...PDU_ASSET_STORIES.home} />

      <section
        id="produtos"
        className="pdu-mobile-deferred pdu-experience-section px-4 py-24 text-[#1f1713] sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="pdu-section-orbit pdu-section-orbit--left" aria-hidden="true">
          <MoonStar size={92} strokeWidth={1.15} />
        </div>
        <div className="pdu-section-orbit pdu-section-orbit--right" aria-hidden="true">
          <Sparkles size={86} strokeWidth={1.15} />
        </div>
        <div className="pdu-reveal relative z-10 mx-auto max-w-7xl">
          <div className="pdu-experience-header">
            <div className="max-w-2xl">
              <SectionEyebrow>Experiências</SectionEyebrow>
              <h2 className="brand-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Não é sobre tirar cartas. É sobre voltar a escolher bem.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6f615a]">
                Cada experiência existe para transformar uma sensação solta em
                clareza: o que estou sentindo, o que isso pede de mim e qual
                próximo passo me faz melhor agora.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToId("leitura")}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#111019] px-5 py-3 text-sm font-semibold text-[#fff7e8] shadow-[0_18px_50px_rgba(17,16,25,0.18)] hover:bg-[#242130]"
            >
              <Feather size={17} />
              Experimentar gratuitamente
            </button>
          </div>

          <div className="pdu-magic-marquee pdu-scroll-reveal" aria-hidden="true">
            <div className="pdu-magic-marquee__track">
              {[...localizedAtmosphereWords, ...localizedAtmosphereWords].map((word, index) => (
                <span key={`${word}-${index}`}>
                  {word}
                  <Sparkles size={18} strokeWidth={1.45} />
                </span>
              ))}
            </div>
          </div>

          <div className="pdu-pillar-row mt-8">
            {experiencePillars.map((pillar) => (
              <div key={pillar} className="pdu-pillar-chip">
                {pillar}
              </div>
            ))}
          </div>

          <div className="pdu-access-guide mt-10" aria-label="Formas de acesso">
            {experienceAccessPaths.map((path, index) => (
              <div key={path.label} className="pdu-access-guide__item">
                <span className="pdu-access-guide__number">0{index + 1}</span>
                <span className="pdu-access-guide__icon relative">
                  <Image
                    src={path.assetPath}
                    alt=""
                    fill
                    sizes="6rem"
                    className="object-contain"
                  />
                </span>
                <div>
                  <strong>{path.label}</strong>
                  <p>{path.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pdu-product-river mt-10">
            {productCards.map((product, index) => (
              <article
                key={product.title}
                className={`pdu-product-node pdu-product-node--${product.mode} group`}
                style={{ "--pdu-product-index": index } as CSSProperties}
              >
                <div className="pdu-product-node__top">
                  <span
                    className={`pdu-product-mode rounded-full px-3 py-1 text-xs font-semibold ${getProductModeClass(
                      product.mode
                    )}`}
                  >
                    {getProductModeLabel(product.mode)}
                  </span>
                </div>
                <ProductIconVisual title={product.title} />
                <div className="pdu-product-node__content">
                  <p className="pdu-product-node__eyebrow">
                    {product.archetype}
                  </p>
                  <h3 className="brand-serif pdu-product-node__title">
                    {product.title}
                  </h3>
                  <p className="pdu-product-node__promise">
                    {product.promise}
                  </p>
                  <div className="pdu-product-node__transformation">
                    <span className="font-semibold text-[#4d3c31]">
                      Transformação:
                    </span>{" "}
                    {product.transformation}
                  </div>
                  <div className="pdu-product-node__details">
                    <p>
                      <span className="font-semibold text-[#4d3c31]">
                        Melhor para:
                      </span>{" "}
                      {product.bestFor}
                    </p>
                    <p>
                      <span className="font-semibold text-[#4d3c31]">
                        Não é para:
                      </span>{" "}
                      {product.notFor}
                    </p>
                  </div>
                  {product.price ? (
                    <p className="pdu-product-node__price">
                      {product.price}
                    </p>
                  ) : null}
                  {product.href ? (
                    <a href={product.href} className={productActionClass}>
                      {product.cta}
                      <ArrowRight size={16} />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        product.mode === "paid"
                          ? startCheckout(product.productKey)
                          : product.mode === "included"
                            ? scrollToId("circulo")
                            : scrollToId("leitura")
                      }
                      disabled={checkoutLoading === product.productKey}
                      className={productActionClass}
                    >
                      {checkoutLoading === product.productKey
                        ? "Abrindo checkout..."
                        : product.cta}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {checkoutError ? (
            <p className="mt-6 max-w-2xl text-sm leading-6 text-[#7a2f2a]">
              {checkoutError}
            </p>
          ) : null}

          <div className="pdu-trust-ribbon">
            <span className="pdu-trust-ribbon__item">
              <span className="pdu-mini-sigil pdu-mini-sigil--light">
                <Image src={PDU_ASSETS.icons.shield} alt="" fill sizes="1.35rem" className="object-contain" />
              </span>
              Pagamento seguro via Stripe
            </span>
            <span className="pdu-trust-ribbon__item">
              <span className="pdu-mini-sigil pdu-mini-sigil--light">
                <Image src={PDU_ASSETS.icons.heart} alt="" fill sizes="1.35rem" className="object-contain" />
              </span>
              Satisfação garantida — refazemos a leitura se não trouxer clareza
            </span>
            <span className="pdu-trust-ribbon__item">
              <span className="pdu-mini-sigil pdu-mini-sigil--light">
                <Image src={PDU_ASSETS.icons.bookmark} alt="" fill sizes="1.35rem" className="object-contain" />
              </span>
              Suas perguntas são privadas e nunca compartilhadas
            </span>
          </div>
        </div>
      </section>

      <section className="pdu-mobile-deferred pdu-universe-preview px-4 py-28 sm:px-6 lg:px-8">
        <div className="pdu-reveal mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="pdu-universe-preview__copy">
            <SectionEyebrow dark>Meu Universo</SectionEyebrow>
            <h2 className="brand-serif text-4xl font-semibold leading-tight text-[#fff7e8] sm:text-5xl">
              Quanto mais você usa, mais sua jornada ganha contexto.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#d8ccc0]">
              Suas leituras salvas começam a formar um diário simbólico: temas
              que retornam, palavras que acalmam e sinais que ajudam a perceber
              a fase que você está atravessando.
            </p>
            <a
              href="/meu-universo"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1c1308] hover:bg-[#ffe3a3]"
            >
              Abrir Meu Universo
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="pdu-feature-cloud">
            <div className="pdu-feature-cloud__core" aria-hidden="true">
              <Image
                src={PDU_ASSETS.ambient.allConnected}
                alt=""
                width={190}
                height={190}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="pdu-feature-cloud__symbols">
              {floatingSymbols.map((symbol, index) => (
                <div
                  key={symbol.label}
                  className="pdu-feature-cloud__symbol"
                  style={{ "--pdu-symbol-index": index } as CSSProperties}
                >
                  <span className="pdu-floating-symbol" aria-hidden="true">
                    <Image
                      src={symbol.assetPath}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 5rem, 8rem"
                      className="object-contain"
                    />
                  </span>
                  <span>{symbol.label}</span>
                </div>
              ))}
            </div>
            <div className="pdu-feature-cloud__tokens">
              {universeFeatureTokens.map((item, index) => (
                <div
                  key={item}
                  className="pdu-feature-token"
                  style={{ "--pdu-token-index": index } as CSSProperties}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="circulo"
        className="pdu-mobile-deferred pdu-circle-section border-y border-white/10 px-4 py-24 text-[#1f1713] sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="pdu-circle-sigil" aria-hidden="true">
          <Image
            src={PDU_ASSETS.ambient.mandala}
            alt=""
            width={260}
            height={260}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="pdu-reveal mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <SectionEyebrow>Assinatura</SectionEyebrow>
            <h2 className="brand-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Círculo do Universo é o santuário premium.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6f615a]">
              Não é uma assinatura para consumir mais cartas. É um espaço
              contínuo para reconhecer padrões, atravessar ciclos e tomar
              decisões internas e externas com mais inteligência emocional.
            </p>
          </div>

          <div className="pdu-plan-weave mt-10">
            {pricingPlans.map((plan) => (
              <article
                key={plan.title}
                className={`pdu-plan-lane ${
                  plan.highlighted
                    ? "pdu-plan-lane--active text-[#fff7e8]"
                    : "text-[#241b18]"
                }`}
              >
                <h3 className="brand-serif text-2xl font-semibold">
                  {plan.title}
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  {isPrefixPriceCadence(plan.cadence) ? (
                    <span
                      className={
                        plan.highlighted ? "text-[#d9c49f]" : "text-[#6f615a]"
                      }
                    >
                      {plan.cadence}
                    </span>
                  ) : null}
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  {!isPrefixPriceCadence(plan.cadence) ? (
                    <span
                      className={
                        plan.highlighted ? "text-[#d9c49f]" : "text-[#6f615a]"
                      }
                    >
                      {plan.cadence}
                    </span>
                  ) : null}
                </div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    plan.highlighted ? "text-[#eadfcf]" : "text-[#6f615a]"
                  }`}
                >
                  {plan.bestFor}
                </p>
                <ul className="mt-5 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check
                        size={16}
                        className={
                          plan.highlighted ? "text-[#f5d896]" : "text-[#607464]"
                        }
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    plan.productKey
                      ? startCheckout(plan.productKey)
                      : scrollToId(plan.targetId ?? "leitura")
                  }
                  disabled={
                    Boolean(plan.productKey) &&
                    checkoutLoading === plan.productKey
                  }
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
                    plan.highlighted
                      ? "bg-[#f4d58d] text-[#1c1308] hover:bg-[#ffe3a3]"
                      : "border border-[#bfa783] text-[#4d3c31] hover:border-[#967449]"
                  }`}
                >
                  {plan.productKey && checkoutLoading === plan.productKey
                    ? "Abrindo checkout..."
                    : plan.cta}
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pdu-mobile-deferred border-b border-white/10 bg-[#0a0918] px-4 py-16 sm:px-6 lg:px-8">
        <div className="pdu-reveal mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
              O que as pessoas estão vivendo
            </p>
            <h2 className="brand-serif mt-3 text-3xl font-semibold text-[#fff7e8] sm:text-4xl">
              Clareza que virou decisão real.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="flex flex-col rounded-[10px] border border-white/10 bg-white/[0.04] p-6"
              >
                <Quote size={20} className="mb-4 shrink-0 text-[#f4d58d]/50" />
                <p className="flex-1 text-sm leading-7 text-[#d8ccc0]">{t.text}</p>
                <footer className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#fff7e8]">{t.name}</p>
                    <p className="text-xs text-[#8d837b]">{t.location}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={13} className="fill-[#f4d58d] text-[#f4d58d]" />
                    ))}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="pdu-feedback-invitation mt-10">
            <div className="pdu-feedback-invitation__art" aria-hidden="true">
              <Image
                src={PDU_ASSETS.editorial.portal}
                alt=""
                fill
                sizes="8rem"
                className="object-contain"
              />
              <Image
                src={PDU_ASSETS.editorial.key}
                alt=""
                fill
                sizes="6rem"
                className="pdu-feedback-invitation__key object-contain"
              />
            </div>
            <div className="relative z-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f4d58d]">
                {locale === "en" ? "The portal listens too" : "O portal também escuta"}
              </p>
              <h3 className="brand-serif mt-2 text-2xl font-semibold text-[#fff7e8] sm:text-3xl">
                {locale === "en"
                  ? "One sentence from you can light someone else’s way."
                  : "Uma frase sua pode iluminar o caminho de outra pessoa."}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#d8ccc0]">
                {locale === "en"
                  ? "Tell us what changed, what touched you, or which question stayed alive after the experience."
                  : "Conte o que mudou, o que tocou você ou qual pergunta ficou viva depois da experiência."}
              </p>
            </div>
            <FeedbackDialog source="footer" readingId={readingId} locale={locale} className="relative z-10 shrink-0" />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#8d837b]">
            <span className="pdu-proof-chip pdu-proof-chip--quiet">
              <span className="pdu-mini-sigil">
                <Image src={PDU_ASSETS.icons.shield} alt="" fill sizes="1.35rem" className="object-contain" />
              </span>
              Pagamento seguro via Stripe
            </span>
            <span className="pdu-proof-chip pdu-proof-chip--quiet">
              <span className="pdu-mini-sigil">
                <Image src={PDU_ASSETS.icons.heart} alt="" fill sizes="1.35rem" className="object-contain" />
              </span>
              Satisfação garantida — refazemos a leitura se não trouxer clareza
            </span>
            <span className="pdu-proof-chip pdu-proof-chip--quiet">
              <span className="pdu-mini-sigil">
                <Image src={PDU_ASSETS.icons.bookmark} alt="" fill sizes="1.35rem" className="object-contain" />
              </span>
              Suas perguntas são privadas e nunca compartilhadas
            </span>
          </div>
        </div>
      </section>

      <footer className="px-4 py-12 text-center text-xs leading-6 text-[#cfc4b9] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl border-t border-white/10 pt-8">
          <nav className="mb-5 flex flex-wrap justify-center gap-x-5 gap-y-2 font-semibold text-[#f5d896]">
            <a href="/termos">{t("Termos de uso")}</a>
            <a href="/privacidade">{t("Privacidade")}</a>
            <a href="/reembolsos">{t("Cancelamentos e reembolsos")}</a>
          </nav>
          <p>
            Palavras do Universo oferece orientação simbólica para reflexão e
            entretenimento. Não substitui aconselhamento médico, jurídico,
            financeiro ou psicológico.
          </p>
          <p className="mt-3">
            {t(
              "Se você estiver em sofrimento intenso, em risco imediato ou pensando em se machucar, procure um serviço de emergência local ou ligue"
            )}{" "}
            <a
              href="https://cvv.org.br/ligue-188-3/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#f5d896] underline decoration-[#f5d896]/45 underline-offset-4 hover:text-white"
            >
              188, CVV
              <LifeBuoy size={13} />
            </a>
            {t(
              ". Para acompanhamento profissional, você pode buscar psicólogos e profissionais qualificados no"
            )}{" "}
            <a
              href="https://www.doctoralia.com.br/psicologo/online"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#f5d896] underline decoration-[#f5d896]/45 underline-offset-4 hover:text-white"
            >
              Doctoralia
              <ExternalLink size={13} />
            </a>
            {t(
              ", inclusive procurando opções acessíveis ou perguntando sobre valor social quando necessário."
            )}
          </p>
        </div>
      </footer>
    </main>
  );
}

function SectionEyebrow(props: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${
        props.dark ? "text-[#f5d896]" : "text-[#8a6b3f]"
      }`}
    >
      <span
        className={`h-px w-8 ${
          props.dark ? "bg-[#f5d896]/70" : "bg-[#bc8f46]"
        }`}
      />
      {props.children}
    </p>
  );
}

function TarotFrame(props: {
  locale: string;
  card: {
    position: string;
    name: string;
    reversed: boolean;
    assetPath: string;
  };
  compact?: boolean;
}) {
  return (
    <div
      className={`pdu-tarot-frame group overflow-hidden rounded-[8px] border border-[#f4d58d]/20 bg-[#111019] shadow-[0_18px_50px_rgba(0,0,0,0.2)] ${
        props.compact ? "min-h-36" : ""
      }`}
    >
      <div className="relative aspect-[5/8]">
        <Image
          src={props.card.assetPath}
          alt={`${props.card.position}: ${props.card.name}`}
          width={420}
          height={680}
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
            props.card.reversed ? "rotate-180" : ""
          }`}
        />
      </div>
      <div className="border-t border-[#f4d58d]/16 bg-black/30 p-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
          {props.card.position}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-[#fff7e8]">
          {props.card.name}
          {props.card.reversed
            ? props.locale === "en"
              ? " (reversed)"
              : " reversa"
            : ""}
        </p>
      </div>
    </div>
  );
}

function ReadingCeremonyOverlay(props: { locale: "pt-BR" | "en" }) {
  const copy =
    props.locale === "en"
      ? {
          title: `${LUME_NAME} is opening a new spread`,
          body: "The previous cards have been gathered. Lume is drawing a clean path for this question.",
        }
      : {
          title: `${LUME_NAME} está abrindo uma nova leitura`,
          body: "As cartas antigas foram recolhidas. Lume está formando um caminho limpo para esta pergunta.",
        };

  return (
    <div className="pdu-reading-ceremony" role="status" aria-live="polite">
      <div className="pdu-reading-ceremony__field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <ReadingSpreadPortal locale={props.locale} />
      <div className="pdu-reading-ceremony__copy">
        <strong>{copy.title}</strong>
        <span>{copy.body}</span>
      </div>
    </div>
  );
}

function ReadingSpreadPortal(props: { immersive?: boolean; locale?: "pt-BR" | "en" }) {
  return (
    <div
      className={`pdu-reading-spread-portal ${
        props.immersive ? "is-immersive" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="pdu-reading-spread-portal__ring" aria-hidden="true" />
      <div className="pdu-reading-spread-portal__cards" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            style={{ "--pdu-card-index": index } as CSSProperties}
          />
        ))}
      </div>
      <p>
        {props.locale === "en"
          ? "Lume is opening a new path for your question"
          : "Lume está abrindo um novo caminho para sua pergunta"}
      </p>
    </div>
  );
}

function ProductIconVisual(props: { title: string }) {
  const [failed, setFailed] = useState(false);
  const visual = productIconVisuals[props.title] ?? {
    assetPath: PDU_ASSETS.products.messageOfTheDay,
    fallbackIcon: Sparkles,
    tone: "gold" as const,
  };
  const FallbackIcon = visual.fallbackIcon;

  return (
    <div
      className={`pdu-product-visual pdu-product-visual--${visual.tone}${
        visual.variant ? ` pdu-product-visual--${visual.variant}` : ""
      } mb-5`}
    >
      <div className="pdu-product-visual__halo" />
      <div className="pdu-product-visual__portal" aria-hidden="true" />
      <div className="pdu-product-visual__veil pdu-product-visual__veil--back" aria-hidden="true" />
      <div className="pdu-product-visual__ring pdu-product-visual__ring--outer" aria-hidden="true" />
      <div className="pdu-product-visual__ring pdu-product-visual__ring--inner" aria-hidden="true" />
      <div className="pdu-product-visual__veil pdu-product-visual__veil--front" aria-hidden="true" />
      <div className="pdu-product-visual__beam" aria-hidden="true" />
      {!failed ? (
        <div className="pdu-product-visual__image relative z-10 transition duration-500 group-hover:scale-[1.04]">
          {visual.mobileAssetPath ? (
            <picture>
              <source
                media="(max-width: 768px)"
                srcSet={visual.mobileAssetPath}
              />
              <img
                src={visual.assetPath}
                alt=""
                width={420}
                height={420}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
                onError={() => setFailed(true)}
              />
            </picture>
          ) : (
            <Image
              src={visual.assetPath}
              alt=""
              width={420}
              height={420}
              sizes="(max-width: 768px) 180px, 320px"
              loading="lazy"
              quality={72}
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      ) : (
        <div className="relative z-10 grid h-40 place-items-center">
          <div className="pdu-product-visual__fallback">
            <FallbackIcon size={62} strokeWidth={1.45} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPanel(props: {
  tone: "gold" | "rose";
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClass =
    props.tone === "rose"
      ? "border-[#d9aaa8]/40 bg-[#4b1717]/36 text-[#ffd8d5]"
      : "border-[#f4d58d]/28 bg-[#f4d58d]/10 text-[#fff0c9]";

  return (
    <div className={`mt-4 rounded-[8px] border p-4 ${toneClass}`}>
      <h3 className="font-semibold">{props.title}</h3>
      <p className="mt-2 text-sm leading-6">{props.message}</p>
      {props.actionLabel && props.onAction ? (
        <button
          type="button"
          onClick={props.onAction}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-4 py-2 text-sm font-semibold text-[#1c1308]"
        >
          {props.actionLabel}
          <ArrowRight size={16} />
        </button>
      ) : null}
    </div>
  );
}

function getProductModeLabel(mode: string) {
  if (mode === "paid") return "Pago avulso";
  if (mode === "included") return "No Círculo";
  return "Gratuito";
}

function getProductModeClass(mode: string) {
  if (mode === "paid") return "bg-[#111019] text-[#fff7e8]";
  if (mode === "included") return "bg-[#efe4ff] text-[#4b3d6b]";
  return "bg-[#dfe7dc] text-[#425746]";
}

function getProductName(productKey: string) {
  return (
    productCards.find((product) => product.productKey === productKey)?.title ??
    "Palavras do Universo"
  );
}
