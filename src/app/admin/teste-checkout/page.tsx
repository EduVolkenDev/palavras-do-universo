import { notFound, redirect } from "next/navigation";
import InternalCheckoutTestPage from "@/components/admin/InternalCheckoutTestPage";
import { buildLoginPath } from "@/lib/auth/redirect";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";

export default async function InternalCheckoutTestRoute() {
  const user = await getAuthenticatedUser();

  if (!user) redirect(buildLoginPath("/admin/teste-checkout"));
  if (!isOwnerAccessUser(user)) notFound();

  return (
    <InternalCheckoutTestPage
      ownerEmail={user.email ?? ""}
      hasSupabase={hasSupabaseConfig()}
    />
  );
}
