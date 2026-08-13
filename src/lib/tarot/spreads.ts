import type { TarotCard } from "./cards";

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
  | "healing_wound_resource_next"
  | "diamond"
  | "flying_bird"
  | "the_key"
  | "mirror"
  | "celtic_cross"
  | "relating"
  | "paradox";

export type SpreadPosition = {
  key: string;
  label: string;
  hint: string;
  cost: number;
};

export type DrawnSpreadCard = {
  position: string;
  card: TarotCard;
  reversed: boolean;
};

export type SpreadExperience = {
  type: SpreadType;
  productKey: string;
  slug: string;
  label: string;
  shortLabel: string;
  promise: string;
  atmosphere: string;
  visualClass: string;
  positions: SpreadPosition[];
  freeAllowed: boolean;
  recommendedFor?: Theme[];
};

const threeCardSituation: SpreadPosition[] = [
  { key: "situation", label: "SITUAÇÃO", hint: "Onde você está de verdade", cost: 2 },
  { key: "obstacle", label: "OBSTÁCULO", hint: "O que trava ou distorce", cost: 2 },
  { key: "direction", label: "DIREÇÃO", hint: "O próximo passo mais sábio", cost: 2 },
];

export const SPREADS: Record<SpreadType, SpreadExperience> = {
  one_card: {
    type: "one_card",
    productKey: "carta_do_dia",
    slug: "carta-do-dia",
    label: "1 Carta — Mensagem",
    shortLabel: "Mensagem",
    promise: "Uma carta para iluminar o agora sem transformar símbolo em sentença.",
    atmosphere: "quiet-orbit",
    visualClass: "pdu-spread-experience--single",
    freeAllowed: true,
    positions: [{ key: "message", label: "MENSAGEM", hint: "O recado central para hoje", cost: 1 }],
  },
  three_card_timeline: {
    type: "three_card_timeline",
    productKey: "caminho_3_cartas",
    slug: "caminho-das-3-cartas",
    label: "3 Cartas — Passado / Presente / Caminho",
    shortLabel: "Caminho das 3 Cartas",
    promise: "Uma sequência para perceber o que trouxe você até aqui e escolher o próximo movimento.",
    atmosphere: "three-beat",
    visualClass: "pdu-spread-experience--three",
    freeAllowed: true,
    positions: [
      { key: "past", label: "RAIZ", hint: "O padrão que trouxe você até aqui", cost: 1 },
      { key: "present", label: "AGORA", hint: "A dinâmica viva do momento", cost: 1 },
      { key: "path", label: "CAMINHO", hint: "A direção se nada forçado mudar", cost: 1 },
    ],
  },
  situation_obstacle_direction: {
    type: "situation_obstacle_direction",
    productKey: "clareza_urgente",
    slug: "clareza-urgente",
    label: "3 Cartas — Situação / Obstáculo / Direção",
    shortLabel: "Caminho das 3 Cartas",
    promise: "Um corte limpo na confusão para devolver eixo, limite e ação possível.",
    atmosphere: "clear-cut",
    visualClass: "pdu-spread-experience--three pdu-spread-experience--sharp",
    freeAllowed: false,
    recommendedFor: ["love", "career", "money", "emotional", "family", "spirituality", "spirit"],
    positions: threeCardSituation,
  },
  relationship_intention_dynamic_boundary: {
    type: "relationship_intention_dynamic_boundary",
    productKey: "sinais_do_amor",
    slug: "sinais-do-amor",
    label: "Relação — Intenção / Dinâmica / Limite",
    shortLabel: "Sinais do Amor",
    promise: "Uma leitura afetiva que devolve clareza para o vínculo sem prometer controle sobre o outro.",
    atmosphere: "warm-tide",
    visualClass: "pdu-spread-experience--three pdu-spread-experience--warm",
    freeAllowed: false,
    recommendedFor: ["love", "family", "emotional"],
    positions: [
      { key: "intention", label: "INTENÇÃO", hint: "O que você busca preservar", cost: 2 },
      { key: "dynamic", label: "DINÂMICA", hint: "O padrão real acontecendo", cost: 2 },
      { key: "boundary", label: "LIMITE", hint: "O que precisa ser protegido", cost: 2 },
    ],
  },
  healing_wound_resource_next: {
    type: "healing_wound_resource_next",
    productKey: "mapa_do_momento",
    slug: "mapa-do-momento",
    label: "Cura — Ferida / Recurso / Próximo Passo",
    shortLabel: "Mapa do Momento",
    promise: "Um retrato de fase para reconhecer o ponto sensível sem esquecer os recursos disponíveis.",
    atmosphere: "deep-water",
    visualClass: "pdu-spread-experience--three pdu-spread-experience--deep",
    freeAllowed: false,
    recommendedFor: ["emotional", "spirituality", "spirit", "family"],
    positions: [
      { key: "wound", label: "FERIDA", hint: "O ponto sensível sem julgamento", cost: 2 },
      { key: "resource", label: "RECURSO", hint: "O que sustenta você agora", cost: 2 },
      { key: "next", label: "PRÓXIMO PASSO", hint: "Uma ação pequena com impacto", cost: 2 },
    ],
  },
  diamond: {
    type: "diamond",
    productKey: "tirada_diamante",
    slug: "diamante",
    label: "O Diamante",
    shortLabel: "O Diamante",
    promise: "Cinco pontos de luz para uma questão que pede clareza, não pressa.",
    atmosphere: "prismatic",
    visualClass: "pdu-spread-experience--diamond",
    freeAllowed: false,
    positions: [
      { key: "issue", label: "A QUESTÃO", hint: "O centro vivo do que você trouxe", cost: 2 },
      { key: "inner_influence", label: "INFLUÊNCIA INTERNA", hint: "O que acontece dentro e você talvez não veja", cost: 2 },
      { key: "outer_influence", label: "INFLUÊNCIA EXTERNA", hint: "O que o ambiente está colocando em movimento", cost: 2 },
      { key: "resolution", label: "O QUE PEDE RESOLUÇÃO", hint: "O ponto que precisa de presença e escolha", cost: 2 },
      { key: "understanding", label: "INTEGRAÇÃO", hint: "A compreensão que organiza o todo", cost: 2 },
    ],
  },
  flying_bird: {
    type: "flying_bird",
    productKey: "passaro_voando",
    slug: "passaro-voando",
    label: "O Pássaro Voando",
    shortLabel: "Pássaro Voando",
    promise: "Sete cartas para sentir onde você recebe, resiste, age e encontra altitude.",
    atmosphere: "open-sky",
    visualClass: "pdu-spread-experience--bird",
    freeAllowed: false,
    positions: [
      { key: "lift_off", label: "DECOLAGEM", hint: "O que já quer ganhar movimento", cost: 2 },
      { key: "fear", label: "MEDO DE VOAR", hint: "A resistência que pede escuta", cost: 2 },
      { key: "response", label: "RESPOSTA", hint: "Como responder ao medo sem obedecê-lo", cost: 2 },
      { key: "receptive_wing", label: "ASA RECEPTIVA", hint: "Sua capacidade de receber e sentir", cost: 2 },
      { key: "active_wing", label: "ASA ATIVA", hint: "Sua capacidade de agir e sustentar", cost: 2 },
      { key: "horizon", label: "HORIZONTE", hint: "O que se torna possível quando há espaço", cost: 2 },
      { key: "flight", label: "VOO", hint: "A qualidade de movimento que integra tudo", cost: 2 },
    ],
  },
  the_key: {
    type: "the_key",
    productKey: "a_chave",
    slug: "a-chave",
    label: "A Chave",
    shortLabel: "A Chave",
    promise: "Oito cartas para abrir uma porta interna e reconhecer o que estava pedindo passagem.",
    atmosphere: "inner-door",
    visualClass: "pdu-spread-experience--key",
    freeAllowed: false,
    positions: [
      { key: "surface", label: "SUPERFÍCIE", hint: "O que você já consegue nomear", cost: 2 },
      { key: "hidden", label: "OCULTO", hint: "O que atua por baixo da pergunta", cost: 2 },
      { key: "repressed", label: "REPRIMIDO", hint: "O que foi afastado para seguir funcionando", cost: 2 },
      { key: "conscious", label: "CONSCIENTE", hint: "O que já está pronto para ser visto", cost: 2 },
      { key: "root", label: "RAIZ", hint: "Onde esse movimento ganhou força", cost: 2 },
      { key: "resource", label: "RECURSO", hint: "O que você pode usar a seu favor", cost: 2 },
      { key: "opening", label: "ABERTURA", hint: "A fresta por onde a mudança entra", cost: 2 },
      { key: "key", label: "A CHAVE", hint: "A compreensão que destranca o próximo gesto", cost: 2 },
    ],
  },
  mirror: {
    type: "mirror",
    productKey: "o_espelho",
    slug: "o-espelho",
    label: "O Espelho",
    shortLabel: "O Espelho",
    promise: "Doze cartas para observar o encontro, as projeções e a parte da história que é sua.",
    atmosphere: "silver-reflection",
    visualClass: "pdu-spread-experience--mirror",
    freeAllowed: false,
    recommendedFor: ["love", "family", "emotional"],
    positions: [
      { key: "self_now", label: "EU AGORA", hint: "Como você chega a este encontro", cost: 2 },
      { key: "other_now", label: "O OUTRO AGORA", hint: "O que o encontro revela sobre a outra presença", cost: 2 },
      { key: "projection", label: "PROJEÇÃO", hint: "O que pode estar sendo colocado no outro", cost: 2 },
      { key: "need", label: "NECESSIDADE", hint: "O que você realmente procura", cost: 2 },
      { key: "pattern", label: "PADRÃO", hint: "O movimento que se repete", cost: 2 },
      { key: "truth", label: "VERDADE", hint: "O que precisa ser reconhecido", cost: 2 },
      { key: "blind_spot", label: "PONTO CEGO", hint: "O que você ainda não consegue ver", cost: 2 },
      { key: "gift", label: "PRESENTE", hint: "O que esse encontro ensina", cost: 2 },
      { key: "boundary", label: "LIMITE", hint: "O que protege a sua dignidade", cost: 2 },
      { key: "conversation", label: "CONVERSA", hint: "O que precisa ser dito com cuidado", cost: 2 },
      { key: "choice", label: "ESCOLHA", hint: "O que está nas suas mãos", cost: 2 },
      { key: "reflection", label: "REFLEXO", hint: "O que fica quando o ruído baixa", cost: 2 },
    ],
  },
  celtic_cross: {
    type: "celtic_cross",
    productKey: "cruz_celta",
    slug: "cruz-celta",
    label: "Cruz Celta",
    shortLabel: "Cruz Celta",
    promise: "Dez cartas para atravessar uma questão inteira: contexto, tensão, raízes, horizonte e síntese.",
    atmosphere: "stone-compass",
    visualClass: "pdu-spread-experience--cross",
    freeAllowed: false,
    positions: [
      { key: "present", label: "AGORA", hint: "O coração da questão", cost: 2 },
      { key: "crossing", label: "CRUZAMENTO", hint: "O que atravessa e desafia o momento", cost: 2 },
      { key: "foundation", label: "BASE", hint: "A raiz sobre a qual tudo se apoia", cost: 2 },
      { key: "past", label: "PASSADO", hint: "O que está se afastando", cost: 2 },
      { key: "possibility", label: "POSSIBILIDADE", hint: "O que pode emergir", cost: 2 },
      { key: "near_future", label: "PRÓXIMO MOVIMENTO", hint: "O que se aproxima", cost: 2 },
      { key: "self", label: "VOCÊ", hint: "Sua postura dentro da questão", cost: 2 },
      { key: "environment", label: "CAMPO", hint: "O que o entorno devolve", cost: 2 },
      { key: "hope_fear", label: "ESPERANÇA / MEDO", hint: "A tensão entre desejo e receio", cost: 2 },
      { key: "outcome", label: "INTEGRAÇÃO", hint: "A direção provável se nada forçado mudar", cost: 2 },
    ],
  },
  relating: {
    type: "relating",
    productKey: "relacionar",
    slug: "relacionar",
    label: "Relacionar",
    shortLabel: "Relacionar",
    promise: "Quatro cartas para enxergar a energia de um vínculo com mais honestidade e menos projeção.",
    atmosphere: "two-pulse",
    visualClass: "pdu-spread-experience--relating",
    freeAllowed: false,
    recommendedFor: ["love", "family", "emotional"],
    positions: [
      { key: "self", label: "MEU CAMPO", hint: "Como você participa do vínculo", cost: 2 },
      { key: "other", label: "OUTRO CAMPO", hint: "O que a outra presença movimenta", cost: 2 },
      { key: "between", label: "ENTRE NÓS", hint: "A energia criada no encontro", cost: 2 },
      { key: "awareness", label: "CONSCIÊNCIA", hint: "O que torna essa relação mais íntegra", cost: 2 },
    ],
  },
  paradox: {
    type: "paradox",
    productKey: "o_paradoxo",
    slug: "o-paradoxo",
    label: "O Paradoxo",
    shortLabel: "O Paradoxo",
    promise: "Uma tirada de cinco cartas para olhar a contradição sem tentar apressá-la até uma resposta simples.",
    atmosphere: "split-light",
    visualClass: "pdu-spread-experience--paradox",
    freeAllowed: false,
    recommendedFor: ["spirit", "emotional", "spirituality"],
    positions: [
      { key: "visible", label: "O VISÍVEL", hint: "O que parece estar acontecendo", cost: 2 },
      { key: "opposite", label: "O OPOSTO", hint: "A força que contradiz a primeira leitura", cost: 2 },
      { key: "tension", label: "A TENSÃO", hint: "Onde as duas verdades se encontram", cost: 2 },
      { key: "still_point", label: "O PONTO DE SILÊNCIO", hint: "O que não precisa ser resolvido agora", cost: 2 },
      { key: "new_view", label: "NOVO OLHAR", hint: "A compreensão que nasce da contradição", cost: 2 },
    ],
  },
};

