import "server-only";

import type { AstrologyBirthDataPayload } from "./birth-data";
import type { NatalChart } from "./natal-chart";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import {
  summarizeAstrologyClientMap,
  type AstrologyClientMapRecord,
  type AstrologyClientMapSummary,
} from "./client-maps";

const CLIENT_MAP_COLUMNS =
  "id, owner_user_id, student_name, birth_data, chart, consent_granted_at, created_at, updated_at";

type ClientMapRow = {
  id: string;
  owner_user_id: string;
  student_name: string;
  birth_data: AstrologyBirthDataPayload;
  chart: NatalChart;
  consent_granted_at: string;
  created_at: string;
  updated_at: string;
};

function toRecord(row: ClientMapRow): AstrologyClientMapRecord {
  return {
    id: row.id,
    studentName: row.student_name,
    birthData: row.birth_data,
    chart: row.chart,
    consentGrantedAt: row.consent_granted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isAstrologyClientMapStorageAvailable() {
  return hasSupabaseConfig();
}

export async function listAstrologyClientMaps(
  ownerUserId: string
): Promise<AstrologyClientMapSummary[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("astrology_client_maps")
    .select(CLIENT_MAP_COLUMNS)
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return ((data ?? []) as ClientMapRow[]).map((row) =>
    summarizeAstrologyClientMap(toRecord(row))
  );
}

export async function getAstrologyClientMap(
  ownerUserId: string,
  mapId: string
): Promise<AstrologyClientMapRecord | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("astrology_client_maps")
    .select(CLIENT_MAP_COLUMNS)
    .eq("owner_user_id", ownerUserId)
    .eq("id", mapId)
    .maybeSingle();

  if (error) throw error;
  return data ? toRecord(data as ClientMapRow) : null;
}

export async function createAstrologyClientMap(params: {
  ownerUserId: string;
  studentName: string;
  birthData: AstrologyBirthDataPayload;
  chart: NatalChart;
}): Promise<AstrologyClientMapRecord> {
  const { data, error } = await getSupabaseAdmin()
    .from("astrology_client_maps")
    .insert({
      owner_user_id: params.ownerUserId,
      student_name: params.studentName,
      birth_data: params.birthData,
      chart: params.chart,
    })
    .select(CLIENT_MAP_COLUMNS)
    .single();

  if (error) throw error;
  return toRecord(data as ClientMapRow);
}
