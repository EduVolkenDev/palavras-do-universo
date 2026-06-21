import type { DailyMessage } from "../daily/message";
import { hashSeed } from "../daily/seed";
import type { Locale } from "../i18n/config";
import type { TarotCard } from "./cards";

type FallbackDraw = {
  card: TarotCard;
  position: string;
  reversed: boolean;
};

type FallbackReadingParams = {
  daily: DailyMessage;
  hasPortalMemory: boolean;
  locale: Locale;
  mode: string;
  productKey: string;
  question: string;
  spread: FallbackDraw[];
  theme: string;
  userId: string;
};

type ThemeCopy = {
  label: string;
  mantras: readonly string[];
  actions: readonly string[];
  questions: readonly string[];
};

const PT_THEMES: Record<string, ThemeCopy> = {
  love: {
    label: "afetos e vínculos",
    mantras: [
      "Eu escolho vínculo sem abandonar meu centro.",
      "Reciprocidade também é uma forma de clareza.",
      "Meu afeto não precisa negociar minha dignidade.",
      "Eu posso sentir profundamente e ainda escolher com calma.",
    ],
    actions: [
      "Escreva o que você precisa sentir em um vínculo saudável.",
      "Troque uma suposição por uma pergunta clara e respeitosa.",
      "Observe onde existe reciprocidade antes de investir mais energia.",
      "Defina um limite afetivo que proteja sua paz hoje.",
    ],
    questions: [
      "Que vínculo consigo construir sem me abandonar?",
      "O que é reciprocidade concreta nesta situação?",
      "Qual limite torna este afeto mais saudável?",
      "O que preciso comunicar sem tentar controlar a resposta?",
    ],
  },
  career: {
    label: "trabalho e direção material",
    mantras: [
      "Prioridade é escolher o que realmente move o caminho.",
      "Constância vale mais do que urgência sem direção.",
      "Meu trabalho cresce quando minha energia encontra foco.",
      "Eu posso avançar sem carregar tudo ao mesmo tempo.",
    ],
    actions: [
      "Escolha uma entrega importante e reserve vinte minutos sem interrupção.",
      "Separe o que gera resultado do que apenas ocupa sua atenção.",
      "Faça uma conversa objetiva sobre prazo, escopo ou expectativa.",
      "Defina a próxima ação visível antes de abrir uma nova frente.",
    ],
    questions: [
      "Qual ação produz avanço real nesta semana?",
      "O que posso simplificar sem perder qualidade?",
      "Onde preciso trocar esforço disperso por prioridade?",
      "Que decisão material depende apenas de mim agora?",
    ],
  },
  self: {
    label: "identidade e mundo interior",
    mantras: [
      "Eu posso me escutar sem transformar tudo em dúvida.",
      "Meu centro merece participar das minhas escolhas.",
      "Mudar de ideia também pode ser sinal de maturidade.",
      "Eu não preciso me diminuir para encontrar paz.",
    ],
    actions: [
      "Escreva três fatos sobre o que sente, sem interpretar nenhum deles.",
      "Proteja quinze minutos do dia para silêncio e presença.",
      "Nomeie uma necessidade que você vem adiando.",
      "Escolha um gesto que aproxime sua rotina da pessoa que deseja ser.",
    ],
    questions: [
      "O que minha verdade pede quando o ruído diminui?",
      "Que necessidade merece ser reconhecida hoje?",
      "Onde estou pedindo permissão para ser quem já sou?",
      "Que escolha me devolve ao meu próprio centro?",
    ],
  },
  general: {
    label: "momento atual",
    mantras: [
      "Clareza suficiente é melhor do que certeza impossível.",
      "Um passo honesto reorganiza mais do que dez promessas.",
      "Eu escolho presença antes de pressa.",
      "O caminho aparece quando a escolha encontra ação.",
    ],
    actions: [
      "Escreva o que é fato, o que é medo e o que é desejo.",
      "Retire uma fonte de ruído por vinte minutos.",
      "Conclua uma ação pequena antes de buscar outra resposta.",
      "Diga em uma frase qual resultado você realmente procura.",
    ],
    questions: [
      "O que fica simples quando separo medo de realidade?",
      "Qual é o próximo passo honesto e possível?",
      "O que precisa de decisão, e não de mais interpretação?",
      "Onde minha energia terá mais efeito agora?",
    ],
  },
};

