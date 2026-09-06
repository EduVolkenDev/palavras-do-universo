"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  HandHeart,
  LogIn,
  MoonStar,
  ShieldCheck,
  Share2,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildLoginPath } from "@/lib/auth/redirect";
import {
  completeLocalImpactCommitment,
  getLocalActiveReading,
  getLocalImpactCommitments,
  getLocalSavedMessages,
  getOrCreateLocalUserId,
  localActiveReadingAsSavedMessage,
  type LocalImpactCommitment,
  updateLocalImpactCommitment,
} from "@/lib/client/localUniverse";
import { syncLocalUniverseToAccount } from "@/lib/client/syncLocalUniverse";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { IMPACT_AREA_LABELS, type ImpactArea } from "@/lib/impact/actions";
import {
  getProductCardPrice,
  productCards,
} from "@/lib/product/catalog";
import { ProductCurrencySwitch } from "@/components/ProductCurrencySwitch";
import { formatProductPrice } from "@/lib/product/pricing";
import { useProductCurrency } from "@/lib/product/useProductCurrency";
import {
  CIRCLE_PRODUCT_KEY,
  findEntitlementForProduct,
  isCircleEntitlement,
} from "@/lib/product/access";
import { useI18n } from "@/components/I18nProvider";
import { normalizeLocale, type Locale } from "@/lib/i18n/config";
import { localizeTarotCard, translateOraclePosition } from "@/lib/i18n/oracle";
import { CARDS } from "@/lib/tarot/cards";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PduAssetStory } from "@/components/PduAssetStory";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";
import {
  EMPTY_READING_PROFILE,
  getProfileCompletion,
  hasProfileSignal,
  normalizeReadingProfile,
  type ReadingProfile,
} from "@/lib/personalization/reading-context";
import {
  getLabPracticeContinuity,
  isLabPracticePayload,
  LAB_PRACTICE_LABELS,
} from "@/lib/lab/practice";
import {
  buildJourneySnapshot,
  getJourneyRecommendations,
} from "@/lib/personalization/journey";

type Reading = {
  id: string;
  locale?: string;
  theme: string;
  question: string;
  mode: string;
  spread_type: string;
  spread: unknown;
  interpretation: string;
  created_at: string;
};

type SavedMessage = {
  id: string;
  reading_id: string | null;
  client_key?: string | null;
  message_type: string;
  payload: unknown;
  created_at: string;
  local_only?: boolean;
};

type Entitlement = {
  id: string;
  product_key: string;
  title: string;
  product_type: string;
  access_model: string;
  source: string;
  starts_at: string;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
};

type ImpactCommitment = Omit<LocalImpactCommitment, "local_only"> & {
  client_key?: string | null;
  local_only?: boolean;
};

type ReadingSpreadCard = {
  position: string;
  cardKey: string;
  keyword: string;
  name: string;
  reversed: boolean;
  meaning: string;
  coreMeaning?: string;
  lifeQuestion?: string;
  assetPath: string;
};

type UniverseStat = {
  label: string;
  value: string | number;
  visual: string;
};

const focusAreaOptions = [
  "Amor e vínculos",
  "Carreira",
  "Dinheiro",
  "Família",
  "Propósito",
  "Espiritualidade",
];

const phaseOptions = [
  "Começando um ciclo",
  "Encerrando algo",
  "Esperando uma resposta",
  "Reorganizando a vida",
  "Tomando uma decisão",
  "Cuidando da energia",
];

const toneOptions = [
  "Direta e prática",
  "Acolhedora",
  "Profunda e simbólica",
  "Calma e objetiva",
];

const shiftOptions = [
  "Clareza para decidir",
  "Coragem para agir",
  "Calma para atravessar",
  "Fechamento de ciclo",
  "Mais honestidade comigo",
];

const boundaryOptions = [
  "Sem fatalismo",
  "Sem respostas longas",
  "Sem romantizar ansiedade",
  "Sem tom duro",
  "Sem jargão esotérico",
];

const profileSignalLabels: Record<string, Record<Locale, string>> = {
  "Amor e vínculos": { "pt-BR": "Amor e vínculos", en: "Love and bonds" },
  Carreira: { "pt-BR": "Carreira", en: "Career" },
  Dinheiro: { "pt-BR": "Dinheiro", en: "Money" },
  Família: { "pt-BR": "Família", en: "Family" },
  Propósito: { "pt-BR": "Propósito", en: "Purpose" },
  Espiritualidade: { "pt-BR": "Espiritualidade", en: "Spirituality" },
  "Começando um ciclo": { "pt-BR": "Começando um ciclo", en: "Starting a cycle" },
  "Encerrando algo": { "pt-BR": "Encerrando algo", en: "Closing something" },
  "Esperando uma resposta": {
    "pt-BR": "Esperando uma resposta",
    en: "Waiting for an answer",
  },
  "Reorganizando a vida": {
    "pt-BR": "Reorganizando a vida",
    en: "Reorganizing life",
  },
  "Tomando uma decisão": { "pt-BR": "Tomando uma decisão", en: "Making a decision" },
  "Cuidando da energia": { "pt-BR": "Cuidando da energia", en: "Caring for your energy" },
  "Clareza para decidir": { "pt-BR": "Clareza para decidir", en: "Clarity to decide" },
  "Coragem para agir": { "pt-BR": "Coragem para agir", en: "Courage to act" },
  "Calma para atravessar": { "pt-BR": "Calma para atravessar", en: "Calm to move through" },
  "Fechamento de ciclo": { "pt-BR": "Fechamento de ciclo", en: "Closing a cycle" },
  "Mais honestidade comigo": {
    "pt-BR": "Mais honestidade comigo",
    en: "More honesty with myself",
  },
};

function localizeProfileSignal(value: string, locale: Locale) {
  return profileSignalLabels[value]?.[locale] ?? value;
}

const paidReadingProducts = productCards.filter((product) => product.mode === "paid");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeAssetPath(value: unknown) {
  const assetPath = asString(value);
  if (!assetPath) return "";

  const legacyTarotPath = "/tarot/cards/";
  if (assetPath.includes(legacyTarotPath)) {
    const fileName = assetPath.split(legacyTarotPath).pop();
    return fileName ? `/assets/${fileName}` : "";
  }

  return assetPath;
}

function normalizeSpreadCards(value: unknown): ReadingSpreadCard[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ReadingSpreadCard | null => {
      if (!isRecord(item)) return null;
      const name = asString(item.name);
      const position = asString(item.position);
      if (!name && !position) return null;

      return {
        position,
        cardKey: asString(item.cardKey || item.card_key),
        keyword: asString(item.keyword),
        name,
        reversed: item.reversed === true,
        meaning: asString(item.meaning),
        coreMeaning: asString(item.coreMeaning),
        lifeQuestion: asString(item.lifeQuestion),
        assetPath: normalizeAssetPath(item.assetPath || item.asset_path),
      };
    })
    .filter((card): card is ReadingSpreadCard => card !== null);
}

function getStoredReadingProfile() {
  if (typeof window === "undefined") return { ...EMPTY_READING_PROFILE };

  try {
    const stored = window.localStorage.getItem("pdu_onboarding_profile");
    return stored
      ? normalizeReadingProfile(JSON.parse(stored))
      : { ...EMPTY_READING_PROFILE };
  } catch {
    window.localStorage.removeItem("pdu_onboarding_profile");
    return { ...EMPTY_READING_PROFILE };
  }
}

function recommendedProductKey(profile: ReadingProfile) {
  const signal = [
    ...profile.focusAreas,
    profile.currentPhase,
    profile.desiredShift,
    profile.contextNote,
  ]
    .join(" ")
    .toLocaleLowerCase("pt-BR");

  if (signal.includes("amor") || signal.includes("vínculo")) {
    return "sinais_do_amor";
  }

  if (
    signal.includes("urg") ||
    signal.includes("ansiedade") ||
    signal.includes("não pode esperar") ||
    signal.includes("coragem")
  ) {
    return "clareza_urgente";
  }

  return "caminho_3_cartas";
}

function isDailyCardPayload(value: unknown): value is {
  date_key?: string;
  date_label?: string;
  opening_key?: string;
  card?: {
    key?: string;
    name?: string;
    reversed?: boolean;
    asset_path?: string;
    keywords?: string[];
    core_meaning?: string;
    life_question?: string;
  };
  reading?: {
    keyword?: string;
    coreMeaning?: string;
    lifeQuestion?: string;
    meaning?: string;
    counsel?: string;
    reflection_prompt?: string;
    ritual?: string;
  };
} {
  return isRecord(value) && isRecord(value.card) && isRecord(value.reading);
}

function isSavedReadingPayload(value: unknown): value is {
  savedAt?: string;
  locale?: string;
  theme?: string;
  spreadType?: string;
  spreadLabel?: string;
  question?: string;
  spreadLine?: string;
  spreadCards?: {
    position?: string;
    name?: string;
    reversed?: boolean;
    assetPath?: string;
  }[];
  result?: string;
} {
  return isRecord(value) && typeof value.result === "string";
}

function getMessageDedupeKey(message: SavedMessage) {
  if (message.client_key) return `client:${message.client_key}`;

  if (message.message_type === "reading" && isSavedReadingPayload(message.payload)) {
    if (message.reading_id) return `reading:${message.reading_id}`;

    const question = asString(message.payload.question);
    const spreadLine = asString(message.payload.spreadLine);
    if (question || spreadLine) return `reading:${question}:${spreadLine}`;
  }

  if (
    message.message_type === "daily_card" &&
    isDailyCardPayload(message.payload) &&
    (message.payload.opening_key || message.payload.date_key)
  ) {
    return `daily_card:${message.payload.opening_key ?? message.payload.date_key}`;
  }

  if (message.id.startsWith("local_")) return `client:${message.id}`;

  return message.id;
}

