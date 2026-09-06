import { getDateOrdinal, hashSeed, pickSeeded, shuffleSeeded } from "./seed";
import { CARDS } from "@/lib/tarot/cards";

export type DailyMessage = {
  advice: string;
  affirmation: string;
  dateKey: string;
  energy: string;
  message: string;
  reflection: string;
  ritual: string;
  spread: {
    assetPath: string;
    keyword: string;
    meaning: string;
    name: string;
    position: "SITUAÇÃO" | "OBSTÁCULO" | "DIREÇÃO";
    reversed: boolean;
    coreMeaning?: string;
    lifeQuestion?: string;
  }[];
  timeZone: string;
};

type DailyTheme = {
  energy: string;
  messages: readonly string[];
  advice: readonly string[];
  affirmations: readonly string[];
  reflections: readonly string[];
  rituals: readonly string[];
};

const DAILY_THEMES: readonly DailyTheme[] = [
  {
    energy: "Recomeço silencioso",
    messages: [
      "Há algo se reorganizando dentro de você. Nem toda mudança chega com barulho; algumas chegam como cansaço do que já não faz sentido.",
      "O novo pode começar como uma vontade discreta de fazer diferente. Não subestime o que muda primeiro por dentro.",
    ],
    advice: [
      "Não force respostas. Observe o que perdeu sentido e abra espaço.",
      "Escolha uma coisa pequena para começar de outro modo hoje.",
      "Deixe uma decisão antiga ser revista sem transformar isso em fracasso.",
    ],
    affirmations: [
      "Eu posso recomeçar sem apagar o caminho que me trouxe até aqui.",
      "Eu reconheço quando a vida pede uma nova forma.",
    ],
    reflections: [
      "O que já terminou por dentro, mesmo que eu ainda não tenha nomeado?",
      "Que começo fica possível quando eu paro de exigir certeza total?",
    ],
    rituals: [
      "Abra uma janela, respire fundo e escreva uma coisa que você deseja deixar entrar.",
      "Retire um objeto sem uso do seu espaço e nomeie o que ele libera.",
    ],
  },
  {
    energy: "Clareza em movimento",
    messages: [
      "O dia pede menos adivinhação e mais honestidade. A resposta começa quando você para de negociar com o que já percebeu.",
      "A clareza não precisa chegar completa para orientar o próximo passo. Uma verdade simples já pode mover o dia.",
    ],
    advice: [
      "Escolha uma ação pequena que confirme sua verdade.",
      "Separe fato, medo e desejo antes de decidir.",
      "Faça primeiro o movimento que depende apenas de você.",
    ],
    affirmations: [
      "Eu posso agir com calma sem abandonar minha força.",
      "A verdade simples é suficiente para orientar meu próximo passo.",
    ],
    reflections: [
      "Que verdade fica simples quando eu tiro o medo da frente?",
      "O que eu faria hoje se não precisasse explicar a escolha para ninguém?",
    ],
    rituals: [
      "Respire três vezes e complete: o passo honesto de hoje é...",
      "Divida uma folha em fato, medo e desejo; escreva uma frase em cada parte.",
    ],
  },
  {
    energy: "Cuidado com o próprio centro",
    messages: [
      "Você não precisa se explicar para merecer descanso. Algo em você quer voltar para casa antes de responder ao mundo.",
      "Seu centro não é um luxo para depois. É de onde nasce a qualidade de tudo que você oferece.",
    ],
    advice: [
      "Proteja uma parte do seu dia de ruídos desnecessários.",
      "Responda ao corpo antes de responder às cobranças.",
      "Faça menos uma coisa para poder estar inteiro no que permanecer.",
    ],
    affirmations: [
      "Eu me trato como alguém que também precisa de cuidado.",
      "Meu descanso participa das minhas decisões.",
    ],
    reflections: [
      "Onde eu estou me abandonando para manter tudo funcionando?",
      "Que necessidade minha ficou pequena demais na agenda?",
    ],
    rituals: [
      "Beba um copo de água devagar e faça dez minutos sem tela.",
      "Coloque uma mão no peito, outra no abdômen e respire por doze ciclos.",
    ],
  },
  {
    energy: "Limite luminoso",
    messages: [
      "Um limite não precisa ser duro para ser verdadeiro. Hoje, firmeza pode ser apenas não se trair para caber.",
      "Toda vez que você protege o essencial, ensina ao mundo como deseja ser encontrado.",
    ],
    advice: [
      "Diga menos, mas diga com mais presença.",
      "Adie uma resposta que seria dada apenas por pressão.",
      "Troque uma justificativa longa por uma frase clara.",
    ],
    affirmations: [
      "Eu posso escolher paz sem pedir permissão para existir.",
      "Meu limite protege o que há de vivo em mim.",
    ],
    reflections: [
      "Que limite me devolveria energia imediatamente?",
      "Onde um sim automático está escondendo um não verdadeiro?",
    ],
    rituals: [
      "Escreva uma frase começando com: hoje eu não negocio...",
      "Pratique dizer uma resposta clara diante do espelho, sem se justificar.",
    ],
  },
  {
    energy: "Sinal no detalhe",
    messages: [
      "O dia pode trazer uma resposta pequena, quase discreta. Não procure espetáculo onde a vida fala por repetição.",
      "O que parece coincidência talvez seja apenas sua atenção finalmente alcançando algo importante.",
    ],
    advice: [
      "Preste atenção ao que volta pela terceira vez.",
      "Observe o detalhe que muda seu humor sem pedir licença.",
      "Anote antes de interpretar; o padrão aparece melhor no papel.",
    ],
    affirmations: [
      "Eu reconheço sinais sem transformar tudo em urgência.",
      "Minha atenção sabe encontrar o que merece cuidado.",
    ],
    reflections: [
      "Que detalhe eu venho ignorando porque parecia simples demais?",
      "O que se repetiu recentemente e ainda não recebeu minha atenção?",
    ],
    rituals: [
      "Anote três repetições do dia: palavras, sensações ou encontros.",
      "Fotografe ou desenhe um detalhe que chamou sua atenção e escreva o motivo.",
    ],
  },
  {
    energy: "Coragem serena",
    messages: [
      "Existe uma coragem que não grita. Ela aparece quando você para de esperar certeza total e escolhe um gesto possível.",
      "Talvez você não precise vencer o medo hoje; basta não permitir que ele escolha tudo sozinho.",
    ],
    advice: [
      "Faça o menor movimento que ainda respeita sua verdade.",
      "Comece antes de se sentir completamente pronto.",
      "Escolha uma ação possível e encerre o dia tendo avançado um centímetro.",
    ],
    affirmations: [
      "Eu não preciso estar pronto por inteiro para começar.",
      "Minha coragem pode ser calma e ainda assim transformar meu caminho.",
    ],
    reflections: [
      "Qual movimento pequeno mudaria a energia do meu dia?",
      "Que passo eu adiaria menos se aceitasse fazê-lo imperfeitamente?",
    ],
    rituals: [
      "Escolha uma tarefa de até vinte minutos e faça sem buscar perfeição.",
      "Conte até cinco e inicie a ação antes que a mente abra uma nova negociação.",
    ],
  },
  {
    energy: "Integração",
    messages: [
      "Algumas respostas não chegam como novidade, chegam como encaixe. Hoje, algo que você viveu pode finalmente ganhar nome.",
      "Experiências antigas começam a formar uma linguagem comum. O sentido aparece quando você deixa de olhar cada parte isoladamente.",
    ],
    advice: [
      "Antes de buscar mais informação, organize o que você já sabe.",
      "Conecte uma experiência recente a um aprendizado antigo.",
      "Dê nome ao padrão antes de tentar corrigi-lo.",
    ],
    affirmations: [
      "Minha experiência também é uma forma de sabedoria.",
      "Eu reúno minhas partes sem exigir que elas tenham sido perfeitas.",
    ],
    reflections: [
      "Que aprendizado antigo está pedindo aplicação agora?",
      "Que partes da minha história começam a fazer sentido juntas?",
    ],
    rituals: [
      "Escreva: eu já aprendi que... e complete sem se corrigir.",
      "Liste três acontecimentos recentes e escreva o fio que pode conectá-los.",
    ],
  },
  {
    energy: "Presença fértil",
    messages: [
      "Nem toda produtividade deixa fruto. Hoje, o que cresce melhor pode ser aquilo que recebe presença sem pressa.",
      "A vida também amadurece nos intervalos em que você parece não estar avançando.",
    ],
    advice: [
      "Cuide bem de uma coisa em vez de iniciar cinco.",
      "Dê tempo ao que está crescendo antes de cobrar resultado.",
      "Escolha qualidade de presença como sua medida de progresso.",
    ],
    affirmations: [
      "Minha presença transforma o que eu escolho cuidar.",
      "Eu respeito o tempo de maturação das coisas importantes.",
    ],
    reflections: [
      "O que merece constância em vez de urgência?",
      "Que resultado eu poderia nutrir melhor se parasse de medi-lo toda hora?",
    ],
    rituals: [
      "Cuide de uma planta, alimento ou espaço por alguns minutos em silêncio.",
      "Escolha uma tarefa e permaneça nela por vinte e cinco minutos sem alternar.",
    ],
  },
  {
    energy: "Desapego gentil",
    messages: [
      "Soltar não significa negar o que foi importante. Significa permitir que a importância mude de lugar.",
      "Uma parte do peso de hoje pode vir de continuar sustentando algo que já cumpriu seu papel.",
    ],
    advice: [
      "Solte uma obrigação que existe apenas por hábito.",
      "Pergunte o que ainda é seu e o que você carrega por lealdade antiga.",
      "Encerre uma pendência pequena para ensinar leveza ao corpo.",
    ],
    affirmations: [
      "Eu honro o que passou sem precisar continuar carregando tudo.",
      "Há espaço para leveza quando eu libero o que já terminou.",
    ],
    reflections: [
      "O que eu mantenho apenas porque um dia foi importante?",
      "Que peso não combina mais com a pessoa que estou me tornando?",
    ],
    rituals: [
      "Escreva o que deseja soltar e rasgue o papel com intenção.",
      "Organize uma gaveta pequena e retire o que já não acompanha sua vida.",
    ],
  },
  {
    energy: "Escuta profunda",
    messages: [
      "A resposta mais útil talvez não seja a mais rápida. Diminua o volume ao redor para perceber o que permanece.",
      "Seu silêncio contém informações que a pressa não consegue traduzir.",
    ],
    advice: [
      "Espere alguns minutos antes de responder ao que despertou reação forte.",
      "Escute a sensação que permanece depois que o argumento termina.",
      "Faça uma pergunta sem correr para preenchê-la com resposta.",
    ],
    affirmations: [
      "Eu confio no que consigo ouvir quando diminuo o ruído.",
      "Meu silêncio não é vazio; ele organiza minha verdade.",
    ],
    reflections: [
      "O que meu corpo já respondeu antes da minha mente?",
      "Que verdade só aparece quando eu paro de tentar parecer certo?",
    ],
    rituals: [
      "Faça cinco minutos de silêncio sem música, tela ou tarefa.",
      "Escreva uma pergunta e permaneça dois minutos respirando antes de responder.",
    ],
  },
  {
    energy: "Alegria possível",
    messages: [
      "A alegria não precisa esperar que tudo esteja resolvido. Ela também pode ser uma forma de sustentar a travessia.",
      "Hoje existe espaço para reconhecer algo bom sem diminuir a complexidade do resto.",
    ],
    advice: [
      "Escolha conscientemente uma experiência simples que devolva vitalidade.",
      "Celebre uma pequena vitória antes de seguir para a próxima cobrança.",
      "Aceite um momento bom sem procurar imediatamente o que pode dar errado.",
    ],
    affirmations: [
      "Eu permito que a alegria também participe do meu caminho.",
      "Reconhecer o que é bom fortalece minha capacidade de atravessar o difícil.",
    ],
    reflections: [
      "Que alegria pequena eu venho adiando sem necessidade?",
      "O que merece ser celebrado antes que eu siga adiante?",
    ],
    rituals: [
      "Ouça uma música que devolva movimento ao corpo.",
      "Registre três coisas boas do dia sem acrescentar nenhum porém.",
    ],
  },
  {
    energy: "Escolha consciente",
    messages: [
      "Toda escolha organiza energia. Mesmo não decidir já está alimentando uma direção.",
      "Você não precisa conhecer o caminho inteiro para reconhecer qual próximo passo combina com seus valores.",
    ],
    advice: [
      "Escolha pelo que deseja sustentar, não apenas pelo que deseja evitar.",
      "Nomeie o custo de continuar sem decidir.",
      "Use seus valores como critério quando as opções parecerem equivalentes.",
    ],
    affirmations: [
      "Eu participo conscientemente da direção que minha vida toma.",
      "Minhas escolhas podem ser firmes sem serem apressadas.",
    ],
    reflections: [
      "Que valor meu precisa participar desta decisão?",
      "Qual opção preserva melhor a pessoa que quero continuar sendo?",
    ],
    rituals: [
      "Escreva duas opções e, abaixo de cada uma, o valor que ela fortalece.",
      "Caminhe por dez minutos repetindo mentalmente a pergunta que precisa decidir.",
    ],
  },
  {
    energy: "Confiança em construção",
    messages: [
      "Confiança não é ausência de dúvida. É a memória de que você consegue se encontrar mesmo quando o caminho muda.",
      "Hoje, olhe menos para a distância que falta e mais para as provas de que você já sabe caminhar.",
    ],
    advice: [
      "Recupere uma evidência concreta de algo difícil que você já atravessou.",
      "Faça uma promessa pequena a si mesmo e cumpra ainda hoje.",
      "Não use um momento de dúvida como definição permanente da sua capacidade.",
    ],
    affirmations: [
      "Eu construo confiança cumprindo pequenos acordos comigo.",
      "Minha dúvida pode caminhar ao lado da minha capacidade.",
    ],
    reflections: [
      "Que prova da minha força eu esqueço quando fico inseguro?",
      "Qual acordo simples comigo mesmo fortaleceria minha confiança hoje?",
    ],
    rituals: [
      "Liste três situações que você atravessou melhor do que imaginava.",
      "Escolha um acordo possível para hoje e marque um horário para cumpri-lo.",
    ],
  },
  {
    energy: "Expansão com raiz",
    messages: [
      "Crescer não precisa significar se afastar de si. A expansão mais sustentável preserva suas raízes.",
      "Uma oportunidade pode pedir espaço maior sem exigir que você abandone o que considera essencial.",
    ],
    advice: [
      "Dê um passo em direção ao novo sem abandonar sua base.",
      "Antes de aceitar mais, confirme o que precisa continuar protegido.",
      "Permita-se ocupar mais espaço com responsabilidade e presença.",
    ],
    affirmations: [
      "Eu posso crescer sem me perder de mim.",
      "Minha expansão respeita minhas raízes e meus limites.",
    ],
    reflections: [
      "O que preciso preservar enquanto minha vida se expande?",
      "Onde estou pronto para ocupar um espaço maior?",
    ],
    rituals: [
      "Fique de pé, sinta os pés no chão e imagine o corpo ocupando espaço com calma.",
      "Escreva uma oportunidade desejada e três condições que a tornariam sustentável.",
    ],
  },
];

