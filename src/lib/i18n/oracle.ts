import type { DailyMessage } from "@/lib/daily/message";
import { CARDS, type TarotCard } from "@/lib/tarot/cards";
import { normalizeLocale, type Locale } from "./config";
import {
  CARD_ENGLISH_MEANINGS,
  DAILY_ENERGY_TRANSLATIONS,
  translateDailyOracleText,
} from "./oracle-content";

const majorNames: Record<string, string> = {
  "major-00-the-fool": "The Fool",
  "major-01-the-magician": "The Magician",
  "major-02-the-high-priestess": "The High Priestess",
  "major-03-the-empress": "The Empress",
  "major-04-the-emperor": "The Emperor",
  "major-05-the-hierophant": "The Hierophant",
  "major-06-the-lovers": "The Lovers",
  "major-07-the-chariot": "The Chariot",
  "major-08-strength": "Strength",
  "major-09-the-hermit": "The Hermit",
  "major-10-wheel-of-fortune": "Wheel of Fortune",
  "major-11-justice": "Justice",
  "major-12-the-hanged-man": "The Hanged Man",
  "major-13-death": "Death",
  "major-14-temperance": "Temperance",
  "major-15-the-devil": "The Devil",
  "major-16-the-tower": "The Tower",
  "major-17-the-star": "The Star",
  "major-18-the-moon": "The Moon",
  "major-19-the-sun": "The Sun",
  "major-20-judgement": "Judgement",
  "major-21-the-world": "The World",
};

const majorNamesByPortuguese: Record<string, string> = {
  "O Louco": "The Fool",
  "O Mago": "The Magician",
  "A Sacerdotisa": "The High Priestess",
  "A Imperatriz": "The Empress",
  "O Imperador": "The Emperor",
  "O Hierofante": "The Hierophant",
  "Os Enamorados": "The Lovers",
  "O Carro": "The Chariot",
  "A Força": "Strength",
  "O Eremita": "The Hermit",
  "A Roda da Fortuna": "Wheel of Fortune",
  "A Justiça": "Justice",
  "O Enforcado": "The Hanged Man",
  "A Morte": "Death",
  "A Temperança": "Temperance",
  "O Diabo": "The Devil",
  "A Torre": "The Tower",
  "A Estrela": "The Star",
  "A Lua": "The Moon",
  "O Sol": "The Sun",
  "O Julgamento": "Judgement",
  "O Mundo": "The World",
};

const rankNames: Record<string, string> = {
  ace: "Ace",
  two: "Two",
  three: "Three",
  four: "Four",
  five: "Five",
  six: "Six",
  seven: "Seven",
  eight: "Eight",
  nine: "Nine",
  ten: "Ten",
  page: "Page",
  knight: "Knight",
  queen: "Queen",
  king: "King",
};

