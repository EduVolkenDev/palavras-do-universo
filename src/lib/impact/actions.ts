export type ImpactArea = "self" | "relationships" | "community" | "planet";

export type ImpactAction = {
  key: string;
  area: ImpactArea;
  title: string;
  description: string;
  suggestedPlan: string;
};

export const IMPACT_ACTIONS: ImpactAction[] = [
  {
    key: "escutar_com_presenca",
    area: "relationships",
    title: "Escutar alguém com presença",
    description:
      "Convide alguém para conversar e ofereça pelo menos vinte minutos de escuta sem interromper ou tentar resolver tudo.",
    suggestedPlan: "Hoje, vou escolher uma pessoa e oferecer vinte minutos de escuta.",
  },
  {
    key: "mensagem_de_cuidado",
    area: "relationships",
    title: "Enviar uma mensagem de cuidado",
    description:
      "Procure alguém que pode estar atravessando um momento difícil e envie uma mensagem sincera, sem exigir resposta.",
    suggestedPlan: "Hoje, vou escrever para alguém que precisa saber que não está sozinho.",
  },
  {
    key: "ajuda_com_habilidade",
    area: "community",
    title: "Compartilhar uma habilidade",
    description:
      "Use algo que você sabe fazer para facilitar uma tarefa, ensinar ou orientar alguém sem cobrar nada.",
    suggestedPlan: "Hoje, vou oferecer uma habilidade minha para ajudar uma pessoa.",
  },
  {
    key: "cuidar_do_espaco_comum",
    area: "community",
    title: "Cuidar de um espaço compartilhado",
    description:
      "Melhore um pequeno espaço usado por outras pessoas: organize, limpe, repare ou deixe mais acolhedor.",
    suggestedPlan: "Hoje, vou melhorar um espaço que também serve a outras pessoas.",
  },
  {
    key: "reduzir_desperdicio",
    area: "planet",
    title: "Evitar um desperdício concreto",
    description:
      "Escolha uma forma específica de reduzir desperdício de alimento, água, energia ou materiais ainda hoje.",
    suggestedPlan: "Hoje, vou identificar e evitar um desperdício concreto.",
  },
  {
    key: "resolver_pendencia",
    area: "self",
    title: "Resolver uma pendência que pesa",
    description:
      "Conclua uma pequena pendência que está consumindo energia ou afetando outra pessoa.",
    suggestedPlan: "Hoje, vou dedicar vinte minutos a uma pendência que precisa terminar.",
  },
];

export const IMPACT_AREA_LABELS: Record<ImpactArea, string> = {
  self: "Cuidado pessoal",
  relationships: "Relações",
  community: "Comunidade",
  planet: "Planeta",
};

export function getImpactAction(actionKey: string) {
  return IMPACT_ACTIONS.find((action) => action.key === actionKey) ?? null;
}

const THEME_ACTION_KEYS: Record<string, string[]> = {
  love: ["escutar_com_presenca", "mensagem_de_cuidado", "resolver_pendencia"],
  family: ["escutar_com_presenca", "mensagem_de_cuidado", "cuidar_do_espaco_comum"],
  career: ["ajuda_com_habilidade", "resolver_pendencia", "reduzir_desperdicio"],
  money: ["resolver_pendencia", "ajuda_com_habilidade", "reduzir_desperdicio"],
  spirit: ["mensagem_de_cuidado", "cuidar_do_espaco_comum", "reduzir_desperdicio"],
};

export function getRecommendedImpactActions(theme: string) {
  const recommended = new Set(THEME_ACTION_KEYS[theme] ?? []);
  return [...IMPACT_ACTIONS].sort(
    (a, b) => Number(recommended.has(b.key)) - Number(recommended.has(a.key))
  );
}
