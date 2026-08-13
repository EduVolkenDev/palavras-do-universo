import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const HERO_MARK_ROTATION = [
  {
    assetPath: "/assets/new-pdu-dock.webp",
    mobileAssetPath: "/assets/pdu-hero-new-dock-mobile.webp",
  },
  {
    assetPath: "/assets/new-pdu-dock3.webp",
    mobileAssetPath: "/assets/pdu-hero-new-dock3-mobile.webp",
  },
  {
    assetPath: "/assets/new-pdu-dock4.webp",
    mobileAssetPath: "/assets/pdu-hero-new-dock4-mobile.webp",
  },
  {
    assetPath: "/assets/new-pdu-dock5.webp",
    mobileAssetPath: "/assets/pdu-hero-new-dock5-mobile.webp",
  },
  {
    assetPath: "/assets/pdu-dock.webp",
    mobileAssetPath: "/assets/pdu-dock-mobile.webp",
  },
  {
    assetPath: "/assets/palavrasuniverso-1600.webp",
    mobileAssetPath: "/assets/palavrasuniverso-mobile.webp",
  },
] as const;

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
