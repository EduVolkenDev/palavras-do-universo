import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const MAX_TESTIMONIALS = 6;

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ testimonials: [] });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("site_feedback")
    .select("id, created_at, resonance_score, message, display_name")
    .eq("status", "published")
    .eq("allow_testimonial", true)
    .order("created_at", { ascending: false })
    .limit(MAX_TESTIMONIALS);

  if (error) {
    return NextResponse.json({ testimonials: [] }, { status: 500 });
  }

  const testimonials = (data ?? []).map((feedback) => ({
    id: feedback.id,
    name: feedback.display_name?.trim() || "Pessoa da comunidade",
    location: "Experiência compartilhada",
    stars: Math.min(5, Math.max(1, feedback.resonance_score ?? 5)),
    text: feedback.message,
  }));

  return NextResponse.json(
    { testimonials },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
