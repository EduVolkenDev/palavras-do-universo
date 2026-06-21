"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
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
  LockKeyhole,
  MoonStar,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  articleIdeas,
  pricingPlans,
  productCards,
} from "@/lib/product/catalog";
import type { DailyMessage } from "@/lib/daily/message";
import {
  PRODUCT_DEFAULT_QUESTIONS,
  PRODUCT_THEMES,
} from "@/lib/product/access";
import {
  getOrCreateLocalUserId,
  removeLocalImpactCommitments,
  removeLocalSavedMessages,
  saveLocalImpactCommitment,
  saveLocalMessage,
  type LocalImpactCommitment,
  updateLocalImpactCommitment,
} from "@/lib/client/localUniverse";
import { usePduAtmosphere } from "@/lib/ui/usePduAtmosphere";
import { useI18n } from "@/components/I18nProvider";
import {
  getImpactAction,
  IMPACT_AREA_LABELS,
  getRecommendedImpactActions,
} from "@/lib/impact/actions";

type ApiOk = {
  ok: true;
  readingId: string | null;
  theme: string;
  question: string;
  mode: string;
  spread: {
    position: string;
    cardKey: string;
    name: string;
    reversed: boolean;
    assetPath: string;
  }[];
  interpretation: string;
};

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

const themeOptions = [
  { value: "love", label: "Amor", icon: Heart },
  { value: "career", label: "Carreira", icon: Compass },
  { value: "money", label: "Dinheiro", icon: CircleDollarSign },
  { value: "family", label: "Família", icon: UserRound },
  { value: "spirit", label: "Espiritual", icon: MoonStar },
];

const ritualSteps = [
  {
    title: "Sentir",
    text: "Uma mensagem diária abre o campo com presença.",
    icon: Sparkles,
  },
  {
    title: "Entender",
    text: "As cartas traduzem o momento em verdade, sombra e direção.",
    icon: Compass,
  },
  {
    title: "Voltar",
    text: "Histórico e mensagens salvas transformam intuição em jornada.",
    icon: History,
  },
];

const portalIntentOptions = [
  {
    id: "atravessar",
    label: "Atravessar",
    theme: "spirit",
    title: "Quando algo em você já sabe que mudou.",
    from: "Ruído: tentar explicar tudo antes de sentir.",
    to: "Clareza: nomear o primeiro passo sem se violentar.",
    question: "O que eu preciso atravessar com mais presença agora?",
    assetPath: "/assets/portal.webp",
  },
  {
    id: "abrir",
    label: "Abrir",
    theme: "love",
    title: "Quando o coração pede uma chave, não uma sentença.",
    from: "Ruído: procurar garantia onde existe vínculo vivo.",
    to: "Clareza: ouvir o que o sentimento está tentando ensinar.",
    question: "Que chave emocional eu ainda não estou querendo enxergar?",
    assetPath: "/assets/key.webp",
  },
  {
    id: "desembaçar",
    label: "Desembaçar",
    theme: "career",
    title: "Quando a mente está cheia, mas a direção ainda respira.",
    from: "Ruído: confundir urgência com chamado.",
    to: "Clareza: separar desejo, medo e movimento possível.",
    question: "Qual direção fica mais honesta quando eu retiro a pressa?",
    assetPath: "/assets/mirror.webp",
  },
  {
    id: "firmar",
    label: "Firmar",
    theme: "money",
    title: "Quando o invisível precisa virar gesto concreto.",
    from: "Ruído: esperar o momento perfeito para agir.",
    to: "Clareza: escolher uma atitude pequena, limpa e possível.",
    question: "Que gesto concreto sustenta melhor a minha energia hoje?",
    assetPath: "/assets/CRYSTAL.webp",
  },
];

const ritualPrompts = [
  "Respire antes de perguntar",
  "Escolha um tema com honestidade",
  "Leia como espelho, não sentença",
];

const experiencePillars = [
  "Clareza emocional",
  "Firmeza nas decisões",
  "Ritual significativo",
  "Histórico que revela padrões",
];

