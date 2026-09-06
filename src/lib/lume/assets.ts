import type { Locale } from "@/lib/i18n/config";
import type { LumeSurface } from "@/lib/lume/persona";
import type { UserContext } from "@/lib/personalization/reading-context";

export type LumeVisualState =
  | "welcome"
  | "guide"
  | "listening"
  | "reflective"
  | "oracle"
  | "care"
  | "invite"
  | "grounding";

export type LumeVisualAsset = {
  state: LumeVisualState;
  src: string;
  alt: Record<Locale, string>;
  objectPosition: string;
};

/**
 * The compact winged oracle remains the Lume mark. These larger portraits are
 * reserved for places where her gesture can carry meaning without becoming a
 * noisy icon inside a small control.
 */
export const LUME_VISUAL_ASSETS: Record<LumeVisualState, LumeVisualAsset> = {
  welcome: {
    state: "welcome",
    src: "/assets/lume-welcome.webp",
    alt: {
      "pt-BR": "Lume acolhe a chegada com as mãos abertas",
      en: "Lume welcomes the arrival with open hands",
    },
    objectPosition: "50% 42%",
  },
  guide: {
    state: "guide",
    src: "/assets/lume-guide.webp",
    alt: {
      "pt-BR": "Lume oferece direção com uma mão aberta",
      en: "Lume offers direction with one open hand",
    },
    objectPosition: "50% 38%",
  },
  listening: {
    state: "listening",
    src: "/assets/lume-listening.webp",
    alt: {
      "pt-BR": "Lume escuta com atenção e presença",
      en: "Lume listens with attention and presence",
    },
    objectPosition: "50% 38%",
  },
  reflective: {
    state: "reflective",
    src: "/assets/lume-reflective.webp",
    alt: {
      "pt-BR": "Lume contempla uma esfera luminosa antes da leitura",
      en: "Lume contemplates a glowing sphere before the reading",
    },
    objectPosition: "58% 42%",
  },
  oracle: {
    state: "oracle",
    src: "/assets/lume-oracle.webp",
    alt: {
      "pt-BR": "Lume segura uma esfera luminosa para acompanhar a leitura",
      en: "Lume holds a glowing sphere to accompany the reading",
    },
    objectPosition: "50% 42%",
  },
  care: {
    state: "care",
    src: "/assets/lume-care.webp",
    alt: {
      "pt-BR": "Lume leva as mãos ao coração em um gesto de cuidado",
      en: "Lume places her hands over her heart in a gesture of care",
    },
    objectPosition: "50% 38%",
  },
  invite: {
    state: "invite",
    src: "/assets/lume-invite.webp",
    alt: {
      "pt-BR": "Lume estende a mão para convidar ao próximo passo",
      en: "Lume reaches out to invite the next step",
    },
    objectPosition: "50% 42%",
  },
  grounding: {
    state: "grounding",
    src: "/assets/lume-grounding.webp",
    alt: {
      "pt-BR": "Lume sinaliza uma pausa cuidadosa com a mão aberta",
      en: "Lume signals a gentle pause with an open hand",
    },
    objectPosition: "52% 40%",
  },
};

export function getLumeVisualState(
  surface: LumeSurface,
  userContext?: UserContext | null
): LumeVisualState {
  const hasActiveReading = Boolean(userContext?.activeReading);
  const hasExplicitContext = Boolean(
    userContext?.personalizationSignals.hasExplicitContext
  );
  const hasPracticeContinuity = Boolean(userContext?.practiceContinuity?.latest);

  if (surface === "professionals") return "invite";
  if (surface === "universe") return userContext?.journey?.hasHistory ? "care" : "welcome";
  if (surface === "lab") return hasPracticeContinuity ? "grounding" : "listening";
  if (surface === "account") return "welcome";
  if (surface === "deck") return "reflective";
  if (surface === "daily") return hasActiveReading ? "oracle" : "reflective";
  if (surface === "spread") return hasActiveReading ? "oracle" : "guide";
  if (surface === "readings") return hasActiveReading ? "oracle" : "guide";
  if (hasActiveReading) return "oracle";
  return hasExplicitContext ? "listening" : "welcome";
}

export function getLumeVisualAsset(
  surface: LumeSurface,
  locale: Locale,
  userContext?: UserContext | null
) {
  const asset = LUME_VISUAL_ASSETS[getLumeVisualState(surface, userContext)];
  return {
    ...asset,
    altText: asset.alt[locale],
  };
}
