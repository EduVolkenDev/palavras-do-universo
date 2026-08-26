import type { DailyMessage } from "../daily/message";
import { hashSeed } from "../daily/seed";
import type { Locale } from "../i18n/config";
import type { TarotCard } from "./cards";
import type { PersonalizationSignals } from "../personalization/reading-context";

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
  onboardingFocus?: string;
  onboardingSignal?: string;
  personalization?: Pick<
    PersonalizationSignals,
    "focusAreas" | "currentPhase" | "guidanceTone" | "desiredShift" | "boundaries"
  >;
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

const PT_MOMENT_PATTERNS = {
  urgency: [
    "Parece que você não está buscando uma frase bonita; está buscando um pouco de chão para não decidir só pela pressão.",
    "O ponto humano aqui é a pressa interna: uma parte sua quer resolver, outra precisa se sentir segura antes.",
    "Existe uma urgência legítima, mas ela não precisa virar comando. Ela pode virar critério.",
  ],
  relationship: [
    "O que mais pesa aqui não é só a resposta; é a vontade de entender sem se perder no outro.",
    "A pergunta toca vínculo, expectativa e proteção emocional. Por isso, a leitura precisa devolver centro antes de devolver direção.",
    "Há afeto envolvido, mas também há um pedido de dignidade: sentir não obriga você a se abandonar.",
  ],
  work: [
    "A sensação é de muita coisa competindo por prioridade, como se tudo pedisse resposta ao mesmo tempo.",
    "O centro desta pergunta parece material: energia, prazo, escolha, consequência e foco.",
    "A leitura precisa tirar peso do ruído e devolver uma sequência possível de ação.",
  ],
  transition: [
    "Você parece estar entre uma versão antiga de si e uma forma nova de agir que ainda não ficou confortável.",
    "O momento tem cara de passagem: não é falta de resposta, é excesso de vida se reorganizando.",
    "Existe uma transição em curso, e a parte delicada é não exigir certeza total antes do primeiro movimento.",
  ],
  selfTrust: [
    "Talvez o ponto sensível seja confiar no que você já percebe, sem transformar cada sensação em prova.",
    "A pergunta pede menos validação externa e mais honestidade com o que seu corpo já vem sinalizando.",
    "Aqui existe um convite para se escutar sem endurecer, e para agir sem se atropelar.",
  ],
  general: [
    "A pergunta tem uma camada prática e uma camada emocional; as duas precisam ser ouvidas para a resposta não ficar rasa.",
    "O que aparece aqui é uma busca por clareza suficiente, não por controle absoluto.",
    "A resposta mais humana começa reconhecendo que você já está tentando cuidar disso, mesmo sem ter tudo resolvido.",
  ],
} as const;