const EN_THEMES: Record<string, ThemeCopy> = {
  love: {
    label: "love and relationships",
    mantras: [
      "I choose connection without abandoning my center.",
      "Reciprocity is also a form of clarity.",
      "My care does not need to bargain with my dignity.",
      "I can feel deeply and still choose calmly.",
    ],
    actions: [
      "Write what you need to feel in a healthy relationship.",
      "Replace one assumption with a clear, respectful question.",
      "Notice where reciprocity exists before investing more energy.",
      "Set one emotional boundary that protects your peace today.",
    ],
    questions: [
      "What connection can I build without abandoning myself?",
      "What does concrete reciprocity look like here?",
      "Which boundary would make this bond healthier?",
      "What do I need to communicate without controlling the answer?",
    ],
  },
  career: {
    label: "work and material direction",
    mantras: [
      "Priority means choosing what truly moves the path.",
      "Consistency matters more than urgency without direction.",
      "My work grows when my energy finds focus.",
      "I can move forward without carrying everything at once.",
    ],
    actions: [
      "Choose one meaningful deliverable and give it twenty uninterrupted minutes.",
      "Separate what creates results from what only consumes attention.",
      "Have one direct conversation about scope, timing, or expectations.",
      "Define the next visible action before opening another front.",
    ],
    questions: [
      "Which action creates real progress this week?",
      "What can I simplify without losing quality?",
      "Where should scattered effort become priority?",
      "Which material decision depends only on me now?",
    ],
  },
  self: {
    label: "identity and inner life",
    mantras: [
      "I can listen to myself without turning everything into doubt.",
      "My center deserves a place in my choices.",
      "Changing my mind can also be a sign of maturity.",
      "I do not need to become smaller to find peace.",
    ],
    actions: [
      "Write three facts about what you feel without interpreting them.",
      "Protect fifteen minutes for silence and presence.",
      "Name one need you have been postponing.",
      "Choose one gesture that brings your routine closer to who you want to be.",
    ],
    questions: [
      "What does my truth ask for when the noise settles?",
      "Which need deserves recognition today?",
      "Where am I asking permission to be who I already am?",
      "Which choice returns me to my own center?",
    ],
  },
  general: {
    label: "your present moment",
    mantras: [
      "Enough clarity is better than impossible certainty.",
      "One honest step reorganizes more than ten promises.",
      "I choose presence before pressure.",
      "The path appears when choice meets action.",
    ],
    actions: [
      "Write what is fact, what is fear, and what is desire.",
      "Remove one source of noise for twenty minutes.",
      "Complete one small action before seeking another answer.",
      "State the result you truly want in one sentence.",
    ],
    questions: [
      "What becomes simple when I separate fear from reality?",
      "What is the next honest and possible step?",
      "What needs a decision rather than more interpretation?",
      "Where will my energy have the greatest effect now?",
    ],
  },
};

const PT_OPENINGS: Record<string, readonly string[]> = {
  CURA: [
    "Sua pergunta pede cuidado antes de velocidade.",
    "Há uma tensão real aqui, e ela merece ser escutada sem dramatização.",
    "O primeiro movimento não é resolver tudo, mas devolver espaço ao seu centro.",
  ],
  ANCORA: [
    "Sua pergunta pede chão, critério e uma prioridade visível.",
    "O excesso de possibilidades parece pesar mais do que a falta de capacidade.",
    "A clareza material começa quando esforço e resultado deixam de ser confundidos.",
  ],
  LAMINA: [
    "Esta pergunta pede verdade com limite, não uma conclusão apressada.",
    "Existe algo que precisa ser visto sem alimentar vigilância ou ansiedade.",
    "A firmeza mais útil agora separa fato, medo e interpretação.",
  ],
  NEVOA: [
    "Nem tudo está nítido, mas já existe informação suficiente para um próximo passo.",
    "Sua pergunta parece carregar mais de uma necessidade ao mesmo tempo.",
    "A névoa diminui quando você troca a resposta perfeita por uma escolha possível.",
  ],
};

const EN_OPENINGS: Record<string, readonly string[]> = {
  CURA: [
    "Your question needs care before speed.",
    "There is real tension here, and it deserves attention without drama.",
    "The first move is not to solve everything, but to give your center more room.",
  ],
  ANCORA: [
    "Your question needs grounding, criteria, and one visible priority.",
    "Too many possibilities seem heavier than any lack of ability.",
    "Material clarity begins when effort and outcome are no longer confused.",
  ],
  LAMINA: [
    "This question needs truth with boundaries, not a rushed conclusion.",
    "Something needs to be seen without feeding vigilance or anxiety.",
    "The most useful firmness now separates fact, fear, and interpretation.",
  ],
  NEVOA: [
    "Not everything is clear, but there is already enough information for one next step.",
    "Your question seems to carry more than one need at the same time.",
    "The fog thins when you replace the perfect answer with a possible choice.",
  ],
};

