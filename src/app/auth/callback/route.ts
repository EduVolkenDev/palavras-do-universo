import { NextResponse } from "next/server";
import { buildLoginPathWithError, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function redirectToLoginWithError(url: URL, error: string, next: string) {
  return NextResponse.redirect(
    new URL(buildLoginPathWithError(error, next), url.origin)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeAuthRedirect(url.searchParams.get("next"));

  if (!code) {
    return redirectToLoginWithError(url, "missing-code", next);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }

    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
    });
  } catch (error) {
    console.error("[auth/callback] session exchange threw", {
      message: error instanceof Error ? error.message : "Unknown auth callback error",
    });
  }

  return redirectToLoginWithError(url, "link-invalido", next);
}
