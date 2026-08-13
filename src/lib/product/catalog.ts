export type ProductCard = {
  productKey: string;
  title: string;
  archetype: string;
  promise: string;
  transformation: string;
  cta: string;
  mode: "daily" | "free" | "paid" | "included";
  price?: string;
  bestFor: string;
  notFor: string;
  href?: string;
};

export type PricingPlan = {
  productKey?: string;
  targetId?: "leitura" | "produtos";
  title: string;
  price: string;
  cadence: string;
  bestFor: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const productCards: ProductCard[] = [
  {
    productKey: "mensagem_do_dia",
    title: "Mensagem do Dia",
    archetype: "Ritual de entrada",
    promise: "Uma palavra para abrir o dia com presença, beleza e direção.",
    transformation: "De sensação solta para um gesto interno simples.",
    cta: "Receber agora",
    mode: "daily",
    bestFor: "Começar sem peso e perceber o próprio clima emocional.",
    notFor: "Perguntas complexas ou decisões que pedem contexto.",
  },
  {
    productKey: "carta_do_dia",
    title: "Carta do Dia",
    archetype: "Espelho do dia",
    promise: "Uma carta para iluminar as próximas 24 horas sem virar sentença.",
    transformation: "De curiosidade para um símbolo que organiza o agora.",
    cta: "Tirar minha carta",
    mode: "free",
    bestFor: "Reflexão rápida com imagem, arquétipo, conselho e ritual.",
    notFor: "Decisões grandes que precisam de leitura mais profunda.",
    href: "/carta-do-dia",
  },
  {
    productKey: "clareza_urgente",
    title: "Clareza Urgente",
    archetype: "Eixo agora",
    promise: "Uma leitura premium para respirar, entender o que pesa e escolher o próximo passo hoje.",
    transformation: "De urgência emocional para eixo, limite e ação possível.",
    cta: "Quero clareza agora",
    mode: "paid",
    price: "R$19,90",
    bestFor: "Momentos de dúvida forte, conversa difícil ou decisão que não pode esperar.",
    notFor: "Risco físico imediato, emergência médica ou promessa sobre outra pessoa.",
  },
  {
    productKey: "caminho_3_cartas",
    title: "Caminho das 3 Cartas",
    archetype: "Clareza para decisão",
    promise: "Situação, sombra e direção para uma pergunta real.",
    transformation: "De pergunta confusa para próximo passo honesto.",
    cta: "Fazer leitura",
    mode: "paid",
    price: "R$9,90",
    bestFor: "Uma dúvida concreta que pede firmeza sem pressa.",
    notFor: "Acompanhamento contínuo ou histórico profundo.",
  },
  {
    productKey: "sinais_do_amor",
    title: "Sinais do Amor",
    archetype: "Inteligência afetiva",
    promise: "Clareza para sentimentos, vínculos e escolhas afetivas.",
    transformation: "De ansiedade afetiva para leitura madura do desejo.",
    cta: "Consultar amor",
    mode: "paid",
    price: "R$12,90",
    bestFor: "Dúvidas afetivas, limites, conversas e padrões emocionais.",
    notFor: "Promessas de volta, controle do outro ou garantias.",
  },
  {
    productKey: "tirada_diamante",
    title: "O Diamante",
    archetype: "Clareza prismática",
    promise: "Cinco cartas para enxergar uma questão por dentro, por fora e no ponto onde tudo se integra.",
    transformation: "De confusão em camadas para uma decisão mais nítida.",
    cta: "Conhecer O Diamante",
    mode: "included",
    bestFor: "Uma pergunta importante que pede contexto antes de conclusão.",
    notFor: "Quem busca uma resposta instantânea ou uma previsão fechada.",
    href: "/tiradas/diamante",
  },
  {
    productKey: "passaro_voando",
    title: "O Pássaro Voando",
    archetype: "Movimento com altitude",
    promise: "Sete cartas para transformar medo, receptividade e ação em uma direção viva.",
    transformation: "De paralisia ou excesso de controle para voo possível.",
    cta: "Conhecer o Pássaro",
    mode: "included",
    bestFor: "Transições, recomeços e momentos em que uma parte sua quer avançar.",
    notFor: "Decisões que precisam ser tomadas no impulso.",
    href: "/tiradas/passaro-voando",
  },
  {
    productKey: "a_chave",
    title: "A Chave",
    archetype: "Abertura interior",
    promise: "Oito cartas para dar linguagem ao que estava escondido e encontrar uma fresta de escolha.",
    transformation: "De padrão sem nome para compreensão que abre passagem.",
    cta: "Conhecer A Chave",
    mode: "included",
    bestFor: "Questões que se repetem, travas internas e mudanças que pedem profundidade.",
    notFor: "Substituir cuidado psicológico ou buscar diagnóstico.",
    href: "/tiradas/a-chave",
  },
  {
    productKey: "o_espelho",
    title: "O Espelho",
    archetype: "Reflexo relacional",
    promise: "Doze cartas para observar vínculo, projeção, necessidade e limite sem se perder no outro.",
    transformation: "De ansiedade relacional para uma leitura mais madura do encontro.",
    cta: "Conhecer O Espelho",
    mode: "included",
    bestFor: "Relações importantes, conversas difíceis e padrões afetivos recorrentes.",
    notFor: "Descobrir ou controlar o que outra pessoa sente.",
    href: "/tiradas/o-espelho",
  },
  {
    productKey: "cruz_celta",
    title: "Cruz Celta",
    archetype: "Mapa amplo",
    promise: "Dez cartas para olhar uma questão inteira — raízes, tensão, campo, horizonte e integração.",
    transformation: "De situação grande demais para um mapa que revela prioridade.",
    cta: "Conhecer a Cruz Celta",
    mode: "included",
    bestFor: "Fases complexas, decisões de vida e perguntas que envolvem mais de uma camada.",
    notFor: "Perguntas simples que uma leitura curta já resolve.",
    href: "/tiradas/cruz-celta",
  },
  {
    productKey: "relacionar",
    title: "Relacionar",
    archetype: "Vínculo consciente",
    promise: "Quatro cartas para enxergar o encontro entre duas pessoas com mais verdade e menos projeção.",
    transformation: "De suposição afetiva para presença, conversa e limite.",
    cta: "Conhecer Relacionar",
    mode: "included",
    bestFor: "Um vínculo que pede clareza sem transformar a outra pessoa em resposta.",
    notFor: "Promessas sobre futuro ou comportamento do outro.",
    href: "/tiradas/relacionar",
  },
  {
    productKey: "o_paradoxo",
    title: "O Paradoxo",
    archetype: "Integração de contrários",
    promise: "Cinco cartas para acolher uma contradição e encontrar um terceiro caminho mais verdadeiro.",
    transformation: "De escolha binária para compreensão mais ampla.",
    cta: "Conhecer O Paradoxo",
    mode: "included",
    bestFor: "Ambivalências, encruzilhadas e momentos em que duas verdades parecem competir.",
    notFor: "Terceirizar uma decisão que só você pode tomar.",
    href: "/tiradas/o-paradoxo",
  },
  {
    productKey: "energia_da_semana",
    title: "Energia da Semana",
    archetype: "Ciclo semanal",
    promise: "Um guia para atravessar os próximos dias com presença.",
    transformation: "De semana dispersa para foco emocional e prioridade.",
    cta: "Incluído no Círculo",
    mode: "included",
    bestFor: "Planejar energia, limites e movimentos da semana.",
    notFor: "Resolver uma pergunta urgente agora.",
  },
  {
    productKey: "mapa_do_momento",
    title: "Mapa do Momento",
    archetype: "Mapa de fase",
    promise: "Um retrato simbólico da fase que você está vivendo.",
    transformation: "De sensação de estar perdido para leitura de contexto.",
    cta: "Incluído no Círculo",
    mode: "included",
    bestFor: "Entender padrões, repetições e direção de vida agora.",
    notFor: "Resposta objetiva imediata.",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    title: "Gratuito",
    price: "R$0",
    cadence: "para começar",
    bestFor: "Conhecer a linguagem e criar o hábito.",
    features: [
      "Mensagem diária",
      "Carta do dia",
      "Histórico limitado",
      "Uma leitura gratuita por dia",
    ],
    cta: "Experimentar gratuitamente",
    targetId: "leitura",
  },
  {
    title: "Leituras avulsas",
    price: "R$9,90",
    cadence: "a partir de",
    bestFor: "Resolver uma questão específica sem iniciar uma assinatura.",
    features: [
      "Pagamento único",
      "Opções para amor e decisões",
      "Clareza Urgente quando não pode esperar",
      "Resultado disponível no Meu Universo",
    ],
    cta: "Escolher minha leitura",
    targetId: "produtos",
  },
  {
    productKey: "circulo_do_universo",
    title: "Círculo do Universo",
    price: "R$29,90",
    cadence: "por mês",
    bestFor: "Transformar orientação em jornada pessoal, com memória e ritual.",
    features: [
      "Leitura do Círculo incluída",
      "7 tiradas especiais com experiências próprias",
      "Clareza para amor, decisões e ciclos",
      "Energia da semana e mapa do momento",
      "Histórico vivo para reconhecer padrões",
      "Diário simbólico e rituais de integração",
    ],
    cta: "Entrar no Círculo",
    highlighted: true,
  },
];

export const articleIdeas = [
  "Tarot como ferramenta de reflexão",
  "Como criar um ritual de manhã",
  "O que a Carta do Dia pode revelar",
  "Energia da semana sem fatalismo",
];
