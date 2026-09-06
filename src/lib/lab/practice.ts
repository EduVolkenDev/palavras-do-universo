export const LAB_PRACTICE_KEY = "clarity_checkin";

export const LAB_PRACTICE_KEYS = [
  "clarity_checkin",
  "decision_pause",
  "transition_anchor",
  "quiet_the_noise",
  "self_care_reset",
] as const;

export type LabPracticeKey = (typeof LAB_PRACTICE_KEYS)[number];

export const LAB_PRACTICE_LABELS: Record<LabPracticeKey, { pt: string; en: string }> = {
  clarity_checkin: { pt: "Dar nome ao momento", en: "Name the moment" },
  decision_pause: { pt: "Abrir espaço para decidir", en: "Make room to decide" },
  transition_anchor: { pt: "Atravessar uma mudança", en: "Move through a change" },
  quiet_the_noise: { pt: "Diminuir o ruído", en: "Lower the noise" },
  self_care_reset: { pt: "Voltar para o cuidado", en: "Return to care" },
};

export const LAB_ARRIVAL_KEYS = [
  "unclear",
  "transition",
  "overloaded",
  "ready",
] as const;

export type LabArrivalKey = (typeof LAB_ARRIVAL_KEYS)[number];

export type LabPracticePayload = {
  savedAt: string;
  locale: string;
  practiceKey: LabPracticeKey;
  arrivalKey: LabArrivalKey;
  signal: string;
  care: string;
  nextStep: string;
};

export type LabPracticeContinuity = {
  latest: LabPracticePayload | null;
  recommendedPracticeKey: LabPracticeKey | null;
  repeatedPracticeKey: LabPracticeKey | null;
  practiceCount: number;
};

const nextPracticeKey: Record<LabPracticeKey, LabPracticeKey> = {
  clarity_checkin: "decision_pause",
  decision_pause: "transition_anchor",
  transition_anchor: "self_care_reset",
  quiet_the_noise: "clarity_checkin",
  self_care_reset: "quiet_the_noise",
};

export function isLabArrivalKey(value: unknown): value is LabArrivalKey {
  return (
    typeof value === "string" &&
    (LAB_ARRIVAL_KEYS as readonly string[]).includes(value)
  );
}

export function isLabPracticeKey(value: unknown): value is LabPracticeKey {
  return (
    typeof value === "string" &&
    (LAB_PRACTICE_KEYS as readonly string[]).includes(value)
  );
}

export function isLabPracticePayload(
  value: unknown
): value is LabPracticePayload {
  if (typeof value !== "object" || value === null) return false;

  const payload = value as Partial<LabPracticePayload>;
  return (
    isLabPracticeKey(payload.practiceKey) &&
    typeof payload.savedAt === "string" &&
    typeof payload.locale === "string" &&
    isLabArrivalKey(payload.arrivalKey) &&
    typeof payload.signal === "string" &&
    typeof payload.care === "string" &&
    typeof payload.nextStep === "string"
  );
}

export function getLabPracticeContinuity(values: unknown[]): LabPracticeContinuity {
  const practices = values
    .filter(isLabPracticePayload)
    .filter((practice, index, all) => {
      const identity = [
        practice.practiceKey,
        practice.arrivalKey,
        practice.signal,
        practice.care,
        practice.nextStep,
      ].join("::");
      return all.findIndex((candidate) => {
        if (!isLabPracticePayload(candidate)) return false;
        return [
          candidate.practiceKey,
          candidate.arrivalKey,
          candidate.signal,
          candidate.care,
          candidate.nextStep,
        ].join("::") === identity;
      }) === index;
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.savedAt);
      const rightTime = Date.parse(right.savedAt);
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
  const counts = new Map<LabPracticeKey, number>();

  practices.forEach((practice) => {
    counts.set(practice.practiceKey, (counts.get(practice.practiceKey) ?? 0) + 1);
  });

  const repeatedPracticeKey = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])[0];

  return {
    latest: practices[0] ?? null,
    recommendedPracticeKey: practices[0] ? nextPracticeKey[practices[0].practiceKey] : null,
    repeatedPracticeKey: repeatedPracticeKey && repeatedPracticeKey[1] > 1 ? repeatedPracticeKey[0] : null,
    practiceCount: practices.length,
  };
}
