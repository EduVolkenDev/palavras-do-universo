import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function requireApiUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
    } as const;
  }

  return { user, response: null } as const;
}
