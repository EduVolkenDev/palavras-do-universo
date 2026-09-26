import type { NatalChart } from "./natal-chart";

export function chartForAstrologyAccess(chart: NatalChart, fullAccess: boolean): NatalChart {
  if (fullAccess) return chart;

  return {
    ...chart,
    positions: chart.positions
      .filter((position) => position.body === "Sun" || position.body === "Moon")
      .map((position) => ({ ...position, house: null })),
    aspects: [],
  };
}
