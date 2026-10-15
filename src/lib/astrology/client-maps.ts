import type { AstrologyBirthDataPayload } from "./birth-data";
import type { NatalChart } from "./natal-chart";

export type AstrologyClientMapRecord = {
  id: string;
  studentName: string;
  birthData: AstrologyBirthDataPayload;
  chart: NatalChart;
  consentGrantedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AstrologyClientMapSummary = {
  id: string;
  studentName: string;
  localDate: string;
  locationLabel: string;
  timePrecision: AstrologyBirthDataPayload["precision"];
  createdAt: string;
  updatedAt: string;
};

export function summarizeAstrologyClientMap(
  map: AstrologyClientMapRecord
): AstrologyClientMapSummary {
  return {
    id: map.id,
    studentName: map.studentName,
    localDate: map.birthData.localDate,
    locationLabel: map.birthData.location.label,
    timePrecision: map.birthData.precision,
    createdAt: map.createdAt,
    updatedAt: map.updatedAt,
  };
}
