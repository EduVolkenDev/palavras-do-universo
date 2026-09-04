import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

let adminClient: SupabaseClient | null = null;
const DEFAULT_AUTH_TIMEOUT_MS = 8_000;

function getSupabaseServerUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function readBoundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

async function withAuthTimeout<T>(promise: Promise<T>) {
  const timeoutMs = readBoundedNumber(
    process.env.SUPABASE_AUTH_TIMEOUT_MS,
    DEFAULT_AUTH_TIMEOUT_MS,
    2_000,
    15_000
  );
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Supabase auth timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function hasSupabaseConfig() {
  return Boolean(
    getSupabaseServerUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function hasSupabasePublicConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot write cookies. Route handlers and proxy can.
        }
      },
    },
  });
}

export async function getAuthenticatedUser() {
  if (!hasSupabasePublicConfig()) return null;

  const supabase = await getSupabaseServerClient();
  try {
    const {
      data: { user },
    } = await withAuthTimeout(supabase.auth.getUser());

    return user;
  } catch (caught) {
    if (process.env.PDU_AUTH_DEBUG === "1") {
      console.warn(
        "Supabase authenticated user lookup failed:",
        caught instanceof Error ? caught.message : String(caught)
      );
    }
    return null;
  }
}

export function getSupabaseAdmin() {
  const url = getSupabaseServerUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export async function ensureSupabaseProfile(userId: string, email?: string | null) {
  const supabase = getSupabaseAdmin();
  const normalizedEmail =
    typeof email === "string" && email.includes("@")
      ? email.trim().toLowerCase()
      : null;
  const { error } = normalizedEmail
    ? await supabase
        .from("profiles")
        .upsert({ id: userId, email: normalizedEmail }, { onConflict: "id" })
    : await supabase
        .from("profiles")
        .upsert({ id: userId }, { onConflict: "id" });

  if (error) throw error;
}
