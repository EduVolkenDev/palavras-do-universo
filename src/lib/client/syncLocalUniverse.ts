"use client";

import {
  clearLocalActiveReading,
  getLocalActiveReading,
  getLocalImpactCommitments,
  getLocalSavedMessages,
  localActiveReadingAsSavedMessage,
  removeLocalImpactCommitments,
  removeLocalSavedMessages,
  type LocalImpactCommitment,
  type LocalSavedMessage,
} from "@/lib/client/localUniverse";
import {
  EMPTY_READING_PROFILE,
  hasProfileSignal,
  normalizeReadingProfile,
} from "@/lib/personalization/reading-context";

type SyncResult = {
  syncedMessageKeys: string[];
  syncedActionIds: string[];
  syncedProfile: boolean;
};

let syncInFlight: Promise<SyncResult> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function messageIdentity(message: LocalSavedMessage) {
  if (
    message.message_type === "reading" &&
    isRecord(message.payload) &&
    typeof message.payload.result === "string"
  ) {
    const question =
      typeof message.payload.question === "string" ? message.payload.question : "";
    const spreadLine =
      typeof message.payload.spreadLine === "string"
        ? message.payload.spreadLine
        : "";
    return `reading:${message.reading_id ?? ""}:${question}:${spreadLine}`;
  }

  return `message:${message.id}`;
}

function uniqueMessages(messages: LocalSavedMessage[]) {
  const byIdentity = new Map<string, LocalSavedMessage>();
  messages.forEach((message) => {
    const identity = messageIdentity(message);
    if (!byIdentity.has(identity)) byIdentity.set(identity, message);
  });
  return Array.from(byIdentity.values());
}

function getStoredReadingProfile() {
  try {
    const stored = window.localStorage.getItem("pdu_onboarding_profile");
    return stored
      ? normalizeReadingProfile(JSON.parse(stored))
      : { ...EMPTY_READING_PROFILE };
  } catch {
    return { ...EMPTY_READING_PROFILE };
  }
}

async function syncMessages() {
  const activeReadingMessage = localActiveReadingAsSavedMessage(getLocalActiveReading());
  const allLocalMessages = [
    ...(activeReadingMessage ? [activeReadingMessage] : []),
    ...getLocalSavedMessages(),
  ];
  const messages = uniqueMessages(allLocalMessages.slice(0, 50));

  if (!messages.length) return [];

  const response = await fetch("/api/account/sync-local", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (response.status === 401) return [];

  const data = (await response.json()) as unknown;
  if (!response.ok || !isRecord(data) || !Array.isArray(data.syncedKeys)) {
    return [];
  }

  const syncedKeys = data.syncedKeys.filter(
    (key): key is string => typeof key === "string"
  );

  const syncedIdentities = new Set(
    messages
      .filter((message) => syncedKeys.includes(message.id))
      .map(messageIdentity)
  );
  const localIdsToRemove = allLocalMessages
    .filter(
      (message) =>
        syncedKeys.includes(message.id) || syncedIdentities.has(messageIdentity(message))
    )
    .map((message) => message.id);

  removeLocalSavedMessages(localIdsToRemove);
  if (
    activeReadingMessage &&
    (syncedKeys.includes(activeReadingMessage.id) ||
      syncedIdentities.has(messageIdentity(activeReadingMessage)))
  ) {
    clearLocalActiveReading();
  }

  return syncedKeys;
}

function actionPayload(commitment: LocalImpactCommitment) {
  return {
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
  };
}

async function syncActions() {
  const commitments = getLocalImpactCommitments();
  if (!commitments.length) return [];

  const syncedActionIds: string[] = [];

  for (const commitment of commitments) {
    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(actionPayload(commitment)),
    });

    if (response.ok) {
      syncedActionIds.push(commitment.id);
    } else if (response.status === 401) {
      break;
    }
  }

  removeLocalImpactCommitments(syncedActionIds);
  return syncedActionIds;
}

async function syncProfile() {
  const localProfile = getStoredReadingProfile();
  if (!hasProfileSignal(localProfile)) return false;

  const profileResponse = await fetch("/api/profile");
  if (profileResponse.status === 401) return false;
  if (!profileResponse.ok) return false;

  const profileData = (await profileResponse.json()) as unknown;
  const remoteProfile = isRecord(profileData)
    ? normalizeReadingProfile(profileData.profile)
    : { ...EMPTY_READING_PROFILE };

  if (hasProfileSignal(remoteProfile)) return false;

  const updateResponse = await fetch("/api/profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(localProfile),
  });

  return updateResponse.ok;
}

async function runSync() {
  const [syncedMessageKeys, syncedActionIds, syncedProfile] = await Promise.all([
    syncMessages(),
    syncActions(),
    syncProfile(),
  ]);

  return {
    syncedMessageKeys,
    syncedActionIds,
    syncedProfile,
  };
}

export function syncLocalUniverseToAccount() {
  if (syncInFlight) return syncInFlight;

  syncInFlight = runSync().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
