import { notFound, redirect } from "next/navigation";
import FeedbackAdminPage from "@/components/admin/FeedbackAdminPage";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";

export default async function AdminFeedbackRoute() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/entrar?next=/admin/feedback");
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
