import { NextResponse } from "next/server";
import { LocationProviderError, resolveAstrologyLocation } from "@/lib/astrology/location";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { label?: unknown; countryCode?: unknown; consent?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ errorCode: "invalid-request", error: "Invalid location request." }, { status: 400 });
  }

  if (body.consent !== true) {
    return NextResponse.json({ errorCode: "consent-required", error: "Explicit consent is required." }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim().toLowerCase() : "";
  if (label.length < 2 || label.length > 120) {
    return NextResponse.json({ errorCode: "invalid-location", error: "A location is required." }, { status: 400 });
  }
  if (!/^[a-z]{2}$/.test(countryCode)) {
    return NextResponse.json({ errorCode: "invalid-country", error: "A two-letter country code is required." }, { status: 400 });
  }

  try {
    const candidates = await resolveAstrologyLocation({ label, countryCode });
    return NextResponse.json({ candidates }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const errorCode = error instanceof LocationProviderError && error.reason === "rate-limit" ? "rate-limit" : "upstream";
    const message = errorCode === "rate-limit" ? "Please wait before searching again." : "The map service is unavailable.";
    return NextResponse.json({ errorCode, error: message }, { status: errorCode === "rate-limit" ? 429 : 502 });
  }
}
