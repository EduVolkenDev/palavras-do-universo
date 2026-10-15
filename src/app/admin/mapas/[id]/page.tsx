import { notFound, redirect } from "next/navigation";
import AstrologyMapViewer from "@/components/admin/AstrologyMapViewer";
import { buildLoginPath } from "@/lib/auth/redirect";
import { getAstrologyClientMap, isAstrologyClientMapStorageAvailable } from "@/lib/astrology/client-maps-server";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Mapa salvo | Administração | Palavras do Universo",
  robots: "noindex, nofollow",
};

export default async function AdminAstrologyMapDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { id } = await params;

  if (!user) redirect(buildLoginPath(`/admin/mapas/${id}`));
  if (!isOwnerAccessUser(user)) notFound();
  if (!isAstrologyClientMapStorageAvailable()) notFound();

  let map = null;
  try {
    map = await getAstrologyClientMap(user.id, id);
  } catch (error) {
    console.error("Unable to load saved owner astrology map", error);
  }

  if (!map) notFound();
  return <AstrologyMapViewer map={map} />;
}
