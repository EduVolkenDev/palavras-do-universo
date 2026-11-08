import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { buildLoginPathWithError, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "email", "signup", "magiclink", "recovery", "invite", "email_change",
]);

function redirectToLoginWithError(url: URL, error: string, next: string) {
  return NextResponse.redirect(
    new URL(buildLoginPathWithError(error, next), url.origin)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const recoveryPath = "/entrar?mode=reset-password";
  const next = sanitizeAuthRedirect(
    url.searchParams.get("next"),
    type === "recovery" ? recoveryPath : undefined
  );

  // Supabase sends errors in query parameters if confirmation has failed.
  if (url.searchParams.has("error") || url.searchParams.has("error_code")) {
    return redirectToLoginWithError(url, "link-invalido", next);
  }

  if (!code && !(tokenHash && type && ALLOWED_OTP_TYPES.has(type as EmailOtpType))) {
    return redirectToLoginWithError(url, "missing-code", next);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: type as EmailOtpType,
        });

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }

    console.error("[auth/callback] confirmation failed", {
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
