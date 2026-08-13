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
import { useEffect, useMemo, useState } from "react";
import {
  completeLocalImpactCommitment,
  getLocalActiveReading,
  getLocalImpactCommitments,
  getLocalSavedMessages,
  getOrCreateLocalUserId,
  removeLocalImpactCommitments,
  removeLocalSavedMessages,
  type LocalImpactCommitment,
  type LocalActiveReading,
  updateLocalImpactCommitment,
} from "@/lib/client/localUniverse";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { IMPACT_AREA_LABELS, type ImpactArea } from "@/lib/impact/actions";
import { productCards } from "@/lib/product/catalog";
import { useI18n } from "@/components/I18nProvider";
import { normalizeLocale, type Locale } from "@/lib/i18n/config";
import { localizeTarotCard, translateOraclePosition } from "@/lib/i18n/oracle";
import { CARDS } from "@/lib/tarot/cards";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PduAssetStory } from "@/components/PduAssetStory";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";

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

type ReadingProfile = {
  displayName: string;
  focusAreas: string[];
  currentPhase: string;
  guidanceTone: string;
  desiredShift: string;
  boundaries: string[];
  contextNote: string;
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
  assetPath: string;
};

type UniverseStat = {
  label: string;
  value: string | number;
  visual: string;
};

const EMPTY_READING_PROFILE: ReadingProfile = {
  displayName: "",
  focusAreas: [],
  currentPhase: "",
  guidanceTone: "",
  desiredShift: "",
  boundaries: [],
  contextNote: "",
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

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function normalizeSpreadCards(value: unknown): ReadingSpreadCard[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
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
        assetPath: asString(item.assetPath || item.asset_path),
      };
    })
    .filter((card): card is ReadingSpreadCard => card !== null);
}

function readingProfileFromRemote(value: unknown): ReadingProfile {
  if (!isRecord(value)) return EMPTY_READING_PROFILE;
  const raw = isRecord(value.reading_profile) ? value.reading_profile : value;
  return {
    displayName: asString(raw.displayName || value.display_name),
    focusAreas: asStringList(raw.focusAreas || value.favorite_themes),
    currentPhase: asString(raw.currentPhase || value.emotional_phase),
    guidanceTone: asString(raw.guidanceTone),
    desiredShift: asString(raw.desiredShift),
    boundaries: asStringList(raw.boundaries),
    contextNote: asString(raw.contextNote),
  };
}

function profileProgress(profile: ReadingProfile) {
  return [
    profile.displayName,
    profile.focusAreas.length ? "focus" : "",
    profile.currentPhase,
    profile.guidanceTone,
    profile.desiredShift,
  ].filter(Boolean).length;
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
    name?: string;
    reversed?: boolean;
    asset_path?: string;
    keywords?: string[];
  };
  reading?: {
    keyword?: string;
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
  if (
    message.message_type === "daily_card" &&
    isDailyCardPayload(message.payload) &&
    (message.payload.opening_key || message.payload.date_key)
  ) {
    return `daily_card:${message.payload.opening_key ?? message.payload.date_key}`;
  }

  return message.id;
}

function getSavedTitle(message: SavedMessage) {
  if (message.message_type === "daily_card" && isDailyCardPayload(message.payload)) {
    const name = asString(message.payload.card?.name);
    return name ? `Carta do Dia: ${name}` : "Carta do Dia";
  }

  if (message.message_type === "reading" && isSavedReadingPayload(message.payload)) {
    const question = asString(message.payload.question);
    return question || "Leitura salva";
  }

  if (!isRecord(message.payload)) return "Mensagem salva";
  const question = message.payload.question;
  return typeof question === "string" && question ? question : "Mensagem salva";
}

function activeReadingAsSavedMessage(reading: LocalActiveReading | null) {
  if (!reading?.result) return null;

  return {
    id: `active-${reading.reading_id ?? reading.updated_at}`,
    reading_id: reading.reading_id,
    message_type: "reading",
    payload: {
      savedAt: reading.updated_at,
      locale: reading.locale,
      theme: reading.theme,
      productKey: reading.product_key,
      spreadType: reading.spread_type,
      spreadLabel: reading.spread_label,
      question: reading.question,
      spreadLine: reading.spread_line,
      spreadCards: reading.spread_cards,
      result: reading.result,
    },
    created_at: reading.updated_at,
    local_only: true,
  } satisfies SavedMessage;
}