const EN_MOMENT_PATTERNS = {
  urgency: [
    "It feels like you are not looking for a pretty sentence; you are looking for enough ground not to decide only from pressure.",
    "The human point here is inner urgency: one part of you wants resolution, another needs to feel safe first.",
    "There is legitimate urgency here, but it does not need to become a command. It can become a criterion.",
  ],
  relationship: [
    "What weighs here is not only the answer; it is the wish to understand without losing yourself in someone else.",
    "The question touches connection, expectation, and emotional protection. So the reading needs to return you to your center before it gives direction.",
    "There is care involved, but also dignity: feeling deeply does not require abandoning yourself.",
  ],
  work: [
    "The feeling is of too many things competing for priority, as if everything is asking for an answer at once.",
    "The center of this question seems material: energy, timing, choice, consequence, and focus.",
    "This reading needs to remove weight from the noise and return a possible sequence of action.",
  ],
  transition: [
    "You seem to be between an older version of yourself and a newer way of acting that is not comfortable yet.",
    "This moment feels like a passage: not lack of answer, but a lot of life reorganizing at once.",
    "There is a transition underway, and the delicate part is not demanding total certainty before the first movement.",
  ],
  selfTrust: [
    "Maybe the sensitive point is trusting what you already perceive without turning every feeling into evidence.",
    "The question asks for less external validation and more honesty with what your body has already been signaling.",
    "There is an invitation here to listen without becoming rigid, and to act without rushing yourself.",
  ],
  general: [
    "This question has a practical layer and an emotional layer; both need to be heard for the answer not to feel shallow.",
    "What appears here is a search for enough clarity, not absolute control.",
    "The most human answer begins by recognizing that you are already trying to care for this, even without having everything resolved.",
  ],
} as const;

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
  tirada_diamante: {
    en: "The Diamond reads inner influence, outer influence, resolution, and integration as one connected question.",
    pt: "O Diamante lê influência interna, influência externa, resolução e integração como uma única questão conectada.",
  },
  passaro_voando: {
    en: "The Flying Bird distinguishes fear, receptivity, action, and the horizon that becomes possible when movement gains integrity.",
    pt: "O Pássaro Voando diferencia medo, receptividade, ação e o horizonte que surge quando o movimento ganha integridade.",
  },
  a_chave: {
    en: "The Key treats hidden layers as symbolic hypotheses and looks for the understanding that restores choice.",
    pt: "A Chave trata camadas ocultas como hipóteses simbólicas e procura a compreensão que devolve escolha.",
  },
  o_espelho: {
    en: "The Mirror keeps the reading within your field: projection, need, boundary, conversation, and choice.",
    pt: "O Espelho mantém a leitura no seu campo: projeção, necessidade, limite, conversa e escolha.",
  },
  cruz_celta: {
    en: "The Celtic Cross organizes the wider map into context, tension, roots, environment, and integration.",
    pt: "A Cruz Celta organiza o mapa amplo em contexto, tensão, raízes, campo e integração.",
  },
  relacionar: {
    en: "Relating observes your field, the other field, what emerges between both, and the awareness that makes the bond more honest.",
    pt: "Relacionar observa seu campo, o outro campo, o que nasce entre ambos e a consciência que torna o vínculo mais honesto.",
  },
  o_paradoxo: {
    en: "The Paradox gives both truths room to breathe until a third perspective becomes possible.",
    pt: "O Paradoxo dá espaço para as duas verdades respirarem até que um terceiro olhar se torne possível.",
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
  [
    "Leia esta posição como parte do mapa inteiro, não como uma mensagem isolada.",
    "Observe como esta camada conversa com as cartas anteriores e prepara a próxima.",
    "Deixe esta posição acrescentar nuance antes de procurar uma conclusão.",
    "Pergunte o que muda no conjunto quando esta energia é reconhecida.",
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
  [
    "Read this position as part of the whole map, not as an isolated message.",
    "Notice how this layer speaks to the cards before it and prepares the next one.",
    "Let this position add nuance before looking for a conclusion.",
    "Ask what changes in the full spread when this energy is acknowledged.",
  ],
];

const PT_POSITION_CONTEXT: readonly (readonly string[])[] = [
  [
    "{card} enquadra {question}: {keyword} aparece como o primeiro sinal a ser lido antes de decidir o próximo passo.",
    "Na situação, {card} traz {keyword} para dentro de {question}; comece separando fato, desejo e medo.",
    "{card} mostra o terreno inicial de {question}: antes de agir, reconheça onde {keyword} já está organizando a cena.",
    "A primeira camada de {question} passa por {card}; leia esse tema como contexto vivo, não como resposta fechada.",
  ],
  [
    "{card} mostra a tensão dentro de {question}: {keyword} virou ponto de pressão e pede uma resposta menos automática.",
    "No obstáculo, {card} revela onde {question} pode estar sendo atravessada por excesso, defesa ou pressa.",
    "{card} não bloqueia a resposta; ele mostra onde {keyword} precisa ser visto antes que você escolha no impulso.",
    "A sombra de {question} aparece em {card}: algo pede pausa para que {keyword} não vire repetição.",
  ],
  [
    "{card} leva a resposta para ação: use {keyword} para fazer uma escolha possível, em vez de esperar a situação inteira ficar certa.",
    "Como direção, {card} pede que {question} vire um gesto concreto guiado por {keyword}.",
    "{card} aponta o movimento mais limpo: transforme esse tema em uma decisão pequena, visível e realizável.",
    "A saída aberta por {card} não exige certeza total; ela pede um passo que confirme {keyword} no mundo real.",
  ],
  [
    "Nesta camada, {card} acrescenta {keyword} ao mapa de {question}; leia a relação com as outras posições antes de concluir.",
    "{card} amplia {question} por meio de {keyword}; essa posição ganha sentido no diálogo com o conjunto.",
    "A posição ocupada por {card} revela uma nuance de {keyword} que reorganiza a leitura de {question}.",
    "{card} pede que {keyword} seja integrado ao restante da tirada, sem transformar uma única carta em sentença.",
  ],
];

const EN_POSITION_CONTEXT: readonly (readonly string[])[] = [
  [
    "{card} frames {question}: {keyword} appears as the first signal to read before deciding what comes next.",
    "In the situation, {card} brings {keyword} into {question}; begin by separating fact, desire, and fear.",
    "{card} shows the starting ground of {question}: before acting, notice where {keyword} is already shaping the scene.",
    "The first layer of {question} moves through {card}; read this theme as living context, not a closed answer.",
  ],
  [
    "{card} shows the tension inside {question}: {keyword} is becoming a point of pressure and asks for a less automatic response.",
    "As the obstacle, {card} reveals where {question} may be crossed by excess, defense, or haste.",
    "{card} does not block the answer; it shows where {keyword} needs to be seen before you choose from impulse.",
    "The shadow of {question} appears through {card}: something asks for pause so {keyword} does not become repetition.",
  ],
  [
    "{card} turns the answer toward action: use {keyword} to make one possible choice instead of waiting for the whole situation to become certain.",
    "As direction, {card} asks {question} to become one concrete gesture guided by {keyword}.",
    "{card} points to the cleanest movement: turn this theme into a small, visible, doable decision.",
    "The way opened by {card} does not demand total certainty; it asks for one step that confirms {keyword} in real life.",
  ],
  [
    "In this layer, {card} adds {keyword} to the map of {question}; read its relationship with the other positions before concluding.",
    "{card} expands {question} through {keyword}; this position gains meaning in dialogue with the whole spread.",
    "The position held by {card} reveals a nuance of {keyword} that reorganizes the reading of {question}.",
    "{card} asks you to integrate {keyword} with the rest of the spread without turning one card into a verdict.",
  ],
];

function normalizeTheme(theme: string) {
  const value = theme.toLowerCase();
  if (/amor|love|relacion|relationship/.test(value)) return "love";
  if (/carreira|career|trabalho|work|dinheiro|money/.test(value)) return "career";
  if (/self|eu|interior|pessoal|personal/.test(value)) return "self";
  return "general";
}

function detectMomentPattern(question: string, theme: string) {
  const value = `${question} ${theme}`.toLowerCase();
  if (/(urg|agora|hoje|press|ansiedade|ansious|panic|now|today|immediate)/i.test(value)) {
    return "urgency";
  }
  if (/(amor|relacion|vínculo|vinculo|volta|sumiu|mensagem|love|relationship|partner|ex\\b|crush)/i.test(value)) {
    return "relationship";
  }
  if (/(trabalho|carreira|emprego|cliente|dinheiro|projeto|work|career|money|job|client|project)/i.test(value)) {
    return "work";
  }
  if (/(mudar|transi|recome|novo ciclo|encerr|change|transition|new cycle|ending|start over)/i.test(value)) {
    return "transition";
  }
  if (/(confio|intuição|intuicao|medo|duvida|dúvida|escolher|trust|intuition|fear|doubt|choose)/i.test(value)) {
    return "selfTrust";
  }
  return "general";
}

function buildLocalPresenceLine(params: {
  isEnglish: boolean;
  onboardingFocus?: string;
  onboardingSignal?: string;
  personalization?: FallbackReadingParams["personalization"];
  patternLine: string;
}) {
  const focus = params.onboardingFocus?.trim();
  const signal = params.onboardingSignal?.trim();
  const profile = params.personalization;
  const profileLines = [
    profile?.focusAreas.length
      ? params.isEnglish
        ? `Your declared focus is ${profile.focusAreas.join(", ").toLowerCase()}.`
        : `Seu foco declarado está em ${profile.focusAreas.join(", ").toLowerCase()}.`
      : "",
    profile?.currentPhase
      ? params.isEnglish
        ? `You described this phase as ${profile.currentPhase.toLowerCase()}.`
        : `Você descreveu esta fase como ${profile.currentPhase.toLowerCase()}.`
      : "",
    profile?.desiredShift
      ? params.isEnglish
        ? `The shift you want is ${profile.desiredShift.toLowerCase()}.`
        : `A transformação que você busca é ${profile.desiredShift.toLowerCase()}.`
      : "",
    profile?.guidanceTone
      ? params.isEnglish
        ? `I will keep the guidance ${profile.guidanceTone.toLowerCase()}.`
        : `Vou manter a orientação ${profile.guidanceTone.toLowerCase()}.`
      : "",
    profile?.boundaries.length
      ? params.isEnglish
        ? `Your boundaries are part of the reading: ${profile.boundaries.join(", ").toLowerCase()}.`
        : `Seus limites fazem parte da leitura: ${profile.boundaries.join(", ").toLowerCase()}.`
      : "",
  ].filter(Boolean);
  if (!focus && !signal && !profileLines.length) return params.patternLine;

  if (params.isEnglish) {
    return [
      params.patternLine,
      ...profileLines,
      focus ? `You entered the reading through "${focus}", so I will treat this as part of the emotional weather around the question.` : "",
      signal ? `The chosen signal, "${signal}", works here as a symbolic tone rather than a fixed label about you.` : "",
    ].filter(Boolean).join(" ");
  }

  return [
    params.patternLine,
    ...profileLines,
    focus ? `Você entrou na leitura por "${focus}", então vou tratar isso como parte do clima emocional da pergunta.` : "",
    signal ? `O sinal escolhido, "${signal}", funciona aqui como tom simbólico, não como rótulo fixo sobre você.` : "",
  ].filter(Boolean).join(" ");
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

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

export function generateFallbackReading(params: FallbackReadingParams) {
  const {
    daily,
    hasPortalMemory,
    locale,
    mode,
    onboardingFocus,
    onboardingSignal,
    personalization,
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
  const pick = <T,>(items: readonly T[], salt: string) =>
    pickVariant(items, seed, salt);
  const momentPattern = detectMomentPattern(question, theme);
  const momentLine = pick(
    (isEnglish ? EN_MOMENT_PATTERNS : PT_MOMENT_PATTERNS)[momentPattern],
    `moment-pattern:${momentPattern}`
  );
  const openings = (isEnglish ? EN_OPENINGS : PT_OPENINGS)[mode] ??
    (isEnglish ? EN_OPENINGS : PT_OPENINGS).NEVOA;
  const localizedSpread = spread;
  const situation = localizedSpread[0];
  const obstacle = localizedSpread[1] ?? localizedSpread[0];
  const direction = localizedSpread.at(-1) ?? localizedSpread[0];
  const midpoint = localizedSpread[Math.floor((localizedSpread.length - 1) / 2)] ?? obstacle;
  const hasExtendedSpread = localizedSpread.length > 3;
  const meaning = (draw: (typeof localizedSpread)[number]) =>
    draw.reversed ? draw.card.reversed : draw.card.upright;
  const label = (draw: (typeof localizedSpread)[number]) =>
    `${draw.card.name}${draw.reversed ? (isEnglish ? " (reversed)" : " (reversa)") : ""}`;
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  const shortQuestion =
    cleanQuestion.length > 96 ? `${cleanQuestion.slice(0, 93).trim()}...` : cleanQuestion;
  const contextualMeaning = (draw: (typeof localizedSpread)[number], index: number) => {
    const cardMeaning = meaning(draw).replace(/\s+/g, " ").replace(/[.!?]\s.*$/, "").trim();
    const keyword = draw.card.keywords[0] ?? (isEnglish ? "presence" : "presença");
    const questionPart = shortQuestion
      ? isEnglish
        ? `your question "${shortQuestion}"`
        : `sua pergunta "${shortQuestion}"`
      : isEnglish
        ? "this moment"
        : "este momento";
    const templates = isEnglish ? EN_POSITION_CONTEXT : PT_POSITION_CONTEXT;
    const template = pickVariant(
      templates[index] ?? templates[3] ?? templates[0],
      seed,
      `position-context:${index}:${draw.card.key}:${draw.reversed ? "r" : "u"}`
    );

    return fillTemplate(template, {
      card: label(draw),
      keyword,
      meaning: cardMeaning || keyword,
      question: questionPart,
    });
  };

  const contextualOpening = isEnglish
    ? `${pick(openings, "opening")} Today's energy, “${daily.energy},” asks you to approach ${copy.label} through ${situation.card.keywords[0]}.`
    : `${pick(openings, "opening")} A energia “${daily.energy}” convida você a olhar para ${copy.label} pela lente de ${situation.card.keywords[0]}.`;
  const localPresenceLine = buildLocalPresenceLine({
    isEnglish,
    onboardingFocus,
    onboardingSignal,
    personalization,
    patternLine: momentLine,
  });
  const directAnswer = isEnglish
    ? hasExtendedSpread
      ? `${localPresenceLine} Your question is not asking for perfect certainty; this ${localizedSpread.length}-position map begins with ${label(situation)}, turns through ${label(midpoint)}, and converges toward ${label(direction)}.`
      : `${localPresenceLine} Your question is not asking for perfect certainty; it is asking you to read the situation through ${label(situation)}, notice the tension shown by ${label(obstacle)}, and choose the direction opened by ${label(direction)}.`
    : hasExtendedSpread
      ? `${localPresenceLine} A sua pergunta não está pedindo certeza perfeita; este mapa de ${localizedSpread.length} posições começa em ${label(situation)}, atravessa ${label(midpoint)} e converge para ${label(direction)}.`
      : `${localPresenceLine} A sua pergunta não está pedindo certeza perfeita; ela pede que você leia a situação por ${label(situation)}, perceba a tensão mostrada por ${label(obstacle)} e escolha a direção aberta por ${label(direction)}.`;
  const memoryLine = hasPortalMemory
    ? isEnglish
      ? "Your saved journey suggests this is part of a continuing pattern; notice what is repeating without forcing a conclusion."
      : "Sua jornada salva indica continuidade; observe o que se repete sem forçar uma conclusão."
    : "";
  const mantra = pick(copy.mantras, "mantra");
  const productContext = PRODUCT_CONTEXT[productKey] ?? PRODUCT_CONTEXT.free_daily;
  const triadLine = (draw: (typeof localizedSpread)[number], index: number) => {
    const keyword = draw.card.keywords[0] ?? (isEnglish ? "presence" : "presença");
    const templates = isEnglish
      ? [
          `${label(draw)} names the truth beneath the noise: ${keyword} is the first layer to acknowledge honestly.`,
          `${label(draw)} shows the shadow clearly: ${keyword} needs to be seen before the pattern repeats.`,
          `${label(draw)} opens direction through one grounded movement shaped by ${keyword}.`,
        ]
      : [
          `${label(draw)} nomeia a verdade sob o ruído: ${keyword} é a primeira camada a reconhecer com honestidade.`,
          `${label(draw)} mostra a sombra com clareza: ${keyword} precisa ser visto antes que o padrão se repita.`,
          `${label(draw)} abre direção por meio de um movimento possível guiado por ${keyword}.`,
        ];
    return templates[index] ?? templates[0];
  };
  const actions = unique([
    pick(copy.actions, "action-theme"),
    daily.advice,
    isEnglish
      ? `Let ${label(direction)} define one concrete action you can complete before the day ends.`
      : `Deixe ${label(direction)} definir uma ação concreta que você consiga concluir antes do fim do dia.`,
  ]).slice(0, 3);
  const recommendedQuestion = pick(copy.questions, "question");

  const lines = isEnglish
    ? [
        "1) DIRECT ANSWER TO THE QUESTION",
        directAnswer,
        "",
        "2) INITIAL LISTENING",
        contextualOpening,
        productContext.en,
        memoryLine,
        "",
        "3) MANTRA",
        mantra,
        `Plain meaning: ${daily.affirmation}`,
        "",
        hasExtendedSpread ? "4) MAP OF THE SPREAD" : "4) THE THREE THREADS",
        `- ${hasExtendedSpread ? "Opening" : "Truth"}: ${triadLine(situation, 0)}`,
        `- ${hasExtendedSpread ? "Turning point" : "Shadow"}: ${triadLine(hasExtendedSpread ? midpoint : obstacle, 1)}`,
        `- ${hasExtendedSpread ? "Integration" : "Direction"}: ${triadLine(direction, 2)}`,
        "",
        "5) READING BY POSITION",
        ...localizedSpread.flatMap((draw, index) => [
          `- ${draw.position} — ${label(draw)}`,
          `  In practice: ${contextualMeaning(draw, index)}`,
          `  ${pick(EN_POSITION_GUIDANCE[index] ?? EN_POSITION_GUIDANCE[3], `position-${index}`)}`,
          "",
        ]),
        "6) ACTIONS",
        ...actions.map((action) => `- ${action}`),
        "",
        "7) INTEGRATION",
        daily.ritual,
        `- What is happening: ${situation.card.keywords[0]} is setting the tone.`,
        `- What blocks you: ${obstacle.card.keywords[0]} needs awareness rather than impulse.`,
        `- Next step: act through ${direction.card.keywords[0]}.`,
        `- Recommended question: ${recommendedQuestion}`,
      ]
    : [
        "1) RESPOSTA DIRETA À PERGUNTA",
        directAnswer,
        "",
        "2) ESCUTA INICIAL",
        contextualOpening,
        productContext.pt,
        memoryLine,
        "",
        "3) MANTRA",
        mantra,
        `Tradução simples: ${daily.affirmation}`,
        "",
        hasExtendedSpread ? "4) MAPA DA TIRADA" : "4) TRÍADE",
        `- ${hasExtendedSpread ? "Abertura" : "Verdade"}: ${triadLine(situation, 0)}`,
        `- ${hasExtendedSpread ? "Ponto de virada" : "Sombra"}: ${triadLine(hasExtendedSpread ? midpoint : obstacle, 1)}`,
        `- ${hasExtendedSpread ? "Integração" : "Direção"}: ${triadLine(direction, 2)}`,
        "",
        "5) LEITURA POR POSIÇÃO",
        ...localizedSpread.flatMap((draw, index) => [
          `- ${draw.position} — ${label(draw)}`,
          `  Na prática: ${contextualMeaning(draw, index)}`,
          `  ${pick(PT_POSITION_GUIDANCE[index] ?? PT_POSITION_GUIDANCE[3], `position-${index}`)}`,
          "",
        ]),
        "6) AÇÕES",
        ...actions.map((action) => `- ${action}`),
        "",
        "7) INTEGRAÇÃO",
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