const PRODUCT_CONTEXT: Record<string, { en: string; pt: string }> = {
  free_daily: {
    en: "This free reading offers one useful direction without trying to resolve the whole journey.",
    pt: "Esta leitura gratuita oferece uma direção útil sem tentar resolver toda a jornada.",
  },
  clareza_urgente: {
    en: "Clareza Urgente separates pressure, boundaries, and the safest action for the next 24 hours.",
    pt: "Clareza Urgente separa pressão, limite e a ação mais segura para as próximas 24 horas.",
  },
  caminho_3_cartas: {
    en: "The Three-Card Path turns the question into situation, shadow, and practical direction.",
    pt: "O Caminho das 3 Cartas transforma a pergunta em situação, sombra e direção prática.",
  },
  sinais_do_amor: {
    en: "Sinais do Amor centers reciprocity, emotional boundaries, and responsible communication.",
    pt: "Sinais do Amor prioriza reciprocidade, limite afetivo e comunicação responsável.",
  },
  energia_da_semana: {
    en: "Weekly Energy organizes where to invest attention and where to preserve strength.",
    pt: "Energia da Semana organiza onde investir atenção e onde preservar força.",
  },
  mapa_do_momento: {
    en: "The Present Map highlights the current phase, its repeating pattern, and its main priority.",
    pt: "O Mapa do Momento destaca a fase atual, o padrão recorrente e a prioridade principal.",
  },
  circulo_do_universo: {
    en: "Círculo do Universo connects this answer with continuity, memory, and personal ritual.",
    pt: "O Círculo do Universo conecta esta resposta com continuidade, memória e ritual pessoal.",
  },
};

const PT_POSITION_GUIDANCE: readonly (readonly string[])[] = [
  [
    "Observe o que já é verdadeiro antes de reagir.",
    "Nomeie o fato central sem acrescentar medo à leitura.",
    "Reconheça o ponto de partida antes de tentar mudá-lo.",
    "Separe o que está acontecendo do que você teme que aconteça.",
  ],
  [
    "Não deixe este padrão escolher por você.",
    "Trate o obstáculo como informação, não como sentença.",
    "Perceba onde a reação automática está consumindo escolha.",
    "Diminua a velocidade exatamente onde a tensão aumenta.",
  ],
  [
    "Transforme este símbolo em uma escolha visível hoje.",
    "Leve a direção para uma ação que possa ser concluída.",
    "Escolha o menor gesto capaz de confirmar esta direção.",
    "Use esta energia como critério para dizer um sim ou um não.",
  ],
];

const EN_POSITION_GUIDANCE: readonly (readonly string[])[] = [
  [
    "Observe what is already true before reacting.",
    "Name the central fact without adding fear to it.",
    "Recognize the starting point before trying to change it.",
    "Separate what is happening from what you fear may happen.",
  ],
  [
    "Do not let this pattern make the decision for you.",
    "Treat the obstacle as information, not a verdict.",
    "Notice where an automatic reaction is consuming choice.",
    "Slow down precisely where tension starts to rise.",
  ],
  [
    "Turn this symbol into one visible choice today.",
    "Bring this direction into an action you can complete.",
    "Choose the smallest gesture that confirms this direction.",
    "Use this energy as a criterion for one clear yes or no.",
  ],
];

function normalizeTheme(theme: string) {
  const value = theme.toLowerCase();
  if (/amor|love|relacion|relationship/.test(value)) return "love";
  if (/carreira|career|trabalho|work|dinheiro|money/.test(value)) return "career";
  if (/self|eu|interior|pessoal|personal/.test(value)) return "self";
  return "general";
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function pickVariant<T>(items: readonly T[], seed: number, salt: string) {
  let mixed = (seed ^ hashSeed(salt)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b);
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b);
  mixed = (mixed ^ (mixed >>> 16)) >>> 0;
  return items[mixed % items.length];
}

