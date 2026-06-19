export const PRODUCT_THEMES: Record<string, string> = {
  clareza_urgente: "spirit",
  caminho_3_cartas: "spirit",
  sinais_do_amor: "love",
  energia_da_semana: "spirit",
  mapa_do_momento: "spirit",
  circulo_do_universo: "spirit",
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
};

export const PAID_READING_PRODUCTS = new Set([
  "clareza_urgente",
  "caminho_3_cartas",
  "sinais_do_amor",
  "energia_da_semana",
  "mapa_do_momento",
  "circulo_do_universo",
]);

export function isPaidReadingProduct(productKey: string) {
  return PAID_READING_PRODUCTS.has(productKey);
}
