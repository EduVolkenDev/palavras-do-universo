import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const MAX_MUTATION_BODY_BYTES = 128 * 1024;
const LARGE_MUTATION_BODY_BYTES = 600 * 1024;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function mutationBodyLimit(pathname: string) {
  return pathname === "/api/account/sync-local"
    ? LARGE_MUTATION_BODY_BYTES
    : MAX_MUTATION_BODY_BYTES;
}

function allowedOrigins(request: NextRequest) {
  const origins = new Set([request.nextUrl.origin]);
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const currentUrl = new URL(request.nextUrl.origin);

  if (configured) {
    try {
      origins.add(new URL(configured).origin);
    } catch {
      // Invalid production configuration is reported by the commerce health check.
    }
  }

  if (
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(currentUrl.hostname)
  ) {
    const port = currentUrl.port ? `:${currentUrl.port}` : "";
    origins.add(`http://localhost${port}`);
    origins.add(`http://127.0.0.1${port}`);
    origins.add(`http://[::1]${port}`);
  }

  return origins;
}

async function refreshSupabaseSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export async function proxy(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");
  const isWebhook = request.nextUrl.pathname === "/api/stripe/webhook";

  if (!isApiRequest || SAFE_METHODS.has(request.method) || isWebhook) {
    return refreshSupabaseSession(request);
  }

  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins(request).has(origin)) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  const bodyLimit = mutationBodyLimit(request.nextUrl.pathname);
  if (Number.isFinite(contentLength) && contentLength > bodyLimit) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (contentLength > 0 && !contentType.startsWith("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 }
    );
  }

  return refreshSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml)$).*)",
  ],
};