const suitNames: Record<string, string> = {
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

const rankNamesByPortuguese: Record<string, string> = {
  Ás: "Ace",
  Dois: "Two",
  Três: "Three",
  Quatro: "Four",
  Cinco: "Five",
  Seis: "Six",
  Sete: "Seven",
  Oito: "Eight",
  Nove: "Nine",
  Dez: "Ten",
  Pajem: "Page",
  Cavaleiro: "Knight",
  Rainha: "Queen",
  Rei: "King",
};

const suitNamesByPortuguese: Record<string, string> = {
  Paus: "Wands",
  Copas: "Cups",
  Espadas: "Swords",
  Ouros: "Pentacles",
};

const keywordTranslations: Record<string, string> = {
  abertura: "openness",
  adaptação: "adaptation",
  ação: "action",
  afeto: "affection",
  ajuste: "adjustment",
  alegria: "joy",
  alinhamento: "alignment",
  alívio: "relief",
  amizade: "friendship",
  aprendizado: "learning",
  apego: "attachment",
  aperfeiçoamento: "improvement",
  apoio: "support",
  atenção: "attention",
  autonomia: "autonomy",
  autoridade: "authority",
  avaliação: "assessment",
  avanço: "progress",
  aventura: "adventure",
  base: "foundation",
  busca: "search",
  calma: "calm",
  celebração: "celebration",
  chamado: "calling",
  ciclo: "cycle",
  clareza: "clarity",
  colaboração: "collaboration",
  colheita: "harvest",
  começo: "beginning",
  compaixão: "compassion",
  conclusão: "completion",
  confiança: "trust",
  conflito: "conflict",
  consciência: "awareness",
  consequência: "consequence",
  construção: "building",
  constância: "consistency",
  continuidade: "continuity",
  controle: "control",
  convite: "invitation",
  coragem: "courage",
  corpo: "body awareness",
  cuidado: "care",
  culpa: "guilt",
  cultivo: "cultivation",
  cura: "healing",
  curiosidade: "curiosity",
  custo: "cost",
  decisão: "decision",
  dedicação: "dedication",
  defesa: "protection",
  desapego: "release",
  descanso: "rest",
  desejo: "desire",
  despertar: "awakening",
  direção: "direction",
  discernimento: "discernment",
  disciplina: "discipline",
  discrição: "discretion",
  domínio: "self-mastery",
  dor: "pain",
  doçura: "gentleness",
  encontro: "connection",
  equilíbrio: "balance",
  escassez: "scarcity",
  escolha: "choice",
  espera: "patience",
  esperança: "hope",
  estabilidade: "stability",
  estratégia: "strategy",
  estrutura: "structure",
  estudo: "study",
  expansão: "expansion",
  experimento: "experimentation",
  expressão: "expression",
  família: "family",
  faísca: "spark",
  fertilidade: "growth",
  fim: "completion",
  foco: "focus",
  generosidade: "generosity",
  harmonia: "harmony",
  horizonte: "horizon",
  imaginação: "imagination",
  impasse: "impasse",
  impulso: "impulse",
  insatisfação: "dissatisfaction",
  insônia: "restlessness",
  integração: "integration",
  intuição: "intuition",
  início: "beginning",
  legado: "legacy",
  liberação: "release",
  liberdade: "freedom",
  libertação: "liberation",
  liderança: "leadership",
  limitação: "limitation",
  limite: "boundaries",
  limpeza: "clearing",
  lucidez: "clear sight",
  luto: "grief",
  magnetismo: "magnetism",
  manifestação: "manifestation",
  maturidade: "maturity",
  medo: "fear",
  memória: "memory",
  mensagem: "message",
  merecimento: "worthiness",
  mistério: "mystery",
  movimento: "movement",
  mudança: "change",
  notícia: "news",
  observação: "observation",
  ofício: "craft",
  oportunidade: "opportunity",
  orgulho: "pride",
  paciência: "patience",
  partida: "departure",
  pausa: "pause",
  perda: "loss",
  perspectiva: "perspective",
  pertencimento: "belonging",
  peso: "burden",
  planejamento: "planning",
  plenitude: "fulfillment",
  posição: "position",
  posse: "possession",
  possibilidades: "possibilities",
  prazer: "pleasure",
  preocupação: "worry",
  presença: "presence",
  pressa: "haste",
  prioridade: "priority",
  profundidade: "depth",
  prosperidade: "prosperity",
  proteção: "protection",
  prática: "practice",
  rapidez: "speed",
  razão: "reason",
  realização: "achievement",
  receber: "receiving",
  reciprocidade: "reciprocity",
  recolhimento: "retreat",
  recomeço: "renewal",
  reconhecimento: "recognition",
  recuperação: "recovery",
  renascimento: "renewal",
  rendição: "surrender",
  reorganização: "reorganization",
  reparo: "repair",
  resiliência: "resilience",
  responsabilidade: "responsibility",
  retorno: "return",
  revisão: "review",
  ritmo: "rhythm",
  romance: "romance",
  ruptura: "breakthrough",
  sabedoria: "wisdom",
  satisfação: "satisfaction",
  segurança: "security",
  semente: "seed",
  sensibilidade: "sensitivity",
  silêncio: "silence",
  tensão: "tension",
  ternura: "tenderness",
  tradição: "tradition",
  travessia: "transition",
  troca: "exchange",
  valor: "value",
  verdade: "truth",
  vigilância: "awareness",
  virada: "turning point",
  visão: "vision",
  vínculo: "connection",
  vitalidade: "vitality",
  vitória: "victory",
  vulnerabilidade: "vulnerability",
  ímpeto: "drive",
};

const positionTranslations: Record<string, string> = {
  SITUAÇÃO: "SITUATION",
  OBSTÁCULO: "OBSTACLE",
  DIREÇÃO: "DIRECTION",
  MENSAGEM: "MESSAGE",
  RAIZ: "ROOT",
  AGORA: "NOW",
  CAMINHO: "PATH",
  INTENÇÃO: "INTENTION",
  DINÂMICA: "DYNAMIC",
  LIMITE: "BOUNDARY",
  FERIDA: "WOUND",
  RECURSO: "RESOURCE",
  "PRÓXIMO PASSO": "NEXT STEP",
  "A QUESTÃO": "THE QUESTION",
  "INFLUÊNCIA INTERNA": "INNER INFLUENCE",
  "INFLUÊNCIA EXTERNA": "OUTER INFLUENCE",
  "O QUE PEDE RESOLUÇÃO": "WHAT ASKS FOR RESOLUTION",
  INTEGRAÇÃO: "INTEGRATION",
  DECOLAGEM: "LIFT-OFF",
  "MEDO DE VOAR": "FEAR OF FLYING",
  RESPOSTA: "RESPONSE",
  "ASA RECEPTIVA": "RECEPTIVE WING",
  "ASA ATIVA": "ACTIVE WING",
  HORIZONTE: "HORIZON",
  VOO: "FLIGHT",
  SUPERFÍCIE: "SURFACE",
  OCULTO: "HIDDEN",
  REPRIMIDO: "REPRESSED",
  CONSCIENTE: "CONSCIOUS",
  ABERTURA: "OPENING",
  "A CHAVE": "THE KEY",
  "EU AGORA": "ME NOW",
  "O OUTRO AGORA": "THE OTHER NOW",
  PROJEÇÃO: "PROJECTION",
  NECESSIDADE: "NEED",
  PADRÃO: "PATTERN",
  VERDADE: "TRUTH",
  "PONTO CEGO": "BLIND SPOT",
  PRESENTE: "GIFT",
  CONVERSA: "CONVERSATION",
  ESCOLHA: "CHOICE",
  REFLEXO: "REFLECTION",
  CRUZAMENTO: "CROSSING",
  BASE: "FOUNDATION",
  PASSADO: "PAST",
  POSSIBILIDADE: "POSSIBILITY",
  "PRÓXIMO MOVIMENTO": "NEXT MOVEMENT",
  VOCÊ: "YOU",
  CAMPO: "FIELD",
  "ESPERANÇA / MEDO": "HOPE / FEAR",
  "MEU CAMPO": "MY FIELD",
  "OUTRO CAMPO": "THE OTHER FIELD",
  "ENTRE NÓS": "BETWEEN US",
  CONSCIÊNCIA: "AWARENESS",
  "O VISÍVEL": "THE VISIBLE",
  "O OPOSTO": "THE OPPOSITE",
  "A TENSÃO": "THE TENSION",
  "O PONTO DE SILÊNCIO": "THE STILL POINT",
  "NOVO OLHAR": "NEW PERSPECTIVE",
};

export function getCardEnglishName(key: string, fallback: string) {
  if (majorNames[key]) return majorNames[key];
  const [suit, rank] = key.split("-");
  if (suitNames[suit] && rankNames[rank]) {
    return `${rankNames[rank]} of ${suitNames[suit]}`;
  }
  return fallback;
}

export function getCardEnglishNameFromPortuguese(name: string) {
  if (majorNamesByPortuguese[name]) return majorNamesByPortuguese[name];
  const [rank, suit] = name.split(" de ");
  if (rankNamesByPortuguese[rank] && suitNamesByPortuguese[suit]) {
    return `${rankNamesByPortuguese[rank]} of ${suitNamesByPortuguese[suit]}`;
  }
  return name;
}

export function translateOracleKeyword(keyword: string) {
  return keywordTranslations[keyword.toLowerCase()] ?? keyword;
}

export function translateOraclePosition(position: string, locale: Locale) {
  return locale === "en" ? positionTranslations[position] ?? position : position;
}

export function localizeTarotCard<T extends TarotCard>(card: T, localeInput: string): T {
  const locale = normalizeLocale(localeInput);
  if (locale !== "en") return card;

  const keywords = card.keywords.map(translateOracleKeyword);
  const meaning = CARD_ENGLISH_MEANINGS[card.key];
  const lead = keywords[0] ?? "clarity";

  return {
    ...card,
    name: getCardEnglishName(card.key, card.name),
    keywords,
    upright:
      meaning?.upright ??
      `This card invites you to bring ${lead} into the situation with honesty and presence. Notice what becomes simpler when you act from your values.`,
    reversed:
      meaning?.reversed ??
      `Reversed, this card asks you to examine where ${lead} may be blocked, rushed, or shaped by fear. Pause before choosing your next move.`,
  };
}

export function localizeDailyMessage(message: DailyMessage, localeInput: string): DailyMessage {
  const locale = normalizeLocale(localeInput);
  if (locale !== "en") return message;

  const spread = message.spread.map((item) => {
    const sourceCard = CARDS.find((card) => card.name === item.name);
    const localizedCard = sourceCard ? localizeTarotCard(sourceCard, locale) : null;
    const keyword = translateOracleKeyword(item.keyword);
    return {
      ...item,
      position: translateOraclePosition(item.position, locale) as DailyMessage["spread"][number]["position"],
      name: localizedCard?.name ?? getCardEnglishNameFromPortuguese(item.name),
      keyword,
      meaning: localizedCard
        ? item.reversed
          ? localizedCard.reversed
          : localizedCard.upright
        : translateDailyOracleText(item.meaning),
    };
  });

  return {
    ...message,
    energy: DAILY_ENERGY_TRANSLATIONS[message.energy] ?? message.energy,
    message: translateDailyOracleText(message.message),
    advice: translateDailyOracleText(message.advice),
    affirmation: translateDailyOracleText(message.affirmation),
    reflection: translateDailyOracleText(message.reflection),
    ritual: translateDailyOracleText(message.ritual),
    spread,
  };
}
