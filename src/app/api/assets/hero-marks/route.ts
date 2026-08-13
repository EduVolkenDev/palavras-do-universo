import { access, stat } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PDU_ASSETS } from "@/lib/pdu-assets";

const PUBLIC_DIR = join(process.cwd(), "public");
const MOBILE_SAFE_MAX_BYTES = 450 * 1024;

function getSafeAssetFilePath(assetPath: string) {
  if (!assetPath.startsWith("/assets/") || assetPath.includes("..")) {
    return null;
  }

  return join(PUBLIC_DIR, assetPath.slice(1));
}

async function assetExists(assetPath: string) {
  const filePath = getSafeAssetFilePath(assetPath);
  if (!filePath) return false;

  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assetSize(assetPath: string) {
  const filePath = getSafeAssetFilePath(assetPath);
  if (!filePath) return Number.POSITIVE_INFINITY;

  try {
    const file = await stat(filePath);
    return file.size;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export async function GET(request: NextRequest) {
  const isMobile = request.nextUrl.searchParams.get("surface") === "mobile";
  const marks = [];

  for (const candidate of PDU_ASSETS.brand.heroMarkRotation) {
    if (!(await assetExists(candidate.assetPath))) continue;

    const candidateMobileAssetPath =
      "mobileAssetPath" in candidate ? candidate.mobileAssetPath : undefined;
    const mobileAssetPath =
      candidateMobileAssetPath && (await assetExists(candidateMobileAssetPath))
        ? candidateMobileAssetPath
        : undefined;

    if (isMobile && !mobileAssetPath) {
      const size = await assetSize(candidate.assetPath);
      if (size > MOBILE_SAFE_MAX_BYTES) continue;
    }

    if (isMobile) {
      marks.push({
        assetPath: mobileAssetPath ?? candidate.assetPath,
      });
      continue;
    }

    marks.push({
      assetPath: candidate.assetPath,
      ...(mobileAssetPath ? { mobileAssetPath } : {}),
    });
  }

  return NextResponse.json({ marks });
}
