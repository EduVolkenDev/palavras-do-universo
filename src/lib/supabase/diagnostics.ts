type FailureKind = "configuration" | "credentials" | "schema" | "permission" | "network" | "unexpected";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase configuration is inconsistent");
    this.name = "SupabaseConfigurationError";
  }
}

export function classifySupabaseFailure(error: unknown): FailureKind {
  if (error instanceof SupabaseConfigurationError) return "configuration";
  const candidate = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const message = typeof candidate.message === "string" ? candidate.message : "";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  if (/wrong api key|invalid api key|invalid api_key/i.test(message) || candidate.status === 401) return "credentials";
  if (["42P01", "42703", "PGRST205", "PGRST204"].includes(code)) return "schema";
  if (code === "42501" || candidate.status === 403) return "permission";
  if (/fetch failed|timeout|timed out|network|abort/i.test(message)) return "network";
  return "unexpected";
}

// Never serialize upstream errors: their messages/details can contain user data or credentials.
export function reportSupabaseFailure(operation: string, error: unknown) {
  const kind = classifySupabaseFailure(error);
  const incidentId = crypto.randomUUID();
  console.error(JSON.stringify({ event: "supabase_operation_failed", operation, kind, incidentId }));
  return { incidentId, status: kind === "unexpected" ? 500 : 503 };
}

export function validateSupabaseAdminConfig(url: string, key: string, publicUrl?: string) {
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error();
    if (publicUrl && new URL(publicUrl).origin !== parsed.origin) throw new Error();
    if (key.startsWith("sb_secret_")) return;
    // Only a consistency check; Supabase still authenticates the key on every request.
    const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role !== "service_role") throw new Error();
    if (parsed.hostname.endsWith(".supabase.co") && payload.ref !== parsed.hostname.split(".")[0]) throw new Error();
  } catch {
    throw new SupabaseConfigurationError();
  }
}
