import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "Supabase env vars are not configured",
      },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("readings").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          error: "Supabase query failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, configured: true });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: "Supabase request failed",
      },
      { status: 500 }
    );
  }
}
