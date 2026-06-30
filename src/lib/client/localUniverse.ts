"use client";

export type LocalSavedMessage = {
  id: string;
  reading_id: string | null;
  message_type: string;
  payload: unknown;
  created_at: string;
  local_only?: boolean;
};

export type LocalImpactCommitment = {
  id: string;
  action_key: string;
  action_title: string;
  area: string;
  plan: string;
  beneficiary: string;
  first_step: string;
  scheduled_for: string | null;
  status: "committed" | "completed" | "deferred" | "cancelled";
  source_reading_id: string | null;
  invited_by: string | null;
  public_token: string | null;
  public_completion_secret: string | null;
  root_chain_token: string | null;
  parent_public_token: string | null;
  reflection: string;
  cancelled_reason: string;
  deferred_until: string | null;
  created_at: string;
  completed_at: string | null;
  local_only?: boolean;
};

export type LocalReadingDraft = {
  theme: string;
  portal_intent_id: string;
  product_key: string;
  question: string;
  suggested_question_source: string;
  updated_at: string;
};

export type LocalActiveReading = {
  locale: string;
  theme: string;
  portal_intent_id: string;
  product_key: string;
  question: string;
  suggested_question_source: string;
  spread_line: string;
  spread_cards: {
    position: string;
    cardKey: string;
    keyword?: string;
    name: string;
    reversed: boolean;
    meaning?: string;
    assetPath: string;
  }[];
  result: string;
  reading_id: string | null;
  updated_at: string;
};

export type LocalReadingMessagePayload = {
  savedAt: string;
  locale: string;
  theme: string;
  productKey: string;
  question: string;
  spreadLine: string;
  spreadCards: LocalActiveReading["spread_cards"];
  result: string;
};

const USER_ID_KEY = "pdu_user_id";
const SAVED_MESSAGES_KEY = "pdu_saved_messages";
const IMPACT_COMMITMENTS_KEY = "pdu_impact_commitments";
const READING_DRAFT_KEY = "pdu_reading_draft";
const ACTIVE_READING_KEY = "pdu_active_reading";

export function getOrCreateLocalUserId() {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const id =
    "pdu_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem(USER_ID_KEY, id);
  return id;
}

export function getLocalSavedMessages() {
  try {
    const raw = localStorage.getItem(SAVED_MESSAGES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalSavedMessage[]) : [];
  } catch {
    return [];
  }
}

export function removeLocalSavedMessages(ids: string[]) {
  if (!ids.length) return;
  const removed = new Set(ids);
  const remaining = getLocalSavedMessages().filter(
    (message) => !removed.has(message.id)
  );
  localStorage.setItem(SAVED_MESSAGES_KEY, JSON.stringify(remaining));
}

export function saveLocalMessage(params: {
  readingId?: string | null;
  messageType: string;
  payload: unknown;
}) {
  const messages = getLocalSavedMessages();
  const next: LocalSavedMessage = {
    id:
      "local_" +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36),
    reading_id: params.readingId ?? null,
    message_type: params.messageType,
    payload: params.payload,
    created_at: new Date().toISOString(),
    local_only: true,
  };

  localStorage.setItem(
    SAVED_MESSAGES_KEY,
    JSON.stringify([next, ...messages].slice(0, 50))
  );

  return next;
}

function hashLocalValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function saveLocalReadingMessage(params: {
  readingId?: string | null;
  payload: LocalReadingMessagePayload;
}) {
  const messages = getLocalSavedMessages();
  const identity = [
    params.readingId ?? "",
    params.payload.productKey,
    params.payload.question,
    params.payload.spreadCards
      .map((card) => `${card.cardKey}:${card.reversed ? "r" : "u"}`)
      .join("|"),
  ].join("::");
  const id = `local_reading${hashLocalValue(identity)}`;
  const existing = messages.find((message) => message.id === id);
  const next: LocalSavedMessage = {
    id,
    reading_id: params.readingId ?? existing?.reading_id ?? null,
    message_type: "reading",
    payload: params.payload,
    created_at: existing?.created_at ?? params.payload.savedAt,
    local_only: true,
  };

  localStorage.setItem(
    SAVED_MESSAGES_KEY,
    JSON.stringify([next, ...messages.filter((message) => message.id !== id)].slice(0, 50))
  );

  return next;
}

export function hasLocalDailyCard(savedKey: string) {
  return getLocalSavedMessages().some((message) => {
    if (message.message_type !== "daily_card") return false;
    if (typeof message.payload !== "object" || message.payload === null) {
      return false;
    }

    const payload = message.payload as {
      date_key?: unknown;
      opening_key?: unknown;
    };

    return (payload.opening_key ?? payload.date_key) === savedKey;
  });
}

export function getLocalImpactCommitments() {
  try {
    const raw = localStorage.getItem(IMPACT_COMMITMENTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalImpactCommitment[]) : [];
  } catch {
    return [];
  }
}

