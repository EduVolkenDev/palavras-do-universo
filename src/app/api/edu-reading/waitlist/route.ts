import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

type WaitlistBody = {
  email?: unknown;
  locale?: unknown;
  website?: unknown;
};

function normalizeEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizeLocale(value: unknown) {
  return String(value ?? "").trim().toLowerCase().startsWith("en") ? "en" : "pt-BR";
}

function code(code: string, status: number) {
  return NextResponse.json({ code }, { status });
}

export async function POST(request: Request) {
  const allowed = await checkRateLimit({
    request,
    scope: "edu-reading-waitlist",
    limit: 5,
    windowMs: 60 * 60 * 1000,
    strict: true,
  });
  if (!allowed) return code("RATE_LIMITED", 429);

  if (!hasSupabaseConfig()) return code("WAITLIST_UNAVAILABLE", 503);

  const parsed = await readJsonBody<WaitlistBody>(request);
  if (!parsed.ok) return code("INVALID_PAYLOAD", 400);

  // A hidden field absorbs unsophisticated bots without storing their input.
  if (String(parsed.body.website ?? "").trim()) return NextResponse.json({ ok: true });

  const email = normalizeEmail(parsed.body.email);
  if (!email) return code("INVALID_EMAIL", 400);

  const { error } = await getSupabaseAdmin()
    .from("edu_reading_waitlist")
    .upsert(
      {
        email,
        locale: normalizeLocale(parsed.body.locale),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) return code("WAITLIST_UNAVAILABLE", 503);

  // Do not distinguish a new address from an existing one.
  return NextResponse.json({ ok: true }, { status: 201 });
}
