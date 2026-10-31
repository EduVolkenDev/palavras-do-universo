import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PDU_ASSETS } from "@/lib/pdu-assets";

const HERO_MARK_ROTATION = PDU_ASSETS.brand.heroMarkRotation;

export function GET(request: NextRequest) {
  const isMobile = request.nextUrl.searchParams.get("surface") === "mobile";
  const marks = isMobile
    ? HERO_MARK_ROTATION.map((candidate) => ({
        assetPath: candidate.mobileAssetPath,
      }))
    : HERO_MARK_ROTATION.map((candidate) => ({
        assetPath: candidate.assetPath,
        mobileAssetPath: candidate.mobileAssetPath,
      }));

  return NextResponse.json({ marks });
}