export function generateFallbackReading(params: FallbackReadingParams) {
  const {
    daily,
    hasPortalMemory,
    locale,
    mode,
    productKey,
    question,
    spread,
    theme,
    userId,
  } = params;
  const isEnglish = locale === "en";
  const seed = hashSeed(
    [
      userId,
      daily.dateKey,
      question.toLowerCase(),
      theme,
      mode,
      productKey,
      ...spread.map(({ card, reversed }) => `${card.key}:${reversed}`),
    ].join("|")
  );
  const themeKey = normalizeTheme(theme);
  const copy = (isEnglish ? EN_THEMES : PT_THEMES)[themeKey];
  const openings = (isEnglish ? EN_OPENINGS : PT_OPENINGS)[mode] ??
    (isEnglish ? EN_OPENINGS : PT_OPENINGS).NEVOA;
  const pick = <T,>(items: readonly T[], salt: string) =>
    pickVariant(items, seed, salt);
  const localizedSpread = spread;
  const situation = localizedSpread[0];
  const obstacle = localizedSpread[1];
  const direction = localizedSpread[2];
  const meaning = (draw: (typeof localizedSpread)[number]) =>
    draw.reversed ? draw.card.reversed : draw.card.upright;
  const label = (draw: (typeof localizedSpread)[number]) =>
    `${draw.card.name}${draw.reversed ? (isEnglish ? " (reversed)" : " (reversa)") : ""}`;

  const contextualOpening = isEnglish
    ? `${pick(openings, "opening")} Today's energy, “${daily.energy},” asks you to approach ${copy.label} through ${situation.card.keywords[0]}.`
    : `${pick(openings, "opening")} A energia “${daily.energy}” convida você a olhar para ${copy.label} pela lente de ${situation.card.keywords[0]}.`;
  const memoryLine = hasPortalMemory
    ? isEnglish
      ? "Your saved journey suggests this is part of a continuing pattern; notice what is repeating without forcing a conclusion."
      : "Sua jornada salva indica continuidade; observe o que se repete sem forçar uma conclusão."
    : "";
  const mantra = pick(copy.mantras, "mantra");
  const productContext = PRODUCT_CONTEXT[productKey] ?? PRODUCT_CONTEXT.free_daily;
  const actions = unique([
    pick(copy.actions, "action-theme"),
    daily.advice,
    isEnglish
      ? `Use ${direction.card.keywords[0]} as a filter: complete one concrete action before the day ends.`
      : `Use ${direction.card.keywords[0]} como filtro: conclua uma ação concreta antes do fim do dia.`,
  ]).slice(0, 3);
  const recommendedQuestion = pick(copy.questions, "question");

  const lines = isEnglish
    ? [
        "1) INITIAL LISTENING",
        contextualOpening,
        productContext.en,
        memoryLine,
        "",
        "2) MANTRA",
        mantra,
        `Plain meaning: ${daily.affirmation}`,
        "",
        "3) THE THREE THREADS",
        `- Truth: ${meaning(situation)}`,
        `- Shadow: ${meaning(obstacle)}`,
        `- Direction: ${meaning(direction)}`,
        "",
        "4) READING BY POSITION",
        ...localizedSpread.flatMap((draw, index) => [
          `- ${draw.position} — ${label(draw)}`,
          `  In practice: ${meaning(draw)}`,
          `  ${pick(EN_POSITION_GUIDANCE[index], `position-${index}`)}`,
          "",
        ]),
        "5) ACTIONS",
        ...actions.map((action) => `- ${action}`),
        "",
        "6) INTEGRATION",
        daily.ritual,
        `- What is happening: ${situation.card.keywords[0]} is setting the tone.`,
        `- What blocks you: ${obstacle.card.keywords[0]} needs awareness rather than impulse.`,
        `- Next step: act through ${direction.card.keywords[0]}.`,
        `- Recommended question: ${recommendedQuestion}`,
      ]
    : [
        "1) ESCUTA INICIAL",
        contextualOpening,
        productContext.pt,
        memoryLine,
        "",
        "2) MANTRA",
        mantra,
        `Tradução simples: ${daily.affirmation}`,
        "",
        "3) TRÍADE",
        `- Verdade: ${meaning(situation)}`,
        `- Sombra: ${meaning(obstacle)}`,
        `- Direção: ${meaning(direction)}`,
        "",
        "4) LEITURA POR POSIÇÃO",
        ...localizedSpread.flatMap((draw, index) => [
          `- ${draw.position} — ${label(draw)}`,
          `  Na prática: ${meaning(draw)}`,
          `  ${pick(PT_POSITION_GUIDANCE[index], `position-${index}`)}`,
          "",
        ]),
        "5) AÇÕES",
        ...actions.map((action) => `- ${action}`),
        "",
        "6) INTEGRAÇÃO",
        daily.ritual,
        `- O que está acontecendo: ${situation.card.keywords[0]} dá o tom.`,
        `- O que trava: ${obstacle.card.keywords[0]} pede consciência, não impulso.`,
        `- Próximo passo: agir por meio de ${direction.card.keywords[0]}.`,
        `- Pergunta recomendada: ${recommendedQuestion}`,
      ];

  return lines
    .filter((line, index) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
