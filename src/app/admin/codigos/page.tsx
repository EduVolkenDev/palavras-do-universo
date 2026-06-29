import { redirect, notFound } from "next/navigation";
import VoucherAdminPage from "@/components/admin/VoucherAdminPage";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";

export default async function AdminCodigosPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/entrar?next=/admin/codigos");
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
