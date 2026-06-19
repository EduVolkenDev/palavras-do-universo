export type Theme =
  | "love"
  | "career"
  | "money"
  | "spirituality"
  | "family"
  | "emotional"
  | "spirit";

export type SpreadType =
  | "one_card"
  | "three_card_timeline"
  | "situation_obstacle_direction"
  | "relationship_intention_dynamic_boundary"
  | "healing_wound_resource_next";

export type SpreadPosition = {
  key: string;
  label: string;
  hint: string;
  cost: number;
};

export type SpreadConfig = {
  type: SpreadType;
  label: string;
  positions: SpreadPosition[];
  freeAllowed: boolean;
  recommendedFor?: Theme[];
};

export const SPREADS: Record<SpreadType, SpreadConfig> = {
  one_card: {
    type: "one_card",
    label: "1 Carta — Mensagem",
    freeAllowed: true,
    positions: [
      {
        key: "message",
        label: "Mensagem",
        hint: "O recado central para hoje",
        cost: 1,
      },
    ],
  },
  three_card_timeline: {
    type: "three_card_timeline",
    label: "3 Cartas — Passado / Presente / Caminho",
    freeAllowed: true,
    positions: [
      { key: "past", label: "Passado", hint: "Raiz ou padrão", cost: 1 },
      {
        key: "present",
        label: "Presente",
        hint: "Dinâmica atual",
        cost: 1,
      },
      {
        key: "path",
        label: "Caminho",
        hint: "Tendência se nada mudar",
        cost: 1,
      },
    ],
  },
  situation_obstacle_direction: {
    type: "situation_obstacle_direction",
    label: "3 Cartas — Situação / Obstáculo / Direção",
    freeAllowed: false,
    recommendedFor: [
      "love",
      "career",
      "money",
      "emotional",
      "family",
      "spirituality",
      "spirit",
    ],
    positions: [
      {
        key: "situation",
        label: "SITUAÇÃO",
        hint: "Onde você está de verdade",
        cost: 2,
      },
      {
        key: "obstacle",
        label: "OBSTÁCULO",
        hint: "O que trava ou distorce",
        cost: 2,
      },
      {
        key: "direction",
        label: "DIREÇÃO",
        hint: "O próximo passo mais sábio",
        cost: 2,
      },
    ],
  },
  relationship_intention_dynamic_boundary: {
    type: "relationship_intention_dynamic_boundary",
    label: "Relação — Intenção / Dinâmica / Limite",
    freeAllowed: false,
    recommendedFor: ["love", "family", "emotional"],
    positions: [
      {
        key: "intention",
        label: "INTENÇÃO",
        hint: "O que a relação busca",
        cost: 2,
      },
      {
        key: "dynamic",
        label: "DINÂMICA",
        hint: "O padrão real acontecendo",
        cost: 2,
      },
      {
        key: "boundary",
        label: "LIMITE",
        hint: "O que precisa ser protegido",
        cost: 2,
      },
    ],
  },
  healing_wound_resource_next: {
    type: "healing_wound_resource_next",
    label: "Cura — Ferida / Recurso / Próximo Passo",
    freeAllowed: false,
    recommendedFor: ["emotional", "spirituality", "spirit", "family"],
    positions: [
      {
        key: "wound",
        label: "FERIDA",
        hint: "O ponto sensível sem julgamento",
        cost: 2,
      },
      {
        key: "resource",
        label: "RECURSO",
        hint: "O que sustenta você agora",
        cost: 2,
      },
      {
        key: "next",
        label: "PRÓXIMO PASSO",
        hint: "Ação pequena com impacto",
        cost: 2,
      },
    ],
  },
};

export function getSpreadTotalCost(spreadType: SpreadType) {
  return SPREADS[spreadType].positions.reduce(
    (total, position) => total + position.cost,
    0
  );
}
