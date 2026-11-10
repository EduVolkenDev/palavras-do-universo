import { reportSupabaseFailure } from "@/lib/supabase/diagnostics";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

async function checkSupabase() {
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
    const { error } = await supabase.from("readings").select("id").limit(0);

    if (error) {
      const { incidentId, status } = reportSupabaseFailure("health.supabase", error);
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          error: "Supabase query failed",
          incidentId,
        },
        { status }
      );
    }

    return NextResponse.json({ ok: true, configured: true });
  } catch (error) {
    const { incidentId, status } = reportSupabaseFailure("health.supabase", error);
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: "Supabase request failed",
        incidentId,
      },
      { status }
    );
  }
}

export async function GET() {
  const response = await checkSupabase();
  response.headers.set("Cache-Control", "no-store");
  return response;
}
