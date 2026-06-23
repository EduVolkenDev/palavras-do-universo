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

export function proxy(request: NextRequest) {
  if (SAFE_METHODS.has(request.method) || request.nextUrl.pathname === "/api/stripe/webhook") {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
