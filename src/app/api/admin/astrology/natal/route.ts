import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { calculateNatalChart } from "@/lib/astrology/natal-chart";
import { validateAstrologyBirthData } from "@/lib/astrology/birth-data";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (!isOwnerAccessUser(auth.user)) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const parsed = await readJsonBody<{
    birthData?: unknown;
    consent?: unknown;
  }>(request);
  if (!parsed.ok) return parsed.response;

  if (parsed.body?.consent !== true) {
    return NextResponse.json(
      { error: "Explicit consent is required before calculating a client map", code: "MAP_CALCULATION_CONSENT_REQUIRED" },
      { status: 400 },
    );
  }

  const validation = validateAstrologyBirthData(parsed.body?.birthData);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid astrology birth data", code: "INVALID_ASTROLOGY_BIRTH_DATA", details: validation.errors },
      { status: 400 },
    );
  }

  try {
    const chart = calculateNatalChart(validation.data);
    return NextResponse.json(
      { ok: true, chart, persisted: false },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to calculate owner astrology chart", error);
    return NextResponse.json(
      { error: "Astrology chart is unavailable", code: "ASTROLOGY_CHART_UNAVAILABLE" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