export function getLocalReadingDraft() {
  try {
    const raw = localStorage.getItem(READING_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;

    return parsed as LocalReadingDraft;
  } catch {
    return null;
  }
}

export function saveLocalReadingDraft(params: {
  theme: string;
  portalIntentId: string;
  productKey: string;
  question: string;
  suggestedQuestionSource: string;
}) {
  const draft: LocalReadingDraft = {
    theme: params.theme,
    portal_intent_id: params.portalIntentId,
    product_key: params.productKey,
    question: params.question,
    suggested_question_source: params.suggestedQuestionSource,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(READING_DRAFT_KEY, JSON.stringify(draft));
  return draft;
}

export function clearLocalReadingDraft() {
  localStorage.removeItem(READING_DRAFT_KEY);
}

export function getLocalActiveReading() {
  try {
    const raw = localStorage.getItem(ACTIVE_READING_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;

    return parsed as LocalActiveReading;
  } catch {
    return null;
  }
}

export function saveLocalActiveReading(params: {
  locale: string;
  theme: string;
  portalIntentId: string;
  productKey: string;
  question: string;
  suggestedQuestionSource: string;
  spreadLine: string;
  spreadCards: LocalActiveReading["spread_cards"];
  result: string;
  readingId: string | null;
}) {
  const reading: LocalActiveReading = {
    locale: params.locale,
    theme: params.theme,
    portal_intent_id: params.portalIntentId,
    product_key: params.productKey,
    question: params.question,
    suggested_question_source: params.suggestedQuestionSource,
    spread_line: params.spreadLine,
    spread_cards: params.spreadCards,
    result: params.result,
    reading_id: params.readingId,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(ACTIVE_READING_KEY, JSON.stringify(reading));
  return reading;
}

export function clearLocalActiveReading() {
  localStorage.removeItem(ACTIVE_READING_KEY);
}

export function saveLocalImpactCommitment(params: {
  actionKey: string;
  actionTitle: string;
  area: string;
  plan: string;
  beneficiary?: string;
  firstStep?: string;
  scheduledFor?: string | null;
  sourceReadingId?: string | null;
  invitedBy?: string | null;
  existingId?: string | null;
  publicToken?: string | null;
  publicCompletionSecret?: string | null;
  rootChainToken?: string | null;
  parentPublicToken?: string | null;
}) {
  const commitments = getLocalImpactCommitments();
  const existing = params.existingId
    ? commitments.find((commitment) => commitment.id === params.existingId)
    : null;
  const next: LocalImpactCommitment = {
    id: existing?.id ?? "action_" + crypto.randomUUID().replaceAll("-", ""),
    action_key: params.actionKey,
    action_title: params.actionTitle,
    area: params.area,
    plan: params.plan,
    beneficiary: params.beneficiary ?? existing?.beneficiary ?? "",
    first_step: params.firstStep ?? existing?.first_step ?? "",
    scheduled_for: params.scheduledFor ?? existing?.scheduled_for ?? null,
    status: existing?.status === "completed" ? "completed" : "committed",
    source_reading_id: params.sourceReadingId ?? null,
    invited_by: params.invitedBy ?? null,
    public_token: params.publicToken ?? existing?.public_token ?? null,
    public_completion_secret:
      params.publicCompletionSecret ?? existing?.public_completion_secret ?? null,
    root_chain_token: params.rootChainToken ?? existing?.root_chain_token ?? null,
    parent_public_token:
      params.parentPublicToken ?? existing?.parent_public_token ?? null,
    reflection: "",
    cancelled_reason: "",
    deferred_until: null,
    created_at: existing?.created_at ?? new Date().toISOString(),
    completed_at: existing?.completed_at ?? null,
    local_only: true,
  };
  const remaining = commitments.filter((commitment) => commitment.id !== next.id);

  localStorage.setItem(
    IMPACT_COMMITMENTS_KEY,
    JSON.stringify([next, ...remaining].slice(0, 100))
  );

  return next;
}

export function updateLocalImpactCommitment(
  id: string,
  patch: Partial<LocalImpactCommitment>
) {
  let updated: LocalImpactCommitment | null = null;
  const commitments = getLocalImpactCommitments().map((commitment) => {
    if (commitment.id !== id) return commitment;
    updated = { ...commitment, ...patch };
    return updated;
  });
  localStorage.setItem(IMPACT_COMMITMENTS_KEY, JSON.stringify(commitments));
  return updated;
}

export function completeLocalImpactCommitment(id: string, reflection: string) {
  const completedAt = new Date().toISOString();
  const commitments = getLocalImpactCommitments().map((commitment) =>
    commitment.id === id
      ? {
          ...commitment,
          status: "completed" as const,
          reflection,
          completed_at: completedAt,
        }
      : commitment
  );
  localStorage.setItem(IMPACT_COMMITMENTS_KEY, JSON.stringify(commitments));
  return commitments.find((commitment) => commitment.id === id) ?? null;
}

export function removeLocalImpactCommitments(ids: string[]) {
  if (!ids.length) return;
  const removed = new Set(ids);
  const remaining = getLocalImpactCommitments().filter(
    (commitment) => !removed.has(commitment.id)
  );
  localStorage.setItem(IMPACT_COMMITMENTS_KEY, JSON.stringify(remaining));
}
