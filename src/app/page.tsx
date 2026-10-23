import HomeEntry from "@/components/home/HomeEntry";
import { hasLegacyHomeIntent } from "@/lib/navigation/home-entry";

type HomeSearch = Record<string, string | string[] | undefined>;

export default async function HomePage({ searchParams }: { searchParams: Promise<HomeSearch> }) {
  const params = await searchParams;
  const navigationParams = Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : []
    )
  );

  return <HomeEntry legacyIntent={hasLegacyHomeIntent(params)} navigationParams={navigationParams} />;
}
