import { NextResponse } from "next/server";

export async function readJsonBody<T>(request: Request) {
  try {
    return { ok: true as const, body: (await request.json()) as T };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      ),
    };
  }
}
