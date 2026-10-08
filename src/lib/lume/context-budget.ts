// Accommodates a complete 16k reading plus metadata for all twelve positions.
export const MAX_LUME_CONTEXT_LENGTH = 40_000;

/** Keep the current reading intact before spending space on older context. */
export function composeLumeContext(activeReading: string, supportingSections: string[]) {
  return [activeReading, ...supportingSections]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_LUME_CONTEXT_LENGTH) ||
    "Nenhum contexto pessoal foi compartilhado nesta pergunta.";
}
