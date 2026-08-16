import { notFound, redirect } from "next/navigation";
import FeedbackAdminPage from "@/components/admin/FeedbackAdminPage";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { normalizeLocale } from "@/lib/i18n/config";

export default async function AdminFeedbackRoute({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const locale = normalizeLocale((await searchParams)?.lang);

  if (!user) {
    const next = locale === "en" ? "/admin/feedback?lang=en" : "/admin/feedback";
    redirect(`/entrar?next=${encodeURIComponent(next)}${locale === "en" ? "&lang=en" : ""}`);
  }

  if (!isOwnerAccessUser(user)) {
    notFound();
  }

  return (
    <FeedbackAdminPage
      ownerEmail={user.email ?? ""}
      hasSupabase={hasSupabaseConfig()}
    />
  );
}
