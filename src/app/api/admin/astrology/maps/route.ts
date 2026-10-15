import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { validateAstrologyBirthData } from "@/lib/astrology/birth-data";
import { calculateNatalChart } from "@/lib/astrology/natal-chart";
import {
  createAstrologyClientMap,
  isAstrologyClientMapStorageAvailable,
  listAstrologyClientMaps,
} from "@/lib/astrology/client-maps-server";
import { summarizeAstrologyClientMap } from "@/lib/astrology/client-maps";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found", code: "NOT_FOUND" },
    { status: 404, headers: PRIVATE_HEADERS }
  );
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!isOwnerAccessUser(auth.user)) return notFoundResponse();
  if (!isAstrologyClientMapStorageAvailable()) {
    return NextResponse.json(
      { error: "Map storage is not configured", code: "MAP_STORAGE_UNAVAILABLE" },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  try {
    const maps = await listAstrologyClientMaps(auth.user.id);
    return NextResponse.json({ ok: true, maps }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Unable to list owner astrology maps", error);
    return NextResponse.json(
      { error: "Saved maps are temporarily unavailable", code: "MAP_STORAGE_UNAVAILABLE" },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!isOwnerAccessUser(auth.user)) return notFoundResponse();
  if (!isAstrologyClientMapStorageAvailable()) {
    return NextResponse.json(
      { error: "Map storage is not configured", code: "MAP_STORAGE_UNAVAILABLE" },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  const parsed = await readJsonBody<{
    studentName?: unknown;
    birthData?: unknown;
    consent?: unknown;
  }>(request);
  if (!parsed.ok) return parsed.response;

  const studentName =
    typeof parsed.body?.studentName === "string"
      ? parsed.body.studentName.trim().slice(0, 160)
      : "";
  if (!studentName) {
    return NextResponse.json(
      { error: "Student name is required", code: "STUDENT_NAME_REQUIRED" },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }
  if (parsed.body?.consent !== true) {
    return NextResponse.json(
      { error: "Explicit consent is required before saving a client map", code: "MAP_SAVE_CONSENT_REQUIRED" },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  const validation = validateAstrologyBirthData(parsed.body?.birthData);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid astrology birth data", code: "INVALID_ASTROLOGY_BIRTH_DATA", details: validation.errors },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  try {
    const chart = calculateNatalChart(validation.data);
    const map = await createAstrologyClientMap({
      ownerUserId: auth.user.id,
      studentName,
      birthData: validation.data,
      chart,
    });
    return NextResponse.json(
      { ok: true, map, summary: summarizeAstrologyClientMap(map) },
      { headers: PRIVATE_HEADERS }
    );
  } catch (error) {
    console.error("Unable to save owner astrology map", error);
    return NextResponse.json(
      { error: "Saved maps are temporarily unavailable", code: "MAP_STORAGE_UNAVAILABLE" },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }
}