const productActionClass =
  "mt-5 inline-flex items-center gap-2 rounded-full border border-[#bfa783] px-4 py-2 text-sm font-semibold text-[#4d3c31] hover:border-[#967449]";

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
    fallbackIcon: LucideIcon;
    tone: "gold" | "mint" | "blue" | "rose";
  }
> = {
  "Mensagem do Dia": {
    assetPath: "/icons/pdu/mensagem-do-dia.webp",
    fallbackIcon: Sparkles,
    tone: "gold",
  },
  "Carta do Dia": {
    assetPath: "/icons/pdu/carta-do-dia.webp",
    fallbackIcon: MoonStar,
    tone: "blue",
  },
  "Clareza Urgente": {
    assetPath: "/icons/pdu/caminho-3-cartas.webp",
    fallbackIcon: LifeBuoy,
    tone: "rose",
  },
  "Caminho das 3 Cartas": {
    assetPath: "/icons/pdu/caminho-3-cartas.webp",
    fallbackIcon: Compass,
    tone: "mint",
  },
  "Sinais do Amor": {
    assetPath: "/icons/pdu/sinais-do-amor.webp",
    fallbackIcon: Heart,
    tone: "rose",
  },
  "Energia da Semana": {
    assetPath: "/icons/pdu/energia-da-semana.webp",
    fallbackIcon: Sun,
    tone: "gold",
  },
  "Mapa do Momento": {
    assetPath: "/icons/pdu/mapa-do-momento.webp",
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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

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
      /\n(?=(?:\d\)\s|INITIAL LISTENING|THE THREE THREADS|READING BY POSITION|ACTIONS|INTEGRATION|MANTRA|TR[IÍ]ADE|LEITURA|AÇÕES|ACOES|RESUMO|GANCHO))/i
    )
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.length ? blocks : [clean];
}

