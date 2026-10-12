import { notFound, redirect } from "next/navigation";
import AstrologyMapAdminPage from "@/components/admin/AstrologyMapAdminPage";
import { buildLoginPath } from "@/lib/auth/redirect";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Criar mapas | Administração | Palavras do Universo",
  robots: "noindex, nofollow",
};

export default async function AdminAstrologyMapsRoute() {
  const user = await getAuthenticatedUser();

  if (!user) redirect(buildLoginPath("/admin/mapas"));
  if (!isOwnerAccessUser(user)) notFound();

  return <AstrologyMapAdminPage ownerEmail={user.email ?? ""} />;
}
