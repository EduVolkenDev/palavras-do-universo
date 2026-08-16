import { redirect, notFound } from "next/navigation";
import VoucherAdminPage from "@/components/admin/VoucherAdminPage";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { normalizeLocale } from "@/lib/i18n/config";

export default async function AdminCodigosPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const locale = normalizeLocale((await searchParams)?.lang);

  if (!user) {
    const next = locale === "en" ? "/admin/codigos?lang=en" : "/admin/codigos";
    redirect(`/entrar?next=${encodeURIComponent(next)}${locale === "en" ? "&lang=en" : ""}`);
  }

  if (!isOwnerAccessUser(user)) {
    notFound();
  }

  return (
    <VoucherAdminPage
      ownerEmail={user.email ?? ""}
      hasSupabase={hasSupabaseConfig()}
    />
  );
}