export const PRODUCT_SPREAD_TYPES: Record<string, SpreadType> = {
  free_daily: "situation_obstacle_direction",
  carta_do_dia: "one_card",
  caminho_3_cartas: "situation_obstacle_direction",
  clareza_urgente: "situation_obstacle_direction",
  sinais_do_amor: "relationship_intention_dynamic_boundary",
  energia_da_semana: "three_card_timeline",
  mapa_do_momento: "healing_wound_resource_next",
  tirada_diamante: "diamond",
  passaro_voando: "flying_bird",
  a_chave: "the_key",
  o_espelho: "mirror",
  cruz_celta: "celtic_cross",
  relacionar: "relating",
  o_paradoxo: "paradox",
  circulo_do_universo: "situation_obstacle_direction",
};

export function getSpreadTypeForProduct(productKey: string): SpreadType {
  return PRODUCT_SPREAD_TYPES[productKey] ?? "situation_obstacle_direction";
}

export function getSpreadForProduct(productKey: string) {
  return SPREADS[getSpreadTypeForProduct(productKey)];
}

function pickIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export function drawSpread(cards: TarotCard[], spreadType: SpreadType): DrawnSpreadCard[] {
  const config = SPREADS[spreadType];
  const pool = [...cards];

  return config.positions.map((position) => {
    const index = pickIndex(pool.length);
    const card = pool.splice(index, 1)[0];
    return {
      position: position.label,
      card,
      reversed: Math.random() < 0.25,
    };
  });
}

export function getSpreadCardCount(spreadType: SpreadType) {
  return SPREADS[spreadType].positions.length;
}

export function getSpreadPosition(spreadType: SpreadType, positionKey: string) {
  return SPREADS[spreadType].positions.find((position) => position.key === positionKey) ?? null;
}
