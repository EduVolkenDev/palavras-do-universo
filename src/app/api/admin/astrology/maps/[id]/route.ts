import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  getAstrologyClientMap,
  isAstrologyClientMapStorageAvailable,
} from "@/lib/astrology/client-maps-server";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  if (!isOwnerAccessUser(auth.user)) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404, headers: PRIVATE_HEADERS });
  }
  if (!isAstrologyClientMapStorageAvailable()) {
    return NextResponse.json(
      { error: "Map storage is not configured", code: "MAP_STORAGE_UNAVAILABLE" },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404, headers: PRIVATE_HEADERS });
  }

  try {
    const map = await getAstrologyClientMap(auth.user.id, id);
    if (!map) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404, headers: PRIVATE_HEADERS });
    }
    return NextResponse.json({ ok: true, map }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Unable to load owner astrology map", error);
    return NextResponse.json(
      { error: "Saved map is temporarily unavailable", code: "MAP_STORAGE_UNAVAILABLE" },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }
}
