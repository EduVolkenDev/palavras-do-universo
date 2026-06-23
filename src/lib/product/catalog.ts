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
