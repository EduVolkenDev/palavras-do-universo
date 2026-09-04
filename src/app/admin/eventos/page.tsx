import { notFound, redirect } from "next/navigation";
import EventAdminPage from "@/components/admin/EventAdminPage";
import { buildLoginPath } from "@/lib/auth/redirect";
import { normalizeLocale } from "@/lib/i18n/config";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";

export default async function AdminEventosRoute({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const locale = normalizeLocale((await searchParams)?.lang);

  if (!user) {
    const next = locale === "en" ? "/admin/eventos?lang=en" : "/admin/eventos";
    redirect(buildLoginPath(next, { lang: locale === "en" ? "en" : null }));
  }

  if (!isOwnerAccessUser(user)) {
    notFound();
  }

  return (
    <EventAdminPage
      ownerEmail={user.email ?? ""}
      hasSupabase={hasSupabaseConfig()}
    />
  );
}