function getSavedPreview(message: SavedMessage) {
  if (message.message_type === "daily_card" && isDailyCardPayload(message.payload)) {
    return asString(message.payload.reading?.meaning);
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

function topLabels(values: string[], limit = 3) {
  return [...values.reduce((counts, value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }, new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => (count > 1 ? `${label} (${count}x)` : label));
}

function getSpreadCards(value: unknown) {
  return normalizeSpreadCards(value).map((card) => card.name).filter(Boolean);
}

function getSymbolicPatterns(readings: Reading[], messages: SavedMessage[]) {
  const themes = readings.map((reading) => asString(reading.theme)).filter(Boolean);
  const readingCards = readings.flatMap((reading) => getSpreadCards(reading.spread));
  const savedCards = messages.flatMap((message) => {
    if (message.message_type === "daily_card" && isDailyCardPayload(message.payload)) {
      return [asString(message.payload.card?.name)].filter(Boolean);
    }
    if (message.message_type === "reading" && isSavedReadingPayload(message.payload)) {
      return (message.payload.spreadCards ?? [])
        .map((card) => asString(card.name))
        .filter(Boolean);
    }
    return [];
  });

  return {
    themes: topLabels(themes),
    cards: topLabels([...readingCards, ...savedCards]),
    totalSignals: readings.length + messages.length,
  };
}

function getInitialMapNextSteps(profile: ReadingProfile, hasHistory: boolean) {
  const focus = profile.focusAreas[0] ?? "sua energia principal";
  const phase = profile.currentPhase || "a fase que você está atravessando";
  return [
    {
      title: "Ritual de 2 minutos",
      text: `Respire, nomeie ${phase.toLowerCase()} e escreva uma frase sobre o que pede cuidado hoje.`,
    },
    {
      title: hasHistory ? "Revisar padrão" : "Primeiro sinal",
      text: hasHistory
        ? "Observe a carta ou tema que voltou mais de uma vez antes de abrir outra pergunta."
        : `Abra uma leitura sobre ${focus.toLowerCase()} para o mapa começar a reconhecer recorrências.`,
    },
    {
      title: "Ação concreta",
      text: profile.desiredShift
        ? `Escolha um gesto pequeno ligado a ${profile.desiredShift.toLowerCase()}.`
        : "Escolha um gesto pequeno que deixe o dia mais claro, mesmo sem resolver tudo.",
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
    const sourceCard = CARDS.find((item) => item.key === card.cardKey);
    const localizedCard = sourceCard ? localizeTarotCard(sourceCard, locale) : null;

    return {
      ...card,
      position: localizePosition(card.position, locale),
      name: localizedCard?.name ?? card.name,
      keyword: localizedCard?.keywords[0] ?? card.keyword,
      meaning: localizedCard
        ? card.reversed
          ? localizedCard.reversed
          : localizedCard.upright
        : card.meaning,
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
        `${card.position}: ${card.name}${card.reversed ? reversedSuffix : ""}. ${card.meaning}`
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
      const activeReadingMessage = activeReadingAsSavedMessage(getLocalActiveReading());
      const initialLocalMessages = [
        ...(activeReadingMessage ? [activeReadingMessage] : []),
        ...getLocalSavedMessages(),
      ];
      const initialLocalCommitments = getLocalImpactCommitments();
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
          setReadingProfile(EMPTY_READING_PROFILE);
          setProfileDraft(EMPTY_READING_PROFILE);
          return;
        }

        if (initialLocalMessages.length) {
          const syncRes = await fetch("/api/account/sync-local", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ messages: initialLocalMessages }),
          });
          const syncData = (await syncRes.json()) as unknown;

          if (
            syncRes.ok &&
            isRecord(syncData) &&
            Array.isArray(syncData.syncedKeys)
          ) {
            const syncedKeys = syncData.syncedKeys.filter(
              (key): key is string => typeof key === "string"
            );
            removeLocalSavedMessages(syncedKeys);
            if (syncedKeys.length) {
              setSyncNotice(
                `${syncedKeys.length} ${
                  syncedKeys.length === 1 ? "mensagem foi protegida" : "mensagens foram protegidas"
                } na sua conta.`
              );
            }
          }
        }

        if (initialLocalCommitments.length) {
          const syncedActionIds: string[] = [];
          for (const commitment of initialLocalCommitments) {
            const syncRes = await fetch("/api/actions", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                clientKey: commitment.id,
                actionKey: commitment.action_key,
                plan: commitment.plan,
                sourceReadingId: commitment.source_reading_id,
                invitedBy: commitment.invited_by,
                status: commitment.status,
                reflection: commitment.reflection,
                completedAt: commitment.completed_at,
                beneficiary: commitment.beneficiary,
                firstStep: commitment.first_step,
                scheduledFor: commitment.scheduled_for,
                publicToken: commitment.public_token,
                publicCompletionSecret: commitment.public_completion_secret,
                rootChainToken: commitment.root_chain_token,
                parentPublicToken: commitment.parent_public_token,
                deferredUntil: commitment.deferred_until,
                cancelledReason: commitment.cancelled_reason,
              }),
            });
            if (syncRes.ok) syncedActionIds.push(commitment.id);
          }
          removeLocalImpactCommitments(syncedActionIds);
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
        const currentActiveReadingMessage = activeReadingAsSavedMessage(getLocalActiveReading());
        const localMessages = [
          ...(currentActiveReadingMessage ? [currentActiveReadingMessage] : []),
          ...getLocalSavedMessages(),
        ];
        const seen = new Set<string>();
        const mergedMessages = [...remoteMessages, ...localMessages].filter(
          (message) => {
            const dedupeKey = getMessageDedupeKey(message);
            if (seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
          }
        );

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
        const nextProfile = isRecord(profileData)
          ? readingProfileFromRemote(profileData.profile)
          : EMPTY_READING_PROFILE;
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
  const readingHistoryCount = readings.length + savedReadingMessages.length;
  const profileCompletion = profileProgress(profileDraft);
  const profileComplete = profileProgress(readingProfile) >= 4;
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

  const symbolicPatterns = useMemo(
    () => getSymbolicPatterns(readings, messages),
    [messages, readings]
  );
  const nextMapSteps = useMemo(
    () => getInitialMapNextSteps(readingProfile, symbolicPatterns.totalSignals > 0),
    [readingProfile, symbolicPatterns.totalSignals]
  );
  const activeSubscription = entitlements.some(
    (item) =>
      item.source === "subscription" ||
      item.product_key === "circulo_do_universo"
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
  const recommendedPrice = recommendedProduct?.price ?? "R$9,90";

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
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok || !isRecord(data)) {
        throw new Error(
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Não foi possível salvar seu Mapa Inicial."
        );
      }
      const nextProfile = readingProfileFromRemote(data.profile);
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
        body: JSON.stringify({ productKey, locale }),
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        window.location.href = `/entrar?next=${encodeURIComponent(
          `/meu-universo?comprar=${productKey}`
        )}`;
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
      <header className="border-b border-[#e2d3c0] bg-[#fbf6ee]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4d3c31]"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#6f615a]">
            <Sparkles size={16} />
            Meu Universo
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
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="ml-2 rounded-lg border border-[#d8c3a6] px-3 py-1.5 font-semibold text-[#4d3c31]"
                >
                  Sair
                </button>
              </form>
            ) : (
              <Link
                href="/entrar"
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
                  href="/entrar"
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

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Fase", accountEmail ? readingProfile.currentPhase || "A calibrar" : "Transição"],
                  ["Tom", accountEmail ? readingProfile.guidanceTone || "A escolher" : "Prático"],
                  ["Limites", accountEmail ? `${readingProfile.boundaries.length}` : "Sem fatalismo"],
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
                  href="/entrar"
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

        {authChecked && accountEmail ? (
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
                    Depois de criar conta, esse mapa vira contexto real para as
                    leituras. Lume entende fase, tom, limites e foco sem você
                    repetir tudo a cada pergunta.
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
                      "Complete pelo menos 4 sinais para calibrar suas leituras."}
                  </p>
                  <button
                    type="button"
                    onClick={saveReadingProfile}
                    disabled={profileSaving || profileCompletion < 4}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserRound size={16} />
                    {profileSaving ? "Calibrando..." : "Salvar Mapa Inicial"}
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
                  Próximo desbloqueio
                </p>
                <h2 className="brand-serif mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[#241b18]">
                  {profileComplete ? (
                    <>
                      {t("Seu mapa pede")} {recommendedTitle}.
                    </>
                  ) : (
                    t("Calibre o mapa e transforme contexto em leitura paga.")
                  )}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f615a]">
                  {profileComplete
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
                    [t("Preço"), recommendedPrice],
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
                  Oferta natural
                </p>
                <h3 className="brand-serif mt-3 text-3xl font-semibold">
                  Uma pergunta real. Três cartas. Resposta contextual.
                </h3>
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#d8ccc0]">
                  <li className="border-t border-white/10 pt-3">
                    Compra avulsa para uma decisão específica, sem assinatura.
                  </li>
                  <li className="border-t border-white/10 pt-3">
                    Resultado salvo no Meu Universo para acompanhar padrões.
                  </li>
                  <li className="border-t border-white/10 pt-3">
                    Caminho claro para entrar no Círculo quando quiser continuidade.
                  </li>
                </ul>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => startUniverseCheckout(recommendedProduct.productKey)}
                    disabled={!profileComplete || !!purchaseLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <CreditCard size={16} />
                    {purchaseLoading === recommendedProduct.productKey
                      ? t("Abrindo checkout...")
                      : profileComplete
                        ? `${t("Desbloquear por")} ${recommendedPrice}`
                        : t("Complete o mapa primeiro")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startUniverseCheckout("circulo_do_universo")}
                    disabled={activeSubscription || !!purchaseLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#fff7e8] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <Sparkles size={16} />
                    {purchaseLoading === "circulo_do_universo"
                      ? t("Abrindo assinatura...")
                      : activeSubscription
                        ? t("Círculo ativo")
                        : t("Entrar no Círculo mensal")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {authChecked && accountEmail ? (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#d8c3a6] bg-[#fffaf2] shadow-[0_28px_90px_rgba(80,57,34,0.09)]">
            <div className="grid gap-0 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="bg-[#241b18] p-6 text-[#fff7e8] sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                  Progressão simbólica
                </p>
                <h2 className="brand-serif mt-3 text-4xl font-semibold leading-tight">
                  {symbolicPatterns.totalSignals
                    ? "Seu mapa já começou a reconhecer padrões."
                    : "Seu mapa não começa vazio."}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#d8ccc0]">
                  {symbolicPatterns.totalSignals
                    ? "Cada leitura salva, carta do dia e ação registrada aumenta o contexto das próximas respostas."
                    : "Mesmo antes do histórico, o Mapa Inicial transforma fase, foco e intenção em um ponto de partida pessoal."}
                </p>

                <div className="mt-6 grid gap-3">
                  {[
                    ["Sinais registrados", String(symbolicPatterns.totalSignals)],
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
                      {(symbolicPatterns.themes.length
                        ? symbolicPatterns.themes
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
                      {(symbolicPatterns.cards.length
                        ? symbolicPatterns.cards
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
                    <div
                      key={step.title}
                      className="rounded-2xl border border-[#e4d3ba] bg-[#fbf6ee] p-4"
                    >
                      <p className="text-sm font-semibold text-[#332720]">
                        {step.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6f615a]">
                        {step.text}
                      </p>
                    </div>
                  ))}
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
          {entitlements.some((item) => item.source === "subscription") ? (
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
                    {entitlement.source === "admin"
                      ? "Dono"
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
                      : "Acesso ativo enquanto a assinatura estiver válida."}
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

        <section className="mt-8 rounded-lg border border-[#a9cdbf] bg-[#f3f8f3] p-5">
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
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
                    {card.meaning ? (
                      <p className="mt-1 line-clamp-3 text-[0.72rem] leading-4 text-[#6f615a]">
                        {card.meaning}
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
                const assetPath = asString(card.assetPath);

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

  if (
    message.message_type === "daily_card" &&
    isDailyCardPayload(message.payload)
  ) {
    const cardName = asString(message.payload.card?.name);
    const assetPath = asString(message.payload.card?.asset_path);
    const keyword = asString(message.payload.reading?.keyword);
    const meaning = asString(message.payload.reading?.meaning);
    const counsel = asString(message.payload.reading?.counsel);
    const reversed = Boolean(message.payload.card?.reversed);

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
              {cardName}
              {reversed ? " reversa" : ""}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6f615a]">
              {meaning}
            </p>
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