function pickThemePart(
  theme: DailyTheme,
  seed: number,
  key: "messages" | "advice" | "affirmations" | "reflections" | "rituals"
) {
  return pickSeeded(theme[key], seed, key);
}

function pickUniqueCards(seed: number): DailyMessage["spread"] {
  const positions: DailyMessage["spread"][number]["position"][] = [
    "SITUAÇÃO",
    "OBSTÁCULO",
    "DIREÇÃO",
  ];
  const cards = shuffleSeeded(CARDS, hashSeed(`${seed}:spread`)).slice(0, 3);

  return cards.map((card, index) => {
    const reversed = hashSeed(`${seed}:${card.key}:orientation`) % 4 === 0;

    return {
      position: positions[index],
      name: card.name,
      assetPath: card.assetPath,
      reversed,
      keyword: card.keywords[0],
      meaning: reversed ? card.reversed : card.upright,
      coreMeaning: card.guide.core,
      lifeQuestion: card.guide.question,
    };
  });
}

export function getDailyVisitorKey(userKey?: string | null) {
  const normalized = userKey?.trim();
  return normalized ? `u_${hashSeed(normalized).toString(36)}` : "public";
}

export function getDailyMessage(params: {
  dateKey: string;
  timeZone: string;
  visitorKey?: string;
}): DailyMessage {
  const ordinal = getDateOrdinal(params.dateKey);
  const visitorKey = params.visitorKey?.trim() || "public";
  const seed = hashSeed(`palavras:${params.dateKey}:${visitorKey}`);
  const theme =
    DAILY_THEMES[
      hashSeed(`${seed}:${ordinal}:daily-theme`) % DAILY_THEMES.length
    ];

  return {
    energy: theme.energy,
    message: pickThemePart(theme, seed, "messages"),
    advice: pickThemePart(theme, seed, "advice"),
    affirmation: pickThemePart(theme, seed, "affirmations"),
    reflection: pickThemePart(theme, seed, "reflections"),
    ritual: pickThemePart(theme, seed, "rituals"),
    dateKey: params.dateKey,
    timeZone: params.timeZone,
    spread: pickUniqueCards(seed),
  };
}