export default function Home() {
  const { locale } = useI18n();
  const [userId, setUserId] = useState("");
  const [theme, setTheme] = useState("love");
  const [portalIntentId, setPortalIntentId] = useState("atravessar");
  const [readingProductKey, setReadingProductKey] = useState("free_daily");
  const [question, setQuestion] = useState(
    "O que eu preciso enxergar sobre o meu momento?"
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [result, setResult] = useState("");
  const [spreadLine, setSpreadLine] = useState("");
  const [spreadCards, setSpreadCards] = useState<ApiOk["spread"]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
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
  const [dailyOpening, setDailyOpening] =
    useState<DailyMessage>(fallbackDailyMessage);

  usePduAtmosphere();

  useEffect(() => {
    setUserId(getOrCreateLocalUserId());
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
    const invitedActionKey = params.get("acao");
    const chainId = params.get("corrente");

    if (invitedActionKey) {
      const invitedAction = getImpactAction(invitedActionKey);
      if (invitedAction) {
        setImpactActionKey(invitedAction.key);
        setImpactPlan(invitedAction.suggestedPlan);
        setInvitedBy(isUuid(chainId) ? chainId ?? "" : "");
        window.setTimeout(() => scrollToId("acao"), 160);
      }
    }

    if (!product || !PRODUCT_DEFAULT_QUESTIONS[product]) return;

    setReadingProductKey(product);
    setTheme(PRODUCT_THEMES[product] ?? "spirit");
    setQuestion(PRODUCT_DEFAULT_QUESTIONS[product]);
    window.setTimeout(() => scrollToId("leitura"), 120);
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
  const impactActions = useMemo(() => getRecommendedImpactActions(theme), [theme]);

  const canRun = useMemo(
    () => question.trim().length >= 8 && !loading,
    [question, loading]
  );

  async function run(customQuestion?: string) {
    const q = (customQuestion ?? question).trim();
    if (q.length < 8) return;

    const activeUserId = userId || getOrCreateLocalUserId();
    if (!userId) setUserId(activeUserId);

    setLoading(true);
    setStatus(null);
    setResult("");
    setSpreadLine("");
    setSpreadCards([]);
    setReadingId(null);
    setPaywall(null);
    setRepeat(null);
    setError("");
    setSaved(false);
    setSaveNotice("");

    try {
      const res = await fetch("/api/reading/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          theme,
          question: q,
          productKey: readingProductKey,
          locale,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      setStatus(res.status);

      const text = await res.text();
      let data: unknown = null;

      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Resposta inválida do servidor" };
      }

      if (res.status === 402 && isRecord(data)) {
        setPaywall({
          error:
            typeof data.error === "string"
              ? data.error
              : "Free limit reached",
          paywall: true,
        });
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
      setReadingId(ok.readingId);
      if (!invitedBy && !impactCommitment) {
        const recommended = getRecommendedImpactActions(theme)[0];
        setImpactActionKey(recommended.key);
        setImpactPlan(recommended.suggestedPlan);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha de rede");
    } finally {
      setLoading(false);
    }
  }

  function openPortalIntent(intent: (typeof portalIntentOptions)[number]) {
    setPortalIntentId(intent.id);
    setReadingProductKey("free_daily");
    setTheme(intent.theme);
    setQuestion(intent.question);
  }

  async function saveReading() {
    if (!result) return;

    const activeUserId = userId || getOrCreateLocalUserId();
    if (!userId) setUserId(activeUserId);

    const payload = {
      savedAt: new Date().toISOString(),
      theme,
      question,
      spreadLine,
      spreadCards,
      result,
    };

    const localMessage = saveLocalMessage({
      readingId,
      messageType: "reading",
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
        body: JSON.stringify({ productKey }),
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        const next = `/?product=${encodeURIComponent(productKey)}#produtos`;
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

  const shownSpread = spreadCards.length ? spreadCards : dailyOpening.spread;
  const reversedSuffix = locale === "en" ? " (reversed)" : " reversa";
  const readingText =
    result ||
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

  return (
    <main className="pdu-home min-h-screen text-[#f8efe2]">
      <header className="pdu-site-header fixed left-0 right-0 top-0 border-b border-white/10 bg-[#09080d]/62 backdrop-blur-2xl">
        <div className="pdu-site-header__inner mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#topo" className="group flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#d7b66b]/35 bg-[#f4d58d]/10 text-[#f5d896] shadow-[0_0_32px_rgba(215,182,107,0.16)]">
              <Sparkles size={18} strokeWidth={1.7} />
            </span>
            <span className="brand-serif text-lg font-semibold tracking-normal text-[#fff7e8]">
              Palavras do Universo
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-[#cfc4b9] md:flex">
            <a href="#leitura" className="hover:text-white">
              Leitura
            </a>
            <a href="/carta-do-dia" className="hover:text-white">
              Carta do Dia
            </a>
            <a href="#ritual" className="hover:text-white">
              Ritual
            </a>
            <a href="#produtos" className="hover:text-white">
              Leituras
            </a>
            <a href="/baralho" className="hover:text-white">
              Baralho
            </a>
            <a href="/meu-universo" className="hover:text-white">
              Meu Universo
            </a>
          </nav>

          <button
            type="button"
            onClick={() => scrollToId("leitura")}
            className="hidden items-center gap-2 rounded-full bg-[#f4d58d] px-4 py-2 text-sm font-semibold text-[#1c1308] shadow-[0_14px_38px_rgba(244,213,141,0.22)] hover:bg-[#ffe3a3] sm:inline-flex"
          >
            <Sun size={16} />
            Mensagem de hoje
          </button>
        </div>
      </header>

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
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#a7d7c5]" />
                  Sem fatalismo
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck size={16} className="text-[#a7d7c5]" />
                  Clareza prática
                </div>
                <div className="flex items-center gap-2">
                  <LockKeyhole size={16} className="text-[#a7d7c5]" />
                  Jornada privada
                </div>
              </div>
            </div>

            <div className="pdu-reveal pdu-hero-side">
              <div className="pdu-portal-console">
                <div className="pdu-portal-console__visual">
                  <Image
                    src="/assets/palavrasuniverso.webp"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 768px) 92vw, 48vw"
                    className="object-contain"
                  />
                </div>

                <div className="pdu-portal-console__panel">
                  <p className="pdu-portal-console__eyebrow">
                    Escolha uma entrada
                  </p>
                  <h2 className="brand-serif">
                    {selectedPortalIntent.title}
                  </h2>
                  <div className="pdu-portal-transform" aria-live="polite">
                    <div>
                      <span>Antes</span>
                      <p>{selectedPortalIntent.from}</p>
                    </div>
                    <ArrowRight size={18} />
                    <div>
                      <span>Depois</span>
                      <p>{selectedPortalIntent.to}</p>
                    </div>
                  </div>
                  <div className="pdu-portal-intents">
                    {portalIntentOptions.map((intent) => (
                      <button
                        key={intent.id}
                        type="button"
                        onClick={() => openPortalIntent(intent)}
                        data-active={intent.id === selectedPortalIntent.id}
                      >
                        {intent.label}
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
            </div>
          </div>

          <div
            id="leitura"
            className="pdu-reveal pdu-hero-reading relative z-10 mx-auto w-full max-w-6xl scroll-mt-28"
          >
            <div className="pdu-oracle-shell p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d896]">
                      Sua energia de hoje
                    </p>
                    <h2 className="brand-serif mt-1 text-3xl font-semibold text-[#fff7e8]">
                      {dailyOpening.energy}
                    </h2>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#f4d58d]/25 bg-[#f4d58d]/10 text-[#f5d896]">
                    <MoonStar size={21} />
                  </span>
                </div>

                <div className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
                  <div className="space-y-4">
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
                      {dailyOpening.message}
                    </p>
                    <div className="space-y-3 text-sm leading-6 text-[#cfc4b9]">
                      <p>
                        <span className="font-semibold text-[#f5d896]">
                          Conselho:
                        </span>{" "}
                        {dailyOpening.advice}
                      </p>
                      <p>
                        <span className="font-semibold text-[#f5d896]">
                          Afirmação:
                        </span>{" "}
                        {dailyOpening.affirmation}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {shownSpread.map((card) => (
                        <TarotFrame
                          key={card.position}
                          card={card}
                          compact
                          locale={locale}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
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
                          onClick={() => setTheme(option.value)}
                          className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${
                            theme === option.value
                              ? "border-[#f4d58d] bg-[#f4d58d] text-[#1c1308]"
                              : "border-white/12 bg-white/[0.05] text-[#d8ccc0] hover:border-[#f4d58d]/45"
                          }`}
                        >
                          <option.icon size={15} />
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <label
                      htmlFor="question"
                      className="mt-4 block text-sm font-semibold text-[#fff3df]"
                    >
                      Sua pergunta
                    </label>
                    <div className="pdu-ritual-prompts" aria-label="Como abrir a leitura">
                      {ritualPrompts.map((prompt) => (
                        <span key={prompt}>{prompt}</span>
                      ))}
                    </div>
                    <textarea
                      id="question"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      className="mt-2 min-h-28 w-full resize-none rounded-[8px] border border-white/12 bg-black/24 p-3 text-sm leading-6 text-[#fff7e8] outline-none placeholder:text-[#8d837b] focus:border-[#f4d58d]/70 focus:ring-2 focus:ring-[#f4d58d]/10"
                      placeholder="O que eu preciso enxergar sobre este momento?"
                    />

                    <button
                      type="button"
                      onClick={() => run()}
                      disabled={!canRun}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#a7d7c5] px-5 py-3 text-sm font-semibold text-[#07120e] shadow-[0_18px_46px_rgba(167,215,197,0.18)] hover:bg-[#c1ecdc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={18} />
                      {loading ? "Abrindo a leitura..." : "Fazer minha leitura"}
                    </button>

                    {paywall ? (
                      <StatusPanel
                        tone="gold"
                        title="Limite gratuito do dia"
                        message="Você já recebeu a leitura gratuita de hoje. O próximo passo natural é uma leitura mais profunda no Círculo do Universo."
                        status={status}
                        actionLabel="Entrar no Círculo"
                        onAction={() => scrollToId("circulo")}
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
                        message={`${error}${status ? ` (status ${status})` : ""}`}
                      />
                    ) : null}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pdu-depth-section relative overflow-hidden border-y border-white/10 px-4 py-20 text-[#f8efe2] sm:px-6 lg:px-8">
        <div className="pdu-reveal mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.74fr_1.26fr] lg:items-center">
          <div>
            <SectionEyebrow dark>Leitura aberta</SectionEyebrow>
            <h2 className="brand-serif max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Clareza que vira próximo passo.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#d8ccc0]">
              O Palavras do Universo não promete prever sua vida. Ele ajuda a
              escutar melhor o momento que você está vivendo.
            </p>
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
            </div>
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
            <FloatingTarotSpread cards={shownSpread} />
            <div className="pdu-reading-transcript">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896]">
                {spreadLine || "Mensagem do Universo"}
              </div>
              <div
                key={result ? readingId ?? spreadLine : "reading-preview"}
                className="pdu-reading-blocks min-h-72"
              >
                {readingBlocks.map((block, index) => (
                  <p
                    key={`${block.slice(0, 18)}-${index}`}
                    className="pdu-reading-block whitespace-pre-wrap text-sm leading-7 text-[#efe2d2]"
                    style={{ "--pdu-block-index": index } as CSSProperties}
                  >
                    {block}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="acao"
        className="border-b border-white/10 bg-[#101019] px-4 py-20 text-[#f8efe2] sm:px-6 lg:px-8"
      >
        <div className="pdu-reveal mx-auto max-w-7xl">
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
                className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-4 py-3 text-sm leading-6 text-[#fff7e8] outline-none placeholder:text-[#8d837b] focus:border-[#f4d58d]/60"
                placeholder="Quando, onde e como você realizará esta ação?"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8ccc0]">
                  Para quem ou onde?
                  <input
                    value={impactBeneficiary}
                    onChange={(event) => setImpactBeneficiary(event.target.value)}
                    maxLength={240}
                    className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#fff7e8] outline-none focus:border-[#f4d58d]/60"
                    placeholder="Ex.: uma amiga, minha rua, minha casa"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8ccc0]">
                  Quando?
                  <input
                    type="datetime-local"
                    value={impactScheduledFor}
                    onChange={(event) => setImpactScheduledFor(event.target.value)}
                    className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#fff7e8] outline-none focus:border-[#f4d58d]/60"
                  />
                </label>
              </div>
              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[#d8ccc0]">
                Menor primeiro passo
                <input
                  value={impactFirstStep}
                  onChange={(event) => setImpactFirstStep(event.target.value)}
                  maxLength={500}
                  className="mt-2 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#fff7e8] outline-none focus:border-[#f4d58d]/60"
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

      <section
        id="ritual"
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="pdu-reveal mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionEyebrow dark>Como funciona</SectionEyebrow>
            <h2 className="brand-serif text-4xl font-semibold leading-tight text-[#fff7e8] sm:text-5xl">
              Um pequeno portal para voltar a si.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#d8ccc0]">
              A jornada começa com uma pergunta simples, ganha memória no seu
              histórico e se aprofunda quando o ritual começa a fazer parte do
              dia. Primeiro você sente. Depois escolhe o próximo passo.
            </p>
          </div>

          <div className="pdu-ritual-flow mt-12">
            {ritualSteps.map((step, index) => (
              <div
                key={step.title}
                className="pdu-ritual-step"
              >
                <div className="flex items-center justify-between">
                  <step.icon size={22} className="text-[#f5d896]" />
                  <span className="font-mono text-xs text-[#8d837b]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="brand-serif mt-8 text-2xl font-semibold text-[#fff7e8]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#cfc4b9]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="produtos"
        className="border-y border-white/10 bg-[#f6efe6] px-4 py-16 text-[#1f1713] sm:px-6 lg:px-8"
      >
        <div className="pdu-reveal mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#111019] px-5 py-3 text-sm font-semibold text-[#fff7e8] hover:bg-[#242130]"
            >
              <Feather size={17} />
              Experimentar gratuitamente
            </button>
          </div>

          <div className="pdu-pillar-row mt-8">
            {experiencePillars.map((pillar) => (
              <div key={pillar} className="pdu-pillar-chip">
                <Sparkles size={15} />
                {pillar}
              </div>
            ))}
          </div>

          <div className="pdu-product-river mt-10">
            {productCards.map((product) => (
              <article
                key={product.title}
                className="pdu-product-node group"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getProductModeClass(
                      product.mode
                    )}`}
                  >
                    {getProductModeLabel(product.mode)}
                  </span>
                  <BookOpen size={18} className="text-[#8b6f35]" />
                </div>
                <ProductIconVisual title={product.title} />
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#967449]">
                  {product.archetype}
                </p>
                <h3 className="brand-serif text-2xl font-semibold text-[#241b18]">
                  {product.title}
                </h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#6f615a]">
                  {product.promise}
                </p>
                <div className="mt-4 rounded-[18px] border border-[#d7c4a6] bg-white/38 p-3 text-xs leading-5 text-[#5b4d45]">
                  <span className="font-semibold text-[#4d3c31]">
                    Transformação:
                  </span>{" "}
                  {product.transformation}
                </div>
                <div className="mt-4 space-y-2 border-l border-[#bc8f46]/24 pl-3 text-xs leading-5 text-[#6f615a]">
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
                  <p className="mt-4 text-sm font-semibold text-[#241b18]">
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
              </article>
            ))}
          </div>
          {checkoutError ? (
            <p className="mt-6 max-w-2xl text-sm leading-6 text-[#7a2f2a]">
              {checkoutError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="pdu-reveal mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
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
            {[
              "Signo e fase emocional",
              "Temas favoritos",
              "Mensagens salvas",
              "Leituras anteriores",
              "Áreas da vida em foco",
              "Padrões recorrentes",
            ].map((item) => (
              <div
                key={item}
                className="pdu-feature-token"
              >
                <Check size={17} className="text-[#a7d7c5]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="circulo"
        className="border-y border-white/10 bg-[#f6efe6] px-4 py-16 text-[#1f1713] sm:px-6 lg:px-8"
      >
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
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span
                    className={
                      plan.highlighted ? "text-[#d9c49f]" : "text-[#6f615a]"
                    }
                  >
                    {plan.cadence}
                  </span>
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
                      : scrollToId("leitura")
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

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="pdu-reveal mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionEyebrow dark>Conteúdo e confiança</SectionEyebrow>
            <h2 className="brand-serif text-4xl font-semibold leading-tight text-[#fff7e8] sm:text-5xl">
              Autoridade sem perder intimidade.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#d8ccc0]">
              O blog deve nascer enxuto, conectado às leituras e com linguagem
              madura: tarot, energia, amor, ciclos, rituais e autoconhecimento.
            </p>
          </div>

          <div className="pdu-article-stream">
            {articleIdeas.map((title) => (
              <article
                key={title}
                className="pdu-article-line"
              >
                <BookOpen size={18} className="text-[#f5d896]" />
                <h3 className="mt-3 font-semibold text-[#fff7e8]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#cfc4b9]">
                  CTA contextual: tirar uma carta sobre este tema.
                </p>
              </article>
            ))}
          </div>
        </div>

        <footer className="mx-auto mt-20 max-w-4xl border-t border-white/10 pt-8 text-center text-xs leading-6 text-[#cfc4b9]">
          <nav className="mb-5 flex flex-wrap justify-center gap-x-5 gap-y-2 font-semibold text-[#f5d896]">
            <a href="/termos">Termos de uso</a>
            <a href="/privacidade">Privacidade</a>
            <a href="/reembolsos">Cancelamentos e reembolsos</a>
          </nav>
          <p>
            Palavras do Universo oferece orientação simbólica para reflexão e
            entretenimento. Não substitui aconselhamento médico, jurídico,
            financeiro ou psicológico.
          </p>
          <p className="mt-3">
            Se você estiver em sofrimento intenso, em risco imediato ou pensando
            em se machucar, procure um serviço de emergência local ou ligue{" "}
            <a
              href="https://cvv.org.br/ligue-188-3/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#f5d896] underline decoration-[#f5d896]/45 underline-offset-4 hover:text-white"
            >
              188, CVV
              <LifeBuoy size={13} />
            </a>
            . Para acompanhamento profissional, você pode buscar psicólogos e
            profissionais qualificados no{" "}
            <a
              href="https://www.doctoralia.com.br/psicologo/online"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#f5d896] underline decoration-[#f5d896]/45 underline-offset-4 hover:text-white"
            >
              Doctoralia
              <ExternalLink size={13} />
            </a>
            , inclusive procurando opções acessíveis ou perguntando sobre valor
            social quando necessário.
          </p>
        </footer>
      </section>
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
      className={`group overflow-hidden rounded-[8px] border border-[#f4d58d]/20 bg-[#111019] shadow-[0_18px_50px_rgba(0,0,0,0.2)] ${
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

function FloatingTarotSpread(props: {
  cards: {
    position: string;
    name: string;
    reversed: boolean;
    assetPath: string;
  }[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [settlingIndex, setSettlingIndex] = useState<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const lastPointerType = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current);
      }
    };
  }, []);

  function featureCard(index: number) {
    if (settleTimer.current !== null) {
      window.clearTimeout(settleTimer.current);
    }

    setSettlingIndex(null);
    setActiveIndex(index);
  }

  function toggleCard(index: number) {
    if (!window.matchMedia("(hover: none)").matches) {
      return;
    }

    if (activeIndex === index) {
      settleSpread();
      return;
    }

    featureCard(index);
  }

  function settleSpread() {
    if (activeIndex === null) {
      return;
    }

    setSettlingIndex(activeIndex);
    setActiveIndex(null);

    if (settleTimer.current !== null) {
      window.clearTimeout(settleTimer.current);
    }

    settleTimer.current = window.setTimeout(() => {
      setSettlingIndex(null);
      settleTimer.current = null;
    }, 920);
  }

  return (
    <div
      className={`pdu-floating-spread ${
        activeIndex !== null ? "is-active" : ""
      } ${settlingIndex !== null ? "is-settling" : ""}`}
      data-active={activeIndex ?? undefined}
      data-settling={settlingIndex ?? undefined}
      aria-label="Cartas da leitura"
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") {
          settleSpread();
        }
      }}
    >
      <div className="pdu-floating-spread__orbit" />
      {props.cards.map((card, index) => (
        <figure
          key={`floating-${card.position}`}
          className={`pdu-floating-card pdu-floating-card--${index} ${
            activeIndex === index ? "is-featured" : ""
          } ${settlingIndex === index ? "is-settling-card" : ""}`}
          role="button"
          tabIndex={0}
          aria-pressed={activeIndex === index}
          onPointerDown={(event) => {
            lastPointerType.current = event.pointerType;
          }}
          onPointerEnter={(event) => {
            lastPointerType.current = event.pointerType;

            if (event.pointerType !== "touch") {
              featureCard(index);
            }
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch") {
              settleSpread();
            }
          }}
          onClick={() => toggleCard(index)}
          onFocus={() => {
            if (lastPointerType.current !== "touch") {
              featureCard(index);
            }
          }}
          onBlur={settleSpread}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (activeIndex === index) {
                settleSpread();
              } else {
                featureCard(index);
              }
            }
          }}
        >
          <Image
            src={card.assetPath}
            alt={`${card.position}: ${card.name}`}
            width={420}
            height={680}
            className={`h-full w-full object-cover ${
              card.reversed ? "rotate-180" : ""
            }`}
          />
          <figcaption>
            <span>{card.position}</span>
            <strong>{card.name}</strong>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function ProductIconVisual(props: { title: string }) {
  const [failed, setFailed] = useState(false);
  const visual = productIconVisuals[props.title] ?? {
    assetPath: "/icons/pdu/mensagem-do-dia.webp",
    fallbackIcon: Sparkles,
    tone: "gold" as const,
  };
  const FallbackIcon = visual.fallbackIcon;

  return (
    <div
      className={`pdu-product-visual pdu-product-visual--${visual.tone} mb-5`}
    >
      <div className="pdu-product-visual__halo" />
      {!failed ? (
        <Image
          src={visual.assetPath}
          alt=""
          width={380}
          height={300}
          className="relative z-10 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.05]"
          onError={() => setFailed(true)}
        />
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
  status?: number | null;
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
      {props.status ? (
        <p className="mt-3 text-xs opacity-75">Status: {props.status}</p>
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
