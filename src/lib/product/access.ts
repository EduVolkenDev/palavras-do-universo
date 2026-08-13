export const PRODUCT_THEMES: Record<string, string> = {
  clareza_urgente: "spirit",
  caminho_3_cartas: "spirit",
  sinais_do_amor: "love",
  energia_da_semana: "spirit",
  mapa_do_momento: "spirit",
  circulo_do_universo: "spirit",
  tirada_diamante: "spirit",
  passaro_voando: "spirit",
  a_chave: "emotional",
  o_espelho: "love",
  cruz_celta: "spirit",
  relacionar: "love",
  o_paradoxo: "spirit",
};

export const PRODUCT_DEFAULT_QUESTIONS: Record<string, string> = {
  clareza_urgente:
    "O que eu preciso entender agora para recuperar meu eixo e escolher o próximo passo com segurança?",
  caminho_3_cartas: "O que eu preciso enxergar sobre o meu momento agora?",
  sinais_do_amor: "Que verdade emocional eu preciso acolher com maturidade?",
  energia_da_semana: "Que energia pede presença nos próximos dias?",
  mapa_do_momento: "Que fase eu estou atravessando e qual direção pede cuidado?",
  circulo_do_universo:
    "O que a minha jornada está tentando me mostrar agora, e qual cuidado eu devo registrar no meu universo?",
  tirada_diamante:
    "Que clareza essa questão pede de mim antes que eu tente decidir?",
  passaro_voando:
    "O que em mim está pronto para ganhar movimento e como posso atravessar o medo com presença?",
  a_chave:
    "Que padrão eu preciso compreender para abrir uma nova possibilidade neste momento?",
  o_espelho:
    "O que este encontro revela sobre mim, sobre o vínculo e sobre o limite que preciso honrar?",
  cruz_celta:
    "Que forças estão moldando esta fase e qual direção merece minha prioridade agora?",
  relacionar:
    "Como posso participar deste vínculo com mais verdade, presença e respeito pelos meus limites?",
  o_paradoxo:
    "Que contradição estou vivendo e qual novo olhar pode nascer entre essas duas verdades?",
};

export const PAID_READING_PRODUCTS = new Set([
  "clareza_urgente",
  "caminho_3_cartas",
  "sinais_do_amor",
  "energia_da_semana",
  "mapa_do_momento",
  "circulo_do_universo",
  "tirada_diamante",
  "passaro_voando",
  "a_chave",
  "o_espelho",
  "cruz_celta",
  "relacionar",
  "o_paradoxo",
]);

export function isPaidReadingProduct(productKey: string) {
  return PAID_READING_PRODUCTS.has(productKey);
}