function dedupeMessages(messages: SavedMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    const dedupeKey = getMessageDedupeKey(message);
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

function getSavedTitle(message: SavedMessage) {
  if (message.message_type === "daily_card" && isDailyCardPayload(message.payload)) {
    const name = asString(message.payload.card?.name);
    return name ? `Carta do Dia: ${name}` : "Carta do Dia";
  }

  if (message.message_type === "practice" && isLabPracticePayload(message.payload)) {
    return message.payload.locale === "en" ? "Clarity practice" : "Prática de clareza";
  }

  if (message.message_type === "reading" && isSavedReadingPayload(message.payload)) {
    const question = asString(message.payload.question);
    return question || "Leitura salva";
  }

  if (!isRecord(message.payload)) return "Mensagem salva";
  const question = message.payload.question;
  return typeof question === "string" && question ? question : "Mensagem salva";
}

function getSavedPreview(message: SavedMessage) {
  if (message.message_type === "daily_card" && isDailyCardPayload(message.payload)) {
    return asString(message.payload.reading?.meaning);
  }

  if (message.message_type === "practice" && isLabPracticePayload(message.payload)) {
    return message.payload.nextStep || message.payload.signal;
  }

  if (message.message_type === "reading" && isSavedReadingPayload(message.payload)) {
    return asString(message.payload.result)
      .split("\n")
      .filter(Boolean)
      .slice(0, 4)
      .join(" ");
  }

  if (!isRecord(message.payload)) return "";
  const result = message.payload.result;
  return typeof result === "string"
    ? result.split("\n").filter(Boolean).slice(0, 3).join(" ")
    : "";
}

type InitialMapStep = {
  title: string;
  text: string;
  href: string;
  continuity?: {
    theme: string;
    prompt: string;
  };
};

function getInitialMapNextSteps(
  profile: ReadingProfile,
  hasHistory: boolean,
  locale: Locale
): InitialMapStep[] {
  const isEnglish = locale === "en";
  const copy = isEnglish
    ? {
        ritualTitle: "Two-minute ritual",
        ritualText:
          "Take a breath, name the phase you are moving through, and write one sentence about what needs care today.",
        reviewTitle: "Review a pattern",
        reviewText:
          "Notice the card or theme that returned more than once before opening another question.",
        firstTitle: "First signal",
        firstText: "Open a reading about",
        firstSuffix: "so the map can begin recognizing recurrences.",
        actionTitle: "Concrete action",
        actionText: "Choose a small gesture connected to",
        actionFallback:
          "Choose a small gesture that makes the day clearer, even without solving everything.",
      }
    : {
        ritualTitle: "Ritual de 2 minutos",
        ritualText:
          "Respire, nomeie a fase que você está atravessando e escreva uma frase sobre o que pede cuidado hoje.",
        reviewTitle: "Revisar padrão",
        reviewText:
          "Observe a carta ou tema que voltou mais de uma vez antes de abrir outra pergunta.",
        firstTitle: "Primeiro sinal",
        firstText: "Abra uma leitura sobre",
        firstSuffix: "para o mapa começar a reconhecer recorrências.",
        actionTitle: "Ação concreta",
        actionText: "Escolha um gesto pequeno ligado a",
        actionFallback:
          "Escolha um gesto pequeno que deixe o dia mais claro, mesmo sem resolver tudo.",
      };
  const focus = profile.focusAreas[0]
    ? localizeProfileSignal(profile.focusAreas[0], locale).toLowerCase()
    : isEnglish
      ? "your main energy"
      : "sua energia principal";
  const phase = profile.currentPhase
    ? localizeProfileSignal(profile.currentPhase, locale).toLowerCase()
    : isEnglish
      ? "the phase you are moving through"
      : "a fase que você está atravessando";
  const desiredShift = profile.desiredShift
    ? localizeProfileSignal(profile.desiredShift, locale).toLowerCase()
    : "";

  return [
    {
      title: copy.ritualTitle,
      text: isEnglish
        ? copy.ritualText.replace("the phase you are moving through", phase)
        : copy.ritualText.replace("a fase que você está atravessando", phase),
      href: "#mapa-inicial",
    },
    {
      title: hasHistory ? copy.reviewTitle : copy.firstTitle,
      text: hasHistory
        ? copy.reviewText
        : `${copy.firstText} ${focus} ${copy.firstSuffix}`,
      href: hasHistory ? "#historico-vivo" : "/#leitura",
    },
    {
      title: copy.actionTitle,
      text: desiredShift ? `${copy.actionText} ${desiredShift}.` : copy.actionFallback,
      href: "/#acao",
    },
  ];
}

const themeLabels: Record<string, Record<Locale, string>> = {
  love: { "pt-BR": "Amor", en: "Love" },
  career: { "pt-BR": "Carreira", en: "Career" },
  money: { "pt-BR": "Dinheiro", en: "Money" },
  family: { "pt-BR": "Família", en: "Family" },
  spirit: { "pt-BR": "Espiritual", en: "Spiritual" },
};

const spreadLabels: Record<string, Record<Locale, string>> = {
  one_card: { "pt-BR": "Mensagem de 1 Carta", en: "One-Card Message" },
  three_card_timeline: { "pt-BR": "Caminho das 3 Cartas", en: "Three-Card Path" },
  situation_obstacle_direction: {
    "pt-BR": "Situação · Obstáculo · Direção",
    en: "Situation · Obstacle · Direction",
  },
  relationship_intention_dynamic_boundary: {
    "pt-BR": "Sinais do Amor",
    en: "Signs of Love",
  },
  healing_wound_resource_next: {
    "pt-BR": "Mapa do Momento",
    en: "Map of the Moment",
  },
  diamond: { "pt-BR": "O Diamante", en: "The Diamond" },
  flying_bird: { "pt-BR": "O Pássaro Voando", en: "The Flying Bird" },
  the_key: { "pt-BR": "A Chave", en: "The Key" },
  mirror: { "pt-BR": "O Espelho", en: "The Mirror" },
  celtic_cross: { "pt-BR": "Cruz Celta", en: "Celtic Cross" },
  relating: { "pt-BR": "Relacionar", en: "Relating" },
  paradox: { "pt-BR": "O Paradoxo", en: "The Paradox" },
};

const ptPositionLabels: Record<string, string> = {
  SITUATION: "SITUAÇÃO",
  OBSTACLE: "OBSTÁCULO",
  DIRECTION: "DIREÇÃO",
};

function localizeTheme(theme: string, locale: Locale) {
  return themeLabels[theme]?.[locale] ?? theme;
}

function localizeSpreadLabel(
  spreadType: string | undefined,
  fallback: string | undefined,
  locale: Locale
) {
  if (spreadType && spreadLabels[spreadType]) {
    return spreadLabels[spreadType][locale];
  }

  return fallback || (locale === "en" ? "Reading" : "Leitura");
}

function getHistorySpreadGridClass(cardCount: number) {
  if (cardCount <= 3) return "grid-cols-3";
  if (cardCount <= 6) return "grid-cols-2 sm:grid-cols-3";
  return "grid-cols-2 sm:grid-cols-4";
}

function localizePosition(position: string, locale: Locale) {
  if (locale === "en") return translateOraclePosition(position, locale);
  return ptPositionLabels[position.toUpperCase()] ?? position;
}

function localizeHistoryCards(cards: ReadingSpreadCard[], locale: Locale) {
  return cards.map((card) => {
    const sourceCard = CARDS.find(
      (item) => item.key === card.cardKey || item.name === card.name
    );
    const localizedCard = sourceCard ? localizeTarotCard(sourceCard, locale) : null;

    return {
      ...card,
      assetPath: sourceCard?.assetPath ?? normalizeAssetPath(card.assetPath),
      position: localizePosition(card.position, locale),
      name: localizedCard?.name ?? card.name,
      keyword: localizedCard?.keywords[0] ?? card.keyword,
      meaning: localizedCard
        ? card.reversed
          ? localizedCard.reversed
          : localizedCard.upright
        : card.meaning,
      coreMeaning: localizedCard?.guide.core ?? card.coreMeaning,
      lifeQuestion: localizedCard?.guide.question ?? card.lifeQuestion,
    };
  });
}

function buildLocalizedHistorySummary(cards: ReadingSpreadCard[], locale: Locale) {
  const heading = locale === "en" ? "Localized reading summary" : "Resumo localizado da leitura";
  const reversedSuffix = locale === "en" ? " (reversed)" : " reversa";

  return [
    heading,
    ...cards.map(
      (card) =>
        `${card.position}: ${card.name}${card.reversed ? reversedSuffix : ""}. ${
          card.coreMeaning ?? card.meaning
        } ${card.meaning}`
    ),
  ].join("\n\n");
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MeuUniversoPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { currency: productCurrency, setCurrency: setProductCurrency } =
    useProductCurrency(locale);
  const [userId, setUserId] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [commitments, setCommitments] = useState<ImpactCommitment[]>([]);
  const [readingProfile, setReadingProfile] =
    useState<ReadingProfile>(EMPTY_READING_PROFILE);
  const [profileDraft, setProfileDraft] =
    useState<ReadingProfile>(EMPTY_READING_PROFILE);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [syncNotice, setSyncNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextUserId = getOrCreateLocalUserId();
    setUserId(nextUserId);
    const localProfile = getStoredReadingProfile();
    if (hasProfileSignal(localProfile)) {
      setReadingProfile(localProfile);
      setProfileDraft(localProfile);
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthChecked(true);
    } else {
      supabase.auth
        .getUser()
        .then(({ data }) => setAccountEmail(data.user?.email ?? ""))
        .catch(() => setAccountEmail(""))
        .finally(() => setAuthChecked(true));
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setCheckoutNotice(
        "Pagamento recebido. Estamos confirmando seu acesso agora."
      );
    }
  }, []);

  useEffect(() => {
    if (!userId || !authChecked) return;

    async function load() {
      setLoading(true);
      setError("");
      const activeReadingMessage = localActiveReadingAsSavedMessage(getLocalActiveReading());
      const initialLocalMessages = dedupeMessages([
        ...(activeReadingMessage ? [activeReadingMessage] : []),
        ...getLocalSavedMessages(),
      ]);
      const initialLocalCommitments = getLocalImpactCommitments();
      const localProfile = getStoredReadingProfile();
      if (initialLocalMessages.length) {
        setMessages(initialLocalMessages);
      }
      if (initialLocalCommitments.length) {
        setCommitments(initialLocalCommitments);
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        if (accountEmail && params.get("checkout") === "success" && sessionId) {
          const confirmRes = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const confirmData = (await confirmRes.json()) as unknown;

          if (confirmRes.ok) {
            setCheckoutNotice("Acesso liberado. Sua leitura já pode ser aberta abaixo.");
            if (isRecord(confirmData) && Array.isArray(confirmData.entitlements)) {
              setEntitlements(confirmData.entitlements as Entitlement[]);
            }
          } else {
            setCheckoutNotice(
              "Pagamento recebido. Se o acesso ainda não aparecer, aguarde alguns segundos e atualize esta página."
            );
          }
        }

        if (!accountEmail) {
          setReadings([]);
          setEntitlements([]);
          setReadingProfile(localProfile);
          setProfileDraft(localProfile);
          return;
        }

        const syncResult = await syncLocalUniverseToAccount();
        if (syncResult.syncedMessageKeys.length) {
          setSyncNotice(
            `${syncResult.syncedMessageKeys.length} ${
              syncResult.syncedMessageKeys.length === 1
                ? "mensagem foi protegida"
                : "mensagens foram protegidas"
            } na sua conta.`
          );
        }

        const [readingsRes, messagesRes, entitlementsRes, actionsRes, profileRes] = await Promise.all([
          fetch("/api/readings?limit=20"),
          fetch("/api/saved-messages?limit=20"),
          fetch("/api/entitlements"),
          fetch("/api/actions"),
          fetch("/api/profile"),
        ]);

        const readingsData = (await readingsRes.json()) as unknown;
        const messagesData = (await messagesRes.json()) as unknown;
        const entitlementsData = (await entitlementsRes.json()) as unknown;
        const actionsData = (await actionsRes.json()) as unknown;
        const profileData = (await profileRes.json()) as unknown;

        if (
          !readingsRes.ok ||
          !messagesRes.ok ||
          !entitlementsRes.ok ||
          !actionsRes.ok ||
          !profileRes.ok
        ) {
          throw new Error("Não foi possível carregar seu histórico.");
        }

        setReadings(
          isRecord(readingsData)
            ? (asArray(readingsData.readings) as Reading[])
            : []
        );
        const remoteMessages = isRecord(messagesData)
          ? (asArray(messagesData.messages) as SavedMessage[])
          : [];
        const currentActiveReadingMessage = localActiveReadingAsSavedMessage(getLocalActiveReading());
        const localMessages = [
          ...(currentActiveReadingMessage ? [currentActiveReadingMessage] : []),
          ...getLocalSavedMessages(),
        ];
        const mergedMessages = dedupeMessages([...remoteMessages, ...localMessages]);

        setMessages(
          mergedMessages.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
        setEntitlements(
          isRecord(entitlementsData)
            ? (asArray(entitlementsData.entitlements) as Entitlement[])
            : []
        );
        setCommitments(
          isRecord(actionsData)
            ? (asArray(actionsData.commitments) as ImpactCommitment[])
            : []
        );
        const remoteProfile = isRecord(profileData)
          ? normalizeReadingProfile(profileData.profile)
          : EMPTY_READING_PROFILE;
        let nextProfile = remoteProfile;

        if (!hasProfileSignal(remoteProfile) && hasProfileSignal(localProfile)) {
          try {
            const profileSyncRes = await fetch("/api/profile", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(localProfile),
            });
            const profileSyncData = (await profileSyncRes.json()) as unknown;
            if (profileSyncRes.ok && isRecord(profileSyncData)) {
              nextProfile = normalizeReadingProfile(profileSyncData.profile);
            }
          } catch {
            // The local profile remains available even if its first remote sync fails.
          }
        }
        setReadingProfile(nextProfile);
        setProfileDraft(nextProfile);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível carregar seu histórico."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [accountEmail, authChecked, userId]);

  const savedReadingMessages = useMemo(() => {
    const remoteReadingIds = new Set(readings.map((reading) => reading.id));
    return messages.filter(
      (message) =>
        message.message_type === "reading" &&
        isSavedReadingPayload(message.payload) &&
        (!message.reading_id || !remoteReadingIds.has(message.reading_id))
    );
  }, [messages, readings]);
  const otherSavedMessages = useMemo(
    () => messages.filter((message) => message.message_type !== "reading"),
    [messages]
  );
  const labContinuity = useMemo(
    () =>
      getLabPracticeContinuity(
        messages
          .filter((message) => message.message_type === "practice")
          .map((message) => message.payload)
      ),
    [messages]
  );
  const readingHistoryCount = readings.length + savedReadingMessages.length;
  const profileCompletion = getProfileCompletion(profileDraft);
  const profileComplete = getProfileCompletion(readingProfile) >= 4;
  const profileCanSave = hasProfileSignal(profileDraft);
  const hasAnyJourneySignal =
    readingHistoryCount > 0 ||
    otherSavedMessages.length > 0 ||
    entitlements.length > 0 ||
    commitments.length > 0 ||
    profileCompletion > 0;

  const stats = useMemo(
    (): UniverseStat[] => [
      { label: "Leituras", value: readingHistoryCount, visual: PDU_ASSETS.surfaces.readings },
      { label: "Salvas", value: otherSavedMessages.length, visual: PDU_ASSETS.surfaces.saved },
      { label: "Acessos", value: entitlements.length, visual: PDU_ASSETS.surfaces.access },
      {
        label: "Ações concluídas",
        value: commitments.filter((commitment) => commitment.status === "completed").length,
        visual: PDU_ASSETS.surfaces.actionComplete,
      },
      {
        label: "Em movimento",
        value: commitments.filter((commitment) =>
          ["committed", "deferred"].includes(commitment.status)
        ).length,
        visual: PDU_ASSETS.surfaces.movement,
      },
      {
        label: "Tema mais recente",
        value: readings[0]?.theme ? localizeTheme(readings[0].theme, locale) : "—",
        visual: PDU_ASSETS.surfaces.map,
      },
    ],
    [
      commitments,
      entitlements.length,
      locale,
      otherSavedMessages.length,
      readingHistoryCount,
      readings,
    ]
  );

  const journeySnapshot = useMemo(
    () => buildJourneySnapshot(readings, messages, readingProfile, commitments),
    [commitments, messages, readingProfile, readings]
  );
  const labLatestTitle = labContinuity.latest
    ? LAB_PRACTICE_LABELS[labContinuity.latest.practiceKey][locale === "en" ? "en" : "pt"]
    : "";
  const labNextTitle = labContinuity.recommendedPracticeKey
    ? LAB_PRACTICE_LABELS[labContinuity.recommendedPracticeKey][locale === "en" ? "en" : "pt"]
    : "";
  const journeyRecommendations = useMemo(
    () => getJourneyRecommendations(journeySnapshot),
    [journeySnapshot]
  );
  const journeyThemes = useMemo(
    () =>
      journeySnapshot.themes.map((pattern) =>
        pattern.count > 1 ? `${pattern.label} (${pattern.count}x)` : pattern.label
      ),
    [journeySnapshot.themes]
  );
  const journeyCards = useMemo(
    () =>
      journeySnapshot.cards.map((pattern) =>
        pattern.count > 1 ? `${pattern.label} (${pattern.count}x)` : pattern.label
      ),
    [journeySnapshot.cards]
  );
  const nextMapSteps = useMemo(
    () => {
      const steps = getInitialMapNextSteps(
        readingProfile,
        journeySnapshot.hasHistory,
        locale
      );
      const recurringPattern =
        journeySnapshot.recurringThemes[0] ?? journeySnapshot.recurringCards[0];
      const recurringLabel = recurringPattern
        ? localizeTheme(recurringPattern.label, locale)
        : "";

      if (
        recurringPattern &&
        journeyRecommendations.some((item) => item.kind === "review_pattern")
      ) {
        steps[1] = {
          title: locale === "en" ? "Review a pattern" : "Revisar padrão",
          text:
            locale === "en"
              ? `Notice how “${recurringLabel}” returned ${recurringPattern.count} times before opening another question.`
              : `Observe como “${recurringLabel}” voltou ${recurringPattern.count} vezes antes de abrir outra pergunta.`,
          href: "#historico-vivo",
        };
      } else if (
        journeySnapshot.recentThemes[0] &&
        journeyRecommendations.some((item) => item.kind === "continue_thread")
      ) {
        steps[1] = {
          title: locale === "en" ? "Continue this thread" : "Continuar este fio",
          text:
            locale === "en"
              ? `Return to what appeared most recently — “${localizeTheme(journeySnapshot.recentThemes[0], locale)}” — and notice what has changed since then.`
              : `Volte ao que apareceu por último — “${journeySnapshot.recentThemes[0]}” — e veja o que mudou desde então.`,
          href: "/?continuar=1#leitura",
          continuity: {
            theme: journeySnapshot.recentThemes[0],
            prompt:
              locale === "en"
                ? `What has changed around ${journeySnapshot.recentThemes[0]} since I last looked at it?`
                : `O que mudou em relação a ${journeySnapshot.recentThemes[0]} desde a última vez que olhei para isso?`,
          },
        };
      } else if (
        journeyRecommendations.some((item) => item.kind === "open_first_reading")
      ) {
        steps[1] = {
          title: locale === "en" ? "First signal" : "Primeiro sinal",
          text:
            locale === "en"
              ? `Open a reading about ${localizeProfileSignal(readingProfile.focusAreas[0] ?? "your main energy", locale).toLowerCase()} so the map can begin recognizing recurrences.`
              : `Abra uma leitura sobre ${(readingProfile.focusAreas[0] ?? "sua energia principal").toLowerCase()} para o mapa começar a reconhecer recorrências.`,
          href: "/#leitura",
        };
      }

      if (journeyRecommendations.some((item) => item.kind === "calibrate_profile")) {
        steps[0] = {
          title: locale === "en" ? "Complete the Map" : "Completar o Mapa",
          text:
            locale === "en"
              ? "Choose a few more signals about your moment so future answers can find a more personal axis."
              : "Escolha mais alguns sinais sobre seu momento para as próximas respostas encontrarem um eixo mais pessoal.",
          href: "#mapa-inicial",
        };
      }

      if (journeyRecommendations.some((item) => item.kind === "complete_action")) {
        steps[2] = {
          title: locale === "en" ? "Complete a gesture" : "Concluir um gesto",
          text:
            locale === "en"
              ? "Return to the commitment you chose and record what happened without demanding perfection."
              : "Volte ao compromisso que você escolheu e registre o que aconteceu, sem exigir perfeição.",
          href: "#acoes-vivas",
        };
      }

      return steps;
    },
    [
      journeyRecommendations,
      journeySnapshot.hasHistory,
      journeySnapshot.recurringCards,
      journeySnapshot.recurringThemes,
      journeySnapshot.recentThemes,
      locale,
      readingProfile,
    ]
  );
  const activeCircleAccess = entitlements.some((item) => isCircleEntitlement(item));
  const activeBillingSubscription = entitlements.some(
    (item) => item.source === "subscription"
  );
  const hasOwnerAdminAccess = entitlements.some((item) => item.id.startsWith("owner-"));
  const recommendedProduct = useMemo(() => {
    const key = recommendedProductKey(profileComplete ? readingProfile : profileDraft);
    return (
      paidReadingProducts.find((product) => product.productKey === key) ??
      paidReadingProducts[0]
    );
  }, [profileComplete, profileDraft, readingProfile]);
  const recommendedTitle = recommendedProduct ? t(recommendedProduct.title) : "";
  const recommendedPromise = recommendedProduct
    ? t(recommendedProduct.promise)
    : "";
  const recommendedPrice = recommendedProduct
    ? getProductCardPrice(recommendedProduct, productCurrency)
    : formatProductPrice("caminho_3_cartas", productCurrency);
  const recommendedEntitlement = recommendedProduct
    ? findEntitlementForProduct(entitlements, recommendedProduct.productKey)
    : null;
  const recommendedProductUnlocked = Boolean(recommendedEntitlement);
  const recommendedAccessLabel =
    recommendedEntitlement && isCircleEntitlement(recommendedEntitlement)
      ? t("Incluído no Círculo")
      : recommendedEntitlement
        ? t("Liberado")
        : recommendedPrice;
  const accountDisplayName =
    readingProfile.displayName.trim() || profileDraft.displayName.trim();
  const accountIdentityTitle = accountDisplayName || t("Conta conectada");
  const accountInitialSource = accountDisplayName || accountEmail || "P";
  const accountInitial = accountInitialSource
    .trim()
    .charAt(0)
    .toLocaleUpperCase(locale);

  function openReadingProduct(productKey: string) {
    const product = productCards.find((item) => item.productKey === productKey);
    if (product?.href && productKey !== "carta_do_dia") {
      const separator = product.href.includes("?") ? "&" : "?";
      router.push(`${product.href}${separator}currency=${encodeURIComponent(
        productCurrency
      )}`);
      return;
    }

    router.push(
      product?.href ??
      `/?product=${encodeURIComponent(productKey)}&currency=${encodeURIComponent(
        productCurrency
      )}`
    );
  }

  function toggleProfileList(key: "focusAreas" | "boundaries", value: string) {
    setProfileDraft((current) => {
      const exists = current[key].includes(value);
      const next = exists
        ? current[key].filter((item) => item !== value)
        : [...current[key], value].slice(0, 6);
      return { ...current, [key]: next };
    });
  }

  async function saveReadingProfile() {
    setProfileSaving(true);
    setProfileNotice("");
    try {
      const normalizedDraft = normalizeReadingProfile(profileDraft);
      if (!accountEmail) {
        window.localStorage.setItem(
          "pdu_onboarding_profile",
          JSON.stringify(normalizedDraft)
        );
        setReadingProfile(normalizedDraft);
        setProfileDraft(normalizedDraft);
        setProfileNotice(
          "Mapa guardado neste dispositivo. Entre para proteger o histórico e continuar em outros acessos."
        );
        return;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(normalizedDraft),
      });
      const data = (await res.json()) as unknown;
      if (res.status === 401) {
        window.location.href = buildLoginPath("/meu-universo#mapa-inicial");
        return;
      }
      if (!res.ok || !isRecord(data)) {
        throw new Error(
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Não foi possível salvar seu Mapa Inicial."
        );
      }
      const nextProfile = normalizeReadingProfile(data.profile);
      setReadingProfile(nextProfile);
      setProfileDraft(nextProfile);
      setProfileNotice(
        "Mapa Inicial calibrado. Suas próximas leituras já podem usar esse contexto."
      );
    } catch (caught) {
      setProfileNotice(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar seu Mapa Inicial."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function startUniverseCheckout(productKey: string) {
    setPurchaseLoading(productKey);
    setCheckoutNotice("");
    setError("");
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productKey, locale, currency: productCurrency }),
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        window.location.href = buildLoginPath(
          `/meu-universo?comprar=${encodeURIComponent(
            productKey
          )}&currency=${encodeURIComponent(productCurrency)}`
        );
        return;
      }

      if (!res.ok || !isRecord(data) || typeof data.checkoutUrl !== "string") {
        throw new Error(
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Não foi possível abrir o checkout."
        );
      }

      window.location.href = data.checkoutUrl;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Falha ao abrir o checkout."
      );
    } finally {
      setPurchaseLoading("");
    }
  }

  async function openBillingPortal() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as unknown;
      if (!res.ok || !isRecord(data) || typeof data.url !== "string") {
        throw new Error("Não foi possível abrir a gestão da assinatura.");
      }
      window.location.href = data.url;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível abrir a gestão da assinatura."
      );
    }
  }

  return (
    <main className="min-h-screen ritual-texture text-[#241b18]">
      <header className="pdu-universe-header border-b border-[#e2d3c0] bg-[#fbf6ee]/92 backdrop-blur">
        <div className="pdu-universe-header__inner mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4d3c31]"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
          <div className="pdu-universe-header__actions flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm text-[#6f615a]">
            <Sparkles size={16} />
            Meu Universo
            <ProductCurrencySwitch
              currency={productCurrency}
              locale={locale}
              onChange={setProductCurrency}
              className="pdu-currency-switch--compact ml-2"
            />
            {accountEmail ? (
              <span
                title={accountEmail}
                className="ml-2 hidden max-w-[220px] items-center gap-2 rounded-lg border border-[#d8c3a6] bg-white/70 px-3 py-1.5 font-semibold text-[#4d3c31] lg:inline-flex"
              >
                <UserRound size={14} />
                <span className="truncate">
                  {t("Conectado como")} {accountDisplayName || accountEmail}
                </span>
              </span>
            ) : null}
            {hasOwnerAdminAccess ? (
              <Link
                href="/admin/codigos"
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-[#d8c3a6] bg-white/70 px-3 py-1.5 font-semibold text-[#4d3c31]"
              >
                <ShieldCheck size={14} />
                Admin
              </Link>
            ) : null}
            {accountEmail ? (
              <form action="/auth/signout?next=/entrar" method="post">
                <button
                  type="submit"
                  className="ml-2 rounded-lg border border-[#d8c3a6] px-3 py-1.5 font-semibold text-[#4d3c31]"
                >
                  Sair
                </button>
              </form>
            ) : (
              <Link
                href={buildLoginPath("/meu-universo")}
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-[#241b18] px-3 py-1.5 font-semibold text-[#fff7e8]"
              >
                <LogIn size={14} />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
              Histórico pessoal
            </p>
            <h1 className="brand-serif mt-2 text-5xl font-semibold leading-none text-[#241b18] sm:text-6xl">
              Suas mensagens começam a formar um mapa.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#6f615a]">
              Leituras, cartas salvas, decisões e ações viram um arquivo vivo:
              um lugar para voltar, perceber padrões e abrir respostas com mais
              contexto.
            </p>
            {!accountEmail ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={buildLoginPath("/meu-universo")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8] shadow-[0_18px_50px_rgba(36,27,24,0.18)]"
                >
                  <LogIn size={16} />
                  Criar meu universo
                </Link>
                <Link
                  href="/#leitura"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8c3a6] bg-white/55 px-5 py-3 text-sm font-semibold text-[#4d3c31]"
                >
                  Fazer uma leitura primeiro
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : null}
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[#241b18]/10 bg-[#111019] p-5 text-[#fff7e8] shadow-[0_34px_100px_rgba(36,27,24,0.16)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(244,213,141,0.22),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(167,215,197,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/25 bg-white/[0.06] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  <MoonStar size={13} />
                  {accountEmail ? "Mapa ativo" : "Prévia do Mapa Inicial"}
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-[#a7d7c5]">
                  <Sparkles size={17} />
                </span>
              </div>

              <h2 className="brand-serif mt-5 text-3xl font-semibold leading-tight">
                {accountEmail
                  ? "A memória dá profundidade às próximas leituras."
                  : t("Crie sua conta para Lume guardar o contexto que você escolheu compartilhar.")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#d8ccc0]">
                  {accountEmail
                    ? "Seu universo combina histórico, preferências e sinais recorrentes para respostas menos genéricas."
                    : t("A conta dá a Lume um lugar para guardar somente o contexto que você escolheu compartilhar, proteger seu histórico e continuar sua jornada.")}
              </p>

              {accountEmail ? (
                <div className="mt-6 rounded-[24px] border border-[#f4d58d]/24 bg-white/[0.065] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#f4d58d]/30 bg-[#241b18] text-xl font-semibold text-[#f5d896] shadow-[0_0_30px_rgba(244,213,141,0.13)]">
                        <Image
                          src={PDU_ASSETS.surfaces.profile}
                          alt=""
                          width={64}
                          height={64}
                          quality={95}
                          sizes="64px"
                          className="absolute inset-0 h-full w-full object-contain opacity-40"
                        />
                        <span className="relative">{accountInitial}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                          {t("Você está no seu Universo")}
                        </p>
                        <h3 className="mt-1 truncate text-xl font-semibold text-[#fff7e8]">
                          {accountIdentityTitle}
                        </h3>
                        <p className="mt-1 truncate text-sm text-[#d8ccc0]">
                          {accountEmail}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#a7d7c5]/28 bg-[#a7d7c5]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-[#a7d7c5]">
                      <CheckCircle2 size={14} />
                      {t("Este é o seu perfil")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    {[
                      [t("Nome no Mapa"), accountDisplayName || t("Ainda não definido")],
                      [t("E-mail de acesso"), accountEmail],
                      [t("Sessão"), t("Autenticada")],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-2xl border border-white/10 bg-black/[0.14] p-3"
                      >
                        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
                          {label}
                        </span>
                        <strong className="mt-2 block truncate text-sm text-[#fff7e8]">
                          {value}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#mapa-inicial"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#f5d896]"
                  >
                    {t("Editar nome no Mapa Inicial")}
                    <ArrowRight size={13} />
                  </a>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Fase", readingProfile.currentPhase || "A calibrar"],
                  ["Tom", readingProfile.guidanceTone || "A escolher"],
                  ["Limites", readingProfile.boundaries.length ? `${readingProfile.boundaries.length}` : "Sem fatalismo"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"
                  >
                    <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#f5d896]">
                      {label}
                    </span>
                    <strong className="mt-2 block text-sm text-[#fff7e8]">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <PduAssetStory {...PDU_ASSET_STORIES.universe} tone="light" />

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-5"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#d8c3a6] bg-white/75 shadow-[0_10px_24px_rgba(80,57,34,0.08)]">
                <Image
                  src={stat.visual}
                  alt=""
                  width={56}
                  height={58}
                  quality={95}
                  sizes="56px"
                  className="h-12 w-12 object-contain"
                />
              </span>
              <p className="mt-4 text-sm text-[#6f615a]">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#241b18]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-[#d9aaa8] bg-[#fff1f0] p-4 text-sm text-[#7b3330]">
            {error}
          </div>
        ) : null}

        {checkoutNotice ? (
          <div className="mt-6 rounded-lg border border-[#a9cdbf] bg-[#eef8f2] p-4 text-sm leading-6 text-[#315d56]">
            {checkoutNotice}
          </div>
        ) : null}

        {syncNotice ? (
          <div className="mt-6 rounded-lg border border-[#a9cdbf] bg-[#eef8f2] p-4 text-sm leading-6 text-[#315d56]">
            {syncNotice}
          </div>
        ) : null}

        {authChecked && !accountEmail ? (
          <section className="mt-6 overflow-hidden rounded-[26px] border border-[#d8c3a6] bg-[#fffaf2] shadow-[0_24px_70px_rgba(80,57,34,0.08)]">
            <div className="grid gap-0 md:grid-cols-[1fr_auto] md:items-center">
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">
                  Próximo desbloqueio
                </p>
                <h2 className="brand-serif mt-2 text-3xl font-semibold text-[#332720]">
                  Proteja seu histórico e abra o Mapa Inicial.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f615a]">
                  A conta transforma leituras soltas em continuidade: histórico
                  remoto, compras, preferências e contexto para respostas mais
                  pessoais.
                </p>
              </div>
              <div className="flex h-full flex-col justify-center gap-3 border-t border-[#e6d8c3] bg-[#f8efe2] p-5 md:border-l md:border-t-0">
                <Link
                  href={buildLoginPath("/meu-universo")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8]"
                >
                  <LogIn size={16} />
                  Entrar com e-mail
                </Link>
                <p className="text-center text-xs leading-5 text-[#8a7667]">
                  Leva menos de um minuto.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {authChecked ? (
          <>
          {!loading && !hasAnyJourneySignal ? (
            <section className="mt-8 overflow-hidden rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] shadow-[0_30px_90px_rgba(80,57,34,0.1)]">
              <div className="grid gap-0 lg:grid-cols-[0.86fr_1.14fr]">
                <div className="bg-[#241b18] p-6 text-[#fff7e8] sm:p-8">
                  <p className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/25 bg-white/[0.06] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                    <Sparkles size={13} />
                    {locale === "en" ? "Start here" : "Comece por aqui"}
                  </p>
                  <h2 className="brand-serif mt-5 text-4xl font-semibold leading-tight">
                    {locale === "en"
                      ? "Your Universe is ready. It just needs its first signal."
                      : "Seu Universo está pronto. Falta só o primeiro sinal."}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
                    {locale === "en"
                      ? "Nothing is broken or missing. A new account starts as a calibrated space: first profile, then first reading, then the archive begins to show patterns."
                      : "Nada está quebrado ou perdido. Uma conta nova começa como um espaço calibrado: primeiro perfil, depois primeira leitura, então o arquivo começa a revelar padrões."}
                  </p>
                </div>
                <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-3 lg:p-8">
                  {[
                    {
                      visual: PDU_ASSETS.surfaces.profile,
                      title: locale === "en" ? "1. Calibrate" : "1. Calibrar",
                      text:
                        locale === "en"
                          ? "Fill four signals in the Initial Map so readings stop feeling generic."
                          : "Preencha quatro sinais no Mapa Inicial para as leituras deixarem de parecer genéricas.",
                      href: "#mapa-inicial",
                    },
                    {
                      visual: PDU_ASSETS.surfaces.readings,
                      title: locale === "en" ? "2. Open" : "2. Abrir",
                      text:
                        locale === "en"
                          ? "Ask one real question and let three cards become your first record."
                          : "Faça uma pergunta real e deixe três cartas virarem seu primeiro registro.",
                      href: "/#leitura",
                    },
                    {
                      visual: PDU_ASSETS.surfaces.action,
                      title: locale === "en" ? "3. Act" : "3. Agir",
                      text:
                        locale === "en"
                          ? "Turn one sentence from the reading into a small action in real life."
                          : "Transforme uma frase da leitura em uma ação pequena na vida real.",
                      href: "/#acao",
                    },
                  ].map((step) => (
                      <Link
                        key={step.title}
                        href={step.href}
                        className="group rounded-2xl border border-[#e4d3ba] bg-white/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#c4a678] hover:bg-white"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f4d58d]/35 text-[#8a6b3f]">
                          <Image
                            src={step.visual}
                            alt=""
                            width={25}
                            height={25}
                            className="h-6 w-6 object-contain"
                          />
                        </span>
                        <strong className="mt-4 block text-sm text-[#332720]">
                          {step.title}
                        </strong>
                        <p className="mt-2 text-sm leading-6 text-[#6f615a]">
                          {step.text}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">
                          {locale === "en" ? "Continue" : "Continuar"}
                          <ArrowRight size={13} />
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#241b18]/10 bg-[#111019] text-[#fff7e8] shadow-[0_34px_100px_rgba(36,27,24,0.18)]">
            <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
              <div
                id="mapa-inicial"
                className="relative min-h-full scroll-mt-28 overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-8"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(244,213,141,0.18),transparent_30%),radial-gradient(circle_at_80%_60%,rgba(167,215,197,0.16),transparent_34%)]" />
                <div className="relative">
                  <p className="inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/22 bg-white/[0.05] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                    <Sparkles size={13} />
                    Mapa Inicial
                  </p>
                  <h2 className="brand-serif mt-5 text-4xl font-semibold leading-tight">
                    Calibre o jeito que o Universo fala com você.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
                    {accountEmail
                      ? "Este mapa virou contexto real para as leituras. Lume entende fase, tom, limites e foco sem você repetir tudo a cada pergunta."
                      : "Este mapa já personaliza a prévia neste dispositivo. Ao criar sua conta, você protege o contexto e transforma leituras soltas em continuidade."}
                  </p>

                  <div className="mt-6 grid gap-3 text-sm">
                    {[
                      ["Contexto", `${profileCompletion}/5 sinais essenciais`],
                      ["Status", profileComplete ? "Calibrado" : "Em aberto"],
                      ["Uso", "Aplicado nas próximas leituras"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between border-t border-white/10 pt-3"
                      >
                        <span className="text-[#a79d94]">{label}</span>
                        <strong className="text-[#fff7e8]">{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#fbf6ee] p-5 text-[#241b18] sm:p-6 lg:p-8">
                <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                      Nome de leitura
                    </span>
                    <input
                      value={profileDraft.displayName}
                      onChange={(event) =>
                        setProfileDraft((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a6b3f]"
                      placeholder="Como quer ser chamado?"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                      Fase atual
                    </span>
                    <select
                      value={profileDraft.currentPhase}
                      onChange={(event) =>
                        setProfileDraft((current) => ({
                          ...current,
                          currentPhase: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a6b3f]"
                    >
                      <option value="">Escolha uma fase</option>
                      {phaseOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <ProfileChoiceGroup
                    title="O que mais ocupa sua energia?"
                    icon={Compass}
                    options={focusAreaOptions}
                    selected={profileDraft.focusAreas}
                    onToggle={(value) => toggleProfileList("focusAreas", value)}
                  />
                  <ProfileChoiceGroup
                    title="O que você não quer receber?"
                    icon={ShieldCheck}
                    options={boundaryOptions}
                    selected={profileDraft.boundaries}
                    onToggle={(value) => toggleProfileList("boundaries", value)}
                  />
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                      Tom da orientação
                    </span>
                    <select
                      value={profileDraft.guidanceTone}
                      onChange={(event) =>
                        setProfileDraft((current) => ({
                          ...current,
                          guidanceTone: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a6b3f]"
                    >
                      <option value="">Escolha um tom</option>
                      {toneOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                      O que você busca agora?
                    </span>
                    <select
                      value={profileDraft.desiredShift}
                      onChange={(event) =>
                        setProfileDraft((current) => ({
                          ...current,
                          desiredShift: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a6b3f]"
                    >
                      <option value="">Escolha uma intenção</option>
                      {shiftOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-6 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                    Contexto que vale lembrar
                  </span>
                  <textarea
                    value={profileDraft.contextNote}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        contextNote: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-[#dfccb0] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#8a6b3f]"
                    placeholder="Ex.: estou numa transição de trabalho, quero respostas práticas e não quero alimentar ansiedade."
                  />
                </label>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#6f615a]">
                    {profileNotice ||
                      (profileCanSave
                        ? profileCompletion >= 4
                          ? "Seu Mapa Inicial já pode ser calibrado e salvo."
                          : "Você já pode salvar este perfil. Com 4 sinais, Lume calibra melhor as próximas leituras."
                        : "Preencha pelo menos um sinal para criar seu perfil de leitura.")}
                  </p>
                  <button
                    type="button"
                    onClick={saveReadingProfile}
                    disabled={profileSaving || !profileCanSave}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserRound size={16} />
                    {profileSaving
                      ? "Salvando..."
                      : !accountEmail
                        ? "Guardar neste dispositivo"
                      : profileCompletion >= 4
                        ? "Salvar Mapa Inicial"
                        : "Salvar perfil de leitura"}
                  </button>
                </div>
              </div>
            </div>
          </section>
          </>
        ) : null}

        {authChecked && accountEmail && recommendedProduct ? (
          <section className="mt-8 overflow-hidden rounded-[30px] border border-[#d8c3a6] bg-[#fffaf2] shadow-[0_30px_90px_rgba(80,57,34,0.1)]">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative overflow-hidden p-6 sm:p-7 lg:p-8">
                <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-[#d8c3a6] bg-[radial-gradient(circle,rgba(244,213,141,0.34),transparent_62%)] lg:block" />
                <p className="inline-flex items-center gap-2 rounded-full bg-[#241b18] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  <CreditCard size={13} />
                  {recommendedProductUnlocked ? t("Leitura liberada") : t("Próximo desbloqueio")}
                </p>
                <h2 className="brand-serif mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[#241b18]">
                  {recommendedProductUnlocked ? (
                    <>
                      {recommendedTitle} {t("já está no seu Universo.")}
                    </>
                  ) : profileComplete ? (
                    <>
                      {t("Seu mapa pede")} {recommendedTitle}.
                    </>
                  ) : (
                    t("Calibre o mapa e transforme contexto em leitura paga.")
                  )}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f615a]">
                  {recommendedProductUnlocked
                    ? t(
                        "Seu acesso foi reconhecido. Você pode abrir essa leitura sem checkout e continuar a jornada a partir do contexto salvo."
                      )
                    : profileComplete
                    ? `${recommendedPromise} ${t(
                        "A leitura usa sua pergunta, suas cartas e o Mapa Inicial para entregar uma resposta menos genérica."
                      )}`
                    : t(
                        "Quando quatro sinais estiverem preenchidos, a recomendação fica pronta para compra em um clique. Isso cria continuidade e aumenta a chance de uma leitura realmente útil."
                      )}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    [t("Recomendação"), recommendedTitle],
                    [
                      recommendedProductUnlocked ? t("Acesso") : t("Preço"),
                      recommendedAccessLabel,
                    ],
                    [
                      t("Perfil"),
                      profileComplete
                        ? t("Calibrado")
                        : `${profileCompletion}/5 ${t("sinais")}`,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#e4d3ba] bg-white/60 p-4"
                    >
                      <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                        {label}
                      </span>
                      <strong className="mt-2 block text-sm text-[#332720]">
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111019] p-6 text-[#fff7e8] sm:p-7 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  {recommendedProductUnlocked ? t("Acesso reconhecido") : t("Oferta natural")}
                </p>
                <h3 className="brand-serif mt-3 text-3xl font-semibold">
                  {recommendedProductUnlocked
                    ? t("Sem preço no caminho. Só abrir e continuar.")
                    : t("Uma pergunta real. Três cartas. Resposta contextual.")}
                </h3>
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#d8ccc0]">
                  {(recommendedProductUnlocked
                    ? [
                        t("O voucher ou plano ativo já removeu o checkout desta leitura."),
                        t("A resposta fica salva no Meu Universo para acompanhar padrões."),
                        t("O acesso continua respeitando o produto liberado na sua conta."),
                      ]
                    : [
                        t("Compra avulsa para uma decisão específica, sem assinatura."),
                        t("Resultado salvo no Meu Universo para acompanhar padrões."),
                        t("Caminho claro para entrar no Círculo quando quiser continuidade."),
                      ]
                  ).map((line) => (
                    <li key={line} className="border-t border-white/10 pt-3">
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      recommendedProductUnlocked
                        ? openReadingProduct(recommendedProduct.productKey)
                        : startUniverseCheckout(recommendedProduct.productKey)
                    }
                    disabled={
                      (!recommendedProductUnlocked && !profileComplete) ||
                      !!purchaseLoading
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {recommendedProductUnlocked ? <BookOpen size={16} /> : <CreditCard size={16} />}
                    {purchaseLoading === recommendedProduct.productKey
                      ? t("Abrindo checkout...")
                      : recommendedProductUnlocked
                        ? t("Abrir leitura liberada")
                        : profileComplete
                        ? `${t("Desbloquear por")} ${recommendedPrice}`
                        : t("Complete o mapa primeiro")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startUniverseCheckout("circulo_do_universo")}
                    disabled={activeCircleAccess || !!purchaseLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#fff7e8] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <Sparkles size={16} />
                    {purchaseLoading === "circulo_do_universo"
                      ? t("Abrindo assinatura...")
                      : activeCircleAccess
                        ? t("Círculo ativo")
                        : `${t("Entrar no Círculo mensal")} · ${formatProductPrice(
                            "circulo_do_universo",
                            productCurrency
                          )}/${locale === "en" ? "month" : "mês"}`}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {authChecked ? (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#d8c3a6] bg-[#fffaf2] shadow-[0_28px_90px_rgba(80,57,34,0.09)]">
            <div className="grid gap-0 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="bg-[#241b18] p-6 text-[#fff7e8] sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  Progressão simbólica
                </p>
                <h2 className="brand-serif mt-3 text-4xl font-semibold leading-tight">
                  {journeySnapshot.totalSignals
                    ? "Seu mapa já começou a reconhecer padrões."
                    : "Seu mapa não começa vazio."}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
                  {journeySnapshot.totalSignals
                    ? "Cada leitura salva, carta do dia e ação registrada aumenta o contexto das próximas respostas."
                    : "Mesmo antes do histórico, o Mapa Inicial transforma fase, foco e intenção em um ponto de partida pessoal."}
                </p>

                <div className="mt-6 grid gap-3">
                  {[
                    ["Sinais registrados", String(journeySnapshot.totalSignals)],
                    [
                      "Fase atual",
                      readingProfile.currentPhase || "A calibrar no Mapa Inicial",
                    ],
                    [
                      "Busca atual",
                      readingProfile.desiredShift || "Escolher uma intenção",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-t border-white/10 pt-3 text-sm"
                    >
                      <span className="text-[#a79d94]">{label}</span>
                      <strong className="max-w-[58%] text-right text-[#fff7e8]">
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#e4d3ba] bg-white/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                      Temas que retornam
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(journeyThemes.length
                        ? journeyThemes
                        : readingProfile.focusAreas.length
                          ? readingProfile.focusAreas.slice(0, 3)
                          : ["Ainda sem histórico"]).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-[#241b18] px-3 py-1 text-xs font-semibold text-[#fff7e8]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e4d3ba] bg-white/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                      Cartas e símbolos
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(journeyCards.length
                        ? journeyCards
                        : ["Abra uma leitura para revelar"]).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[#d8c3a6] px-3 py-1 text-xs font-semibold text-[#4d3c31]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  {nextMapSteps.map((step) => (
                    <Link
                      key={step.title}
                      href={step.href}
                      onClick={() => {
                        if (!step.continuity) return;
                        window.sessionStorage.setItem(
                          "pdu_continuity_prompt",
                          JSON.stringify(step.continuity)
                        );
                      }}
                      className="group rounded-2xl border border-[#e4d3ba] bg-[#fbf6ee] p-4 transition hover:-translate-y-0.5 hover:border-[#c4a678] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6b3f] focus-visible:ring-offset-2"
                    >
                      <p className="text-sm font-semibold text-[#332720]">
                        {step.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6f615a]">
                        {step.text}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">
                        {locale === "en" ? "Continue" : "Continuar"}
                        <ArrowRight size={13} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
        </section>
       ) : null}

        {labContinuity.latest ? (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#a9cdbf] bg-[#f3f8f3] shadow-[0_24px_70px_rgba(49,93,86,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-6 sm:p-7 lg:p-8">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#315d56] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white">
                  <Sparkles size={13} />
                  {locale === "en" ? "Lab continuity" : "Continuidade do Lab"}
                </p>
                <h2 className="brand-serif mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[#27453d]">
                  {locale === "en" ? "Your last gesture still has a next step." : "Seu último gesto ainda tem um próximo passo."}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#52705c]">
                  {locale === "en"
                    ? `Your latest practice was “${labLatestTitle}”. Keep its next gesture close, then choose whether to revisit it or open another door.`
                    : `Sua última prática foi “${labLatestTitle}”. Mantenha o próximo gesto por perto e escolha se quer revisitá-lo ou abrir outra porta.`}
                </p>
                <div className="mt-6 rounded-2xl border border-[#c7ddd0] bg-white/65 p-4">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#52705c]">
                    {locale === "en" ? "The gesture you kept" : "O gesto que ficou"}
                  </p>
                  <p className="mt-2 text-base leading-7 text-[#315d56]">{labContinuity.latest.nextStep}</p>
                  {labContinuity.repeatedPracticeKey ? (
                    <p className="mt-3 text-xs leading-5 text-[#52705c]">
                      {locale === "en"
                        ? "A door has appeared more than once in your history. The suggestion below offers a different angle without erasing what returned."
                        : "Uma porta apareceu mais de uma vez no seu histórico. A sugestão abaixo oferece outro ângulo sem apagar o que retornou."}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-6 bg-[#315d56] p-6 text-white sm:p-7 lg:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#cde2d2]">
                    {locale === "en" ? "Next door" : "Próxima porta"}
                  </p>
                  <h3 className="brand-serif mt-3 text-3xl font-semibold">{labNextTitle}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#e1eee3]">
                    {locale === "en"
                      ? "A new starting point can reveal what the first practice could not."
                      : "Um novo ponto de partida pode revelar o que a primeira prática ainda não alcançou."}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/lab?retomar=1#pratica" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#2b211c] hover:bg-[#f8e4b1]">
                    {locale === "en" ? "Resume this practice" : "Retomar esta prática"}
                    <ArrowRight size={16} />
                  </Link>
                  {labContinuity.recommendedPracticeKey ? (
                    <Link href={`/lab?porta=${encodeURIComponent(labContinuity.recommendedPracticeKey)}#pratica`} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.15]">
                      {locale === "en" ? "Open next door" : "Abrir próxima porta"}
                      <ArrowRight size={16} />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                Acessos ativos
              </p>
              <h2 className="brand-serif mt-1 text-3xl font-semibold">
                O que você pode abrir agora
              </h2>
            </div>
            <CheckCircle2 size={22} className="text-[#607464]" />
          </div>
          {activeBillingSubscription ? (
            <button
              type="button"
              onClick={openBillingPortal}
              className="mb-5 inline-flex rounded-full border border-[#d8c3a6] px-4 py-2 text-sm font-semibold text-[#4d3c31]"
            >
              Gerenciar assinatura e cobrança
            </button>
          ) : null}

          {loading && !entitlements.length ? (
            <UniverseSkeleton variant="access" />
          ) : entitlements.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {entitlements.map((entitlement) => (
                <article
                  key={entitlement.id}
                  className="rounded-lg border border-[#e4d3ba] bg-[#fbf6ee] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">
                    {entitlement.id.startsWith("owner-")
                      ? "Dono"
                      : entitlement.source === "admin"
                        ? "Voucher"
                      : entitlement.source === "subscription"
                      ? "Círculo"
                      : "Avulso"}
                  </p>
                  <h3 className="brand-serif mt-2 text-2xl font-semibold text-[#332720]">
                    {entitlement.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f615a]">
                    {entitlement.usage_limit
                      ? `${Math.max(
                          entitlement.usage_limit - entitlement.usage_count,
                          0
                        )} uso disponível.`
                      : entitlement.source === "subscription" ||
                          entitlement.product_key === CIRCLE_PRODUCT_KEY
                        ? "Acesso ativo enquanto a assinatura estiver válida."
                        : "Acesso liberado no seu universo."}
                  </p>
                  <Link
                    href={`/?product=${encodeURIComponent(
                      entitlement.product_key
                    )}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#111019] px-4 py-2 text-sm font-semibold text-[#fff7e8] hover:bg-[#242130]"
                  >
                    Abrir leitura
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <UniverseEmptyState kind="access" />
          )}
        </section>

        <section
          id="acoes-vivas"
          className="mt-8 scroll-mt-28 rounded-lg border border-[#a9cdbf] bg-[#f3f8f3] p-5"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#52705c]">
                Palavras que viram ação
              </p>
              <h2 className="brand-serif mt-1 text-3xl font-semibold">
                Seus compromissos com a vida real
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5f7163]">
                Concluir não é buscar perfeição. É registrar um gesto possível e
                perceber o que ele transformou.
              </p>
            </div>
            <Link
              href="/#acao"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#315d56] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <HandHeart size={16} />
              Escolher nova ação
            </Link>
          </div>

          {commitments.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {commitments.map((commitment) => (
                <ImpactCommitmentCard
                  key={commitment.id}
                  commitment={commitment}
                  onCompleted={(completed) =>
                    setCommitments((current) =>
                      current.map((item) =>
                        item.id === completed.id ? completed : item
                      )
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <UniverseEmptyState kind="actions" />
          )}
        </section>

        <div
          id="historico-vivo"
          className="mt-8 scroll-mt-28 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]"
        >
          <section className="rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                  Últimas leituras
                </p>
                <h2 className="brand-serif mt-1 text-3xl font-semibold">
                  Caminhos abertos
                </h2>
              </div>
              <BookOpen size={22} className="text-[#b46b68]" />
            </div>

            {loading && !readingHistoryCount ? (
              <UniverseSkeleton variant="readings" />
            ) : readingHistoryCount ? (
              <div className="space-y-3">
                {readings.map((reading) => (
                  <ReadingArticle key={reading.id} reading={reading} />
                ))}
                {savedReadingMessages.map((message) => (
                  <SavedMessageArticle key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <UniverseEmptyState kind="readings" />
            )}
          </section>

          <section className="rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6b3f]">
                  Mensagens salvas
                </p>
                <h2 className="brand-serif mt-1 text-3xl font-semibold">
                  O que ficou
                </h2>
              </div>
              <Bookmark size={22} className="text-[#b46b68]" />
            </div>

            {loading && !otherSavedMessages.length ? (
              <UniverseSkeleton variant="saved" />
            ) : otherSavedMessages.length ? (
              <div className="space-y-3">
                {otherSavedMessages.map((message) => (
                  <SavedMessageArticle key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <UniverseEmptyState kind="saved" />
            )}
          </section>
        </div>

      </section>
    </main>
  );
}

function ProfileChoiceGroup(props: {
  title: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const Icon = props.icon;
  return (
    <div className="rounded-2xl border border-[#dfccb0] bg-white/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4d58d]/35 text-[#8a6b3f]">
          <Icon size={17} />
        </span>
        <p className="text-sm font-semibold text-[#332720]">{props.title}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {props.options.map((option) => {
          const active = props.selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => props.onToggle(option)}
              data-active={active}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "border-[#241b18] bg-[#241b18] text-[#fff7e8]"
                  : "border-[#dfccb0] bg-[#fbf6ee] text-[#5b4d45] hover:border-[#8a6b3f]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImpactCommitmentCard(props: {
  commitment: ImpactCommitment;
  onCompleted: (commitment: ImpactCommitment) => void;
}) {
  const { locale } = useI18n();
  const { commitment } = props;
  const [reflection, setReflection] = useState(commitment.reflection);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const completed = commitment.status === "completed";
  const active = ["committed", "deferred"].includes(commitment.status);
  const areaLabel =
    IMPACT_AREA_LABELS[commitment.area as ImpactArea] ?? "Impacto";

  async function completeCommitment() {
    setSaving(true);
    setNotice("");

    if (commitment.local_only || commitment.id.startsWith("action_")) {
      const completedLocal = completeLocalImpactCommitment(
        commitment.id,
        reflection.trim()
      );
      if (completedLocal) props.onCompleted(completedLocal);
      if (commitment.public_token) {
        await fetch(`/api/actions/public/${encodeURIComponent(commitment.public_token)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            completionSecret: commitment.public_completion_secret,
          }),
        }).catch(() => null);
      }
      setNotice("Ação concluída e guardada neste navegador.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/actions/${encodeURIComponent(commitment.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "completed", reflection }),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok || !isRecord(data) || !isRecord(data.commitment)) {
        throw new Error("Não foi possível concluir a ação.");
      }
      props.onCompleted(data.commitment as ImpactCommitment);
      if (commitment.public_token) {
        await fetch(`/api/actions/public/${encodeURIComponent(commitment.public_token)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            completionSecret: commitment.public_completion_secret,
          }),
        }).catch(() => null);
      }
      setNotice("Ação concluída. Este gesto agora faz parte da sua jornada.");
    } catch (caught) {
      setNotice(
        caught instanceof Error
          ? caught.message
          : "Não foi possível concluir a ação agora."
      );
    } finally {
      setSaving(false);
    }
  }

  async function shareCommitment() {
    const chainToken = commitment.public_token;
    const url = chainToken
      ? new URL(`/acao/${encodeURIComponent(chainToken)}`, window.location.origin)
      : new URL(window.location.origin);
    if (!chainToken) {
      url.searchParams.set("acao", commitment.action_key);
      url.hash = "acao";
    }
    const text = `Hoje, uma palavra virou ação: ${commitment.action_title}. Continue esta corrente com um gesto possível para você.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Uma palavra virou ação",
          text,
          url: url.toString(),
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url.toString()}`);
        setNotice("Convite copiado para compartilhar.");
      }
    } catch {
      // User cancelled native share sheet.
    }
  }

  async function transitionCommitment(status: "deferred" | "cancelled") {
    const deferredUntil =
      status === "deferred"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;
    const reason =
      status === "cancelled"
        ? window.prompt("Por que este compromisso deixou de ser possível?") ?? ""
        : "";
    if (status === "cancelled" && !reason.trim()) return;

    if (commitment.local_only || commitment.id.startsWith("action_")) {
      const updated = updateLocalImpactCommitment(commitment.id, {
        status,
        deferred_until: deferredUntil,
        cancelled_reason: reason.trim(),
      });
      if (updated) props.onCompleted(updated);
      setNotice(
        status === "deferred"
          ? "Compromisso adiado por 24 horas."
          : "Compromisso encerrado sem culpa."
      );
      return;
    }

    const res = await fetch(`/api/actions/${encodeURIComponent(commitment.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, deferredUntil, reason }),
    });
    const data = (await res.json()) as unknown;
    if (res.ok && isRecord(data) && isRecord(data.commitment)) {
      props.onCompleted(data.commitment as ImpactCommitment);
      setNotice(
        status === "deferred"
          ? "Compromisso adiado por 24 horas."
          : "Compromisso encerrado sem culpa."
      );
    }
  }

  return (
    <article className="rounded-lg border border-[#bdd2c2] bg-[#fffdf8] p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-[#dceade] px-2 py-1 text-[#315d56]">
          {areaLabel}
        </span>
        <span className="rounded-full bg-[#e7dcc9] px-2 py-1 text-[#6f615a]">
          {completed
            ? "Concluída"
            : commitment.status === "deferred"
              ? "Adiada"
              : commitment.status === "cancelled"
                ? "Encerrada"
                : "Em compromisso"}
        </span>
        {commitment.invited_by ? (
          <span className="rounded-full bg-[#eee3f4] px-2 py-1 text-[#66506f]">
            Corrente continuada
          </span>
        ) : null}
      </div>
      <h3 className="brand-serif mt-4 text-2xl font-semibold text-[#332720]">
        {commitment.action_title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#5f7163]">{commitment.plan}</p>
      {commitment.first_step ? (
        <p className="mt-2 text-xs leading-5 text-[#5f7163]">
          <strong>Primeiro passo:</strong> {commitment.first_step}
        </p>
      ) : null}
      {commitment.scheduled_for ? (
        <p className="mt-2 text-xs leading-5 text-[#5f7163]">
          <strong>Quando:</strong> {formatDate(commitment.scheduled_for, locale)}
        </p>
      ) : null}

      {completed ? (
        <div className="mt-4 rounded-lg bg-[#edf5ee] p-4 text-sm leading-6 text-[#42604b]">
          <strong className="block">O que mudou depois da ação</strong>
          {commitment.reflection || "A ação foi concluída sem reflexão registrada."}
        </div>
      ) : active ? (
        <>
          <label
            htmlFor={`reflection-${commitment.id}`}
            className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-[#52705c]"
          >
            O que mudou depois que você agiu?
          </label>
          <textarea
            id={`reflection-${commitment.id}`}
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-2 w-full rounded-lg border border-[#bdd2c2] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#52705c]"
            placeholder="Uma frase já é suficiente."
          />
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {active ? (
          <button
            type="button"
            onClick={completeCommitment}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#315d56] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            {saving ? "Registrando..." : "Marcar como realizada"}
          </button>
        ) : null}
        {active ? (
          <>
            <button
              type="button"
              onClick={() => transitionCommitment("deferred")}
              className="inline-flex items-center gap-2 rounded-full border border-[#8fb09a] px-4 py-2 text-sm font-semibold text-[#315d56]"
            >
              Preciso de mais tempo
            </button>
            <button
              type="button"
              onClick={() => transitionCommitment("cancelled")}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c3a6] px-4 py-2 text-sm font-semibold text-[#6f615a]"
            >
              Encerrar compromisso
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={shareCommitment}
          className="inline-flex items-center gap-2 rounded-full border border-[#8fb09a] px-4 py-2 text-sm font-semibold text-[#315d56]"
        >
          <Share2 size={15} />
          Convidar alguém
        </button>
      </div>
      {notice ? (
        <p className="mt-3 text-xs leading-5 text-[#5f7163]">{notice}</p>
      ) : null}
    </article>
  );
}

function UniverseSkeleton({ variant }: { variant: "access" | "readings" | "saved" }) {
  const { locale } = useI18n();
  const visual =
    variant === "access"
      ? PDU_ASSETS.surfaces.access
      : variant === "saved"
        ? PDU_ASSETS.surfaces.saved
        : PDU_ASSETS.surfaces.readings;
  const title =
    variant === "access"
      ? locale === "en"
        ? "Checking your access"
        : "Verificando seus acessos"
      : variant === "saved"
        ? locale === "en"
          ? "Gathering saved messages"
          : "Reunindo mensagens salvas"
        : locale === "en"
          ? "Opening your history"
          : "Abrindo seu histórico";
  const line =
    locale === "en"
      ? "Your archive is being assembled with readings from this account and this device."
      : "Seu arquivo está sendo montado com leituras desta conta e deste dispositivo.";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4d3ba] bg-[#fbf6ee] p-5">
      <div className="flex items-start gap-3">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4d58d]/30 text-[#8a6b3f]">
          <Image
            src={visual}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 animate-pulse object-contain"
          />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#332720]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#6f615a]">{line}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-[#eadcc8] bg-[linear-gradient(100deg,rgba(255,255,255,0.4),rgba(244,213,141,0.22),rgba(255,255,255,0.42))]"
            style={{ animationDelay: `${item * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function UniverseEmptyState({
  kind,
}: {
  kind: "access" | "actions" | "readings" | "saved";
}) {
  const { locale } = useI18n();
  const copy = {
    access: {
      visual: PDU_ASSETS.surfaces.access,
      title:
        locale === "en"
          ? "No active unlocks yet."
          : "Nenhum desbloqueio ativo ainda.",
      text:
        locale === "en"
          ? "Paid readings and Circle access appear here after checkout. You can still calibrate your map and open the free reading first."
          : "Leituras pagas e acesso ao Círculo aparecem aqui depois do checkout. Você ainda pode calibrar o mapa e abrir a leitura grátis primeiro.",
      cta: locale === "en" ? "See experiences" : "Ver experiências",
      href: "/#produtos",
    },
    actions: {
      visual: PDU_ASSETS.surfaces.action,
      title:
        locale === "en"
          ? "No real-life action registered yet."
          : "Nenhuma ação de vida real registrada ainda.",
      text:
        locale === "en"
          ? "After a reading, choose one possible gesture. This turns the oracle into movement instead of passive prediction."
          : "Depois de uma leitura, escolha um gesto possível. Isso transforma o oráculo em movimento, não em previsão passiva.",
      cta: locale === "en" ? "Choose an action" : "Escolher uma ação",
      href: "/#acao",
    },
    readings: {
      visual: PDU_ASSETS.surfaces.readings,
      title:
        locale === "en"
          ? "Your first reading will live here."
          : "Sua primeira leitura vai morar aqui.",
      text:
        locale === "en"
          ? "Ask one honest question. The cards, answer, and advice become the first point in your personal map."
          : "Faça uma pergunta honesta. As cartas, a resposta e o conselho viram o primeiro ponto do seu mapa pessoal.",
      cta: locale === "en" ? "Open first reading" : "Abrir primeira leitura",
      href: "/#leitura",
    },
    saved: {
      visual: PDU_ASSETS.surfaces.saved,
      title:
        locale === "en"
          ? "Nothing saved yet."
          : "Nada salvo ainda.",
      text:
        locale === "en"
          ? "Save a reading or daily card when it feels useful. This area becomes your private archive of phrases worth returning to."
          : "Salve uma leitura ou carta do dia quando ela fizer sentido. Esta área vira seu arquivo privado de frases para revisitar.",
      cta: locale === "en" ? "See today’s card" : "Ver carta do dia",
      href: "/carta-do-dia",
    },
  }[kind];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4d3ba] bg-[#fbf6ee]">
      <div className="grid gap-0 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4d58d]/35 text-[#8a6b3f]">
              <Image
                src={copy.visual}
                alt=""
                width={25}
                height={25}
                className="h-6 w-6 object-contain"
              />
            </span>
            <div>
              <h3 className="font-semibold text-[#332720]">{copy.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f615a]">
                {copy.text}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e4d3ba] bg-white/45 p-5 sm:border-l sm:border-t-0">
          <Link
            href={copy.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241b18] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] transition duration-300 hover:-translate-y-0.5 hover:bg-[#3a2c25] sm:w-auto"
          >
            {copy.cta}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReadingArticle({ reading }: { reading: Reading }) {
  const { locale, t } = useI18n();
  const spreadCards = localizeHistoryCards(normalizeSpreadCards(reading.spread), locale);
  const readingLocale = normalizeLocale(reading.locale);
  const interpretation =
    reading.locale && readingLocale !== locale
      ? buildLocalizedHistorySummary(spreadCards, locale)
      : reading.interpretation;
  const reversedSuffix = locale === "en" ? " (reversed)" : " reversa";
  const spreadLine = spreadCards
    .map((card) => {
      const reversed = card.reversed ? reversedSuffix : "";
      return `${card.position}: ${card.name}${reversed}`;
    })
    .join(" | ");
  const spreadLabel = localizeSpreadLabel(reading.spread_type, undefined, locale);

  return (
    <article className="overflow-hidden rounded-lg border border-[#e4d3ba] bg-[#fbf6ee]">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6f615a]">
          <span className="rounded-full bg-[#e7dcc9] px-2 py-1">
            {reading.theme ? localizeTheme(reading.theme, locale) : t("Leitura")}
          </span>
          <span className="rounded-full bg-[#e7dcc9] px-2 py-1">
            {spreadLabel}
          </span>
          {reading.mode === "local" ? (
            <span className="rounded-full bg-[#ead8d3] px-2 py-1">
              {t("Neste dispositivo")}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {formatDate(reading.created_at, locale)}
          </span>
        </div>

        <h3 className="mt-3 font-semibold text-[#332720]">
          {reading.question || "Leitura salva"}
        </h3>

        {spreadCards.length ? (
          <>
            <div className={`mt-4 grid gap-2 sm:gap-3 ${getHistorySpreadGridClass(spreadCards.length)}`}>
              {spreadCards.map((card, index) => {
                const label = card.position || `Carta ${index + 1}`;

                return (
                  <div
                    key={`${card.cardKey || card.name}-${index}`}
                    className="rounded-lg border border-[#e4d3ba] bg-[#fffaf2] p-2 text-center"
                  >
                    <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">
                      {label}
                    </span>
                    <div className="mt-2 flex justify-center">
                      {card.assetPath ? (
                        <Image
                          src={card.assetPath}
                          alt={`${t("Carta da leitura")}: ${card.name}`}
                          width={144}
                          height={230}
                          className={`h-28 w-[4.35rem] rounded-md object-cover shadow-[0_16px_28px_rgba(60,42,24,0.18)] sm:h-36 sm:w-24 ${
                            card.reversed ? "rotate-180" : ""
                          }`}
                        />
                      ) : (
                        <div className="h-28 w-[4.35rem] rounded-md bg-[#e7dcc9] sm:h-36 sm:w-24" />
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-4 text-[#332720]">
                      {card.name}
                      {card.reversed ? reversedSuffix : ""}
                    </p>
                    {card.coreMeaning ? (
                      <p className="mt-2 text-left text-[0.72rem] leading-4 text-[#5c4b42]">
                        <span className="font-semibold text-[#8a6b3f]">
                          {locale === "en" ? "Represents: " : "Representa: "}
                        </span>
                        {card.coreMeaning}
                      </p>
                    ) : null}
                    {card.meaning ? (
                      <p className="mt-2 line-clamp-3 text-left text-[0.72rem] leading-4 text-[#6f615a]">
                        <span className="font-semibold text-[#8a6b3f]">
                          {locale === "en" ? "Here: " : "Aqui: "}
                        </span>
                        {card.meaning}
                      </p>
                    ) : null}
                    {card.lifeQuestion ? (
                      <p className="mt-2 text-left text-[0.7rem] italic leading-4 text-[#8a6b3f]">
                        <b className="not-italic">
                          {locale === "en" ? "Question to carry: " : "Pergunta para levar: "}
                        </b>
                        {card.lifeQuestion}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {spreadLine ? (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">
                {spreadLine}
              </p>
            ) : null}
          </>
        ) : null}

        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#5c4b42]">
          {interpretation}
        </p>
      </div>
    </article>
  );
}

function SavedMessageArticle({ message }: { message: SavedMessage }) {
  const { locale, t } = useI18n();
  if (message.message_type === "reading" && isSavedReadingPayload(message.payload)) {
    const theme = asString(message.payload.theme);
    const question = asString(message.payload.question);
    const result = asString(message.payload.result);
    const spreadType = asString(message.payload.spreadType);
    const spreadLabel = localizeSpreadLabel(
      spreadType,
      asString(message.payload.spreadLabel),
      locale
    );
    const messageLocale = normalizeLocale(message.payload.locale);
    const spreadCards = localizeHistoryCards(
      normalizeSpreadCards(message.payload.spreadCards),
      locale
    );
    const displayedResult =
      message.payload.locale && messageLocale !== locale
        ? buildLocalizedHistorySummary(spreadCards, locale)
        : result;

    return (
      <article className="overflow-hidden rounded-lg border border-[#e4d3ba] bg-[#fbf6ee]">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6f615a]">
            <span className="rounded-full bg-[#e7dcc9] px-2 py-1">
              {spreadLabel}
            </span>
            {theme ? (
              <span className="rounded-full bg-[#e7dcc9] px-2 py-1">
                {localizeTheme(theme, locale)}
              </span>
            ) : null}
            {message.local_only ? (
              <span className="rounded-full bg-[#ead8d3] px-2 py-1">
                {t("Neste dispositivo")}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-[#6f615a]">
            {formatDate(message.created_at, locale)}
          </p>
          <h3 className="mt-2 font-semibold text-[#332720]">
            {question || "Leitura salva"}
          </h3>

          {spreadCards.length ? (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {spreadCards.map((card, index) => {
                const name = asString(card.name);
                const assetPath = normalizeAssetPath(card.assetPath);

                return (
                  <div
                    key={`${name}-${index}`}
                    className="min-w-20 text-center"
                  >
                    {assetPath ? (
                      <Image
                        src={assetPath}
                        alt={`${t("Carta da leitura")}: ${name}`}
                        width={120}
                        height={192}
                        className={`h-24 w-16 rounded-md object-cover shadow-[0_14px_26px_rgba(60,42,24,0.18)] ${
                          card.reversed ? "rotate-180" : ""
                        }`}
                      />
                    ) : (
                      <div className="h-24 w-16 rounded-md bg-[#e7dcc9]" />
                    )}
                    <p className="mt-2 line-clamp-2 text-[0.68rem] leading-4 text-[#6f615a]">
                      {name}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          <p className="mt-3 line-clamp-5 text-sm leading-6 text-[#6f615a]">
            {displayedResult}
          </p>
        </div>
      </article>
    );
  }

  const dailyPayload = message.payload;
  if (message.message_type === "practice" && isLabPracticePayload(message.payload)) {
    const practice = message.payload;
    const arrivalLabels = locale === "en"
      ? {
          unclear: "I arrive without a name for it",
          transition: "I am moving through a change",
          overloaded: "I need to lower the noise",
          ready: "I want to move with intention",
        }
      : {
          unclear: "Chego sem conseguir nomear",
          transition: "Estou atravessando uma mudança",
          overloaded: "Preciso diminuir o ruído",
          ready: "Quero me mover com intenção",
        };
    const practiceLabels = locale === "en"
      ? {
          clarity_checkin: "Name the moment",
          decision_pause: "Make room to decide",
          transition_anchor: "Move through a change",
          quiet_the_noise: "Lower the noise",
          self_care_reset: "Return to care",
        }
      : {
          clarity_checkin: "Dar nome ao momento",
          decision_pause: "Abrir espaço para decidir",
          transition_anchor: "Atravessar uma mudança",
          quiet_the_noise: "Diminuir o ruído",
          self_care_reset: "Voltar para o cuidado",
        };

    return (
      <article className="overflow-hidden rounded-lg border border-[#d8cfb9] bg-[#f3f5ec]">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#59705a]">
            <span className="rounded-full bg-[#e0e8dc] px-2 py-1">
              {locale === "en" ? "Lab · clarity practice" : "Lab · prática de clareza"}
            </span>
            <span className="rounded-full bg-[#e0e8dc] px-2 py-1">
              {arrivalLabels[practice.arrivalKey]}
            </span>
            <span className="rounded-full bg-[#e0e8dc] px-2 py-1">
              {practiceLabels[practice.practiceKey]}
            </span>
            {message.local_only ? (
              <span className="rounded-full bg-[#e4eadf] px-2 py-1">
                {locale === "en" ? "On this device" : "Neste dispositivo"}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-[#6d776b]">
            {formatDate(message.created_at, locale)}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {([
              [locale === "en" ? "What was alive" : "O que estava vivo", practice.signal],
              [locale === "en" ? "What asked for care" : "O que pedia cuidado", practice.care],
              [locale === "en" ? "Next gesture" : "Próximo gesto", practice.nextStep],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#59705a]">{label}</p>
                <p className="mt-2 text-sm leading-6 text-[#405344]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }
  if (message.message_type === "daily_card" && isDailyCardPayload(dailyPayload)) {
    const cardName = asString(dailyPayload.card?.name);
    const dailySourceCard = CARDS.find(
      (card) =>
        card.key === asString(dailyPayload.card?.key) || card.name === cardName
    );
    const dailyLocalizedCard = dailySourceCard
      ? localizeTarotCard(dailySourceCard, locale)
      : null;
    const assetPath = normalizeAssetPath(dailyPayload.card?.asset_path);
    const keyword = asString(dailyPayload.reading?.keyword);
    const meaning = asString(dailyPayload.reading?.meaning);
    const coreMeaning =
      dailyLocalizedCard?.guide.core ??
      (asString(dailyPayload.reading?.coreMeaning) ||
        asString(dailyPayload.card?.core_meaning));
    const lifeQuestion =
      dailyLocalizedCard?.guide.question ??
      (asString(dailyPayload.reading?.lifeQuestion) ||
        asString(dailyPayload.card?.life_question));
    const counsel = asString(dailyPayload.reading?.counsel);
    const reversed = Boolean(dailyPayload.card?.reversed);

    return (
      <article className="overflow-hidden rounded-lg border border-[#e4d3ba] bg-[#fbf6ee]">
        <div className="grid grid-cols-[88px_1fr] gap-4 p-4">
          {assetPath ? (
            <Image
              src={assetPath}
              alt={`Carta salva: ${cardName}`}
              width={176}
              height={282}
              className={`h-32 w-20 rounded-md object-cover shadow-[0_18px_32px_rgba(60,42,24,0.2)] ${
                reversed ? "rotate-180" : ""
              }`}
            />
          ) : (
            <div className="h-32 w-20 rounded-md bg-[#e7dcc9]" />
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6f615a]">
              <span className="rounded-full bg-[#e7dcc9] px-2 py-1">
                Carta do Dia
              </span>
              {keyword ? (
                <span className="rounded-full bg-[#e7dcc9] px-2 py-1">
                  {keyword}
                </span>
              ) : null}
              {message.local_only ? (
                <span className="rounded-full bg-[#ead8d3] px-2 py-1">
                  local
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-[#6f615a]">
              {formatDate(message.created_at, locale)}
            </p>
            <h3 className="brand-serif mt-1 text-2xl font-semibold text-[#332720]">
              {dailyLocalizedCard?.name ?? cardName}
              {reversed ? (locale === "en" ? " (reversed)" : " reversa") : ""}
            </h3>
            {coreMeaning ? (
              <p className="mt-2 text-sm leading-6 text-[#6f615a]">
                <span className="font-semibold text-[#8a6b3f]">
                  {locale === "en" ? "Represents: " : "Representa: "}
                </span>
                {coreMeaning}
              </p>
            ) : null}
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6f615a]">
              {meaning}
            </p>
            {lifeQuestion ? (
              <p className="mt-2 text-sm italic leading-6 text-[#8a6b3f]">
                <b className="not-italic">
                  {locale === "en" ? "Question to carry: " : "Pergunta para levar: "}
                </b>
                {lifeQuestion}
              </p>
            ) : null}
          </div>
        </div>

        {counsel ? (
          <div className="border-t border-[#e4d3ba] bg-[#fffaf2] px-4 py-3 text-sm leading-6 text-[#5c4b42]">
            <span className="font-semibold text-[#8a6b3f]">Conselho: </span>
            {counsel}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-[#e4d3ba] bg-[#fbf6ee] p-4">
      <p className="text-xs text-[#6f615a]">{formatDate(message.created_at, locale)}</p>
      <h3 className="mt-2 font-semibold text-[#332720]">
        {getSavedTitle(message)}
      </h3>
      <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#6f615a]">
        {getSavedPreview(message)}
      </p>
    </article>
  );
}
