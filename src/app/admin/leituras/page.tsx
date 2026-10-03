import { notFound, redirect } from "next/navigation";
import EduReadingAdminPage from "@/components/admin/EduReadingAdminPage";
import { buildLoginPath } from "@/lib/auth/redirect";
import { normalizeLocale } from "@/lib/i18n/config";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";

export default async function AdminLeiturasRoute({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const locale = normalizeLocale((await searchParams)?.lang);

  if (!user) {
    const next = locale === "en" ? "/admin/leituras?lang=en" : "/admin/leituras";
    redirect(buildLoginPath(next, { lang: locale === "en" ? "en" : null }));
  }

  if (!isOwnerAccessUser(user)) notFound();

  return <EduReadingAdminPage ownerEmail={user.email ?? ""} hasSupabase={hasSupabaseConfig()} />;
}
