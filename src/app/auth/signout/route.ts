import { NextResponse } from "next/server";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const next = sanitizeAuthRedirect(url.searchParams.get("next"), "/entrar");

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[auth/signout] signOut failed", {
      message: error instanceof Error ? error.message : "Unknown sign out error",
    });
  }

  const redirectUrl = new URL(next, url.origin);
  redirectUrl.searchParams.set("signed_out", "1");

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
