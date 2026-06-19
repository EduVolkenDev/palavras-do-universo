import type { TarotCard } from "./cards";

export type Drawn3 = {
  position: "SITUAÇÃO" | "OBSTÁCULO" | "DIREÇÃO";
  card: TarotCard;
  reversed: boolean;
};

function pickIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export function drawThree(cards: TarotCard[]): Drawn3[] {
  const pool = [...cards];
  const positions: Drawn3["position"][] = ["SITUAÇÃO", "OBSTÁCULO", "DIREÇÃO"];

  return positions.map((position) => {
    const idx = pickIndex(pool.length);
    const card = pool.splice(idx, 1)[0];
    const reversed = Math.random() < 0.25;

    return { position, card, reversed };
  });
}
