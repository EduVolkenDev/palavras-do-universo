/**
 * Curated visual system for the astrology experience.
 *
 * The source collection lives in `public/assets/astrology/transits` together
 * with its manifest. Keep these paths semantic: components select an artwork
 * for its narrative role, rather than treating the collection as decorative
 * icons. Arrays are curated candidate pools; a visible card must be assigned
 * an explicit artwork rather than cycling through them by array index.
 */
import { PDU_ASSETS } from "@/lib/pdu-assets";
import type { NatalBody } from "@/lib/astrology/natal-chart";
import type { DailyTone, DailyTransit } from "@/lib/astrology/daily-sky";

const root = PDU_ASSETS.astrology.transits.root;

export const ASTROLOGY_VISUALS = {
  overview: {
    hero: `${root}/overview/symbolic-portal.webp`,
    heroAtmosphere: `${root}/overview/sky-layers-stack.webp`,
    experiences: {
      sky: `${root}/overview/cosmic-horizon-mountain.webp`,
      pulse: `${root}/overview/celestial-path-compass.webp`,
      map: `${root}/overview/layered-zodiac-stack.webp`,
      time: `${root}/overview/layered-sky-stairway.webp`,
    },
    navigation: `${root}/interface-cues/navigation-celestial-compass.webp`,
    compass: `${root}/interface-cues/celestial-compass.webp`,
  },
  dailySky: {
    hero: `${root}/daily-sky/moving-sky-spiral.webp`,
    headerAlternates: [
      `${root}/daily-sky/current-sky-compass.webp`,
      `${root}/daily-sky/current-sky-globe.webp`,
      `${root}/daily-sky/transit-time-hourglass.webp`,
      `${root}/interface-cues/sky-snapshot-orb.webp`,
      `${root}/interface-cues/transit-calendar.webp`,
    ],
    positionsIntro: `${root}/daily-sky/current-sky-terrestrial-orbit.webp`,
    positionByBody: PDU_ASSETS.astrology.planets satisfies Record<NatalBody, string>,
    positionExplainers: [
      `${root}/daily-sky/moving-sky-spiral.webp`,
      `${root}/interface-cues/celestial-compass.webp`,
      `${root}/interface-cues/navigation-celestial-compass.webp`,
    ],
    lume: [
      `${root}/symbolic-reading/astrological-reading-book.webp`,
      `${root}/symbolic-reading/celestial-interpretation-book.webp`,
      `${root}/symbolic-reading/lunar-intuition-hand.webp`,
      `${root}/symbolic-reading/sun-moon-reading-book.webp`,
      `${root}/symbolic-reading/guided-sky-hand.webp`,
      `${root}/interface-cues/personal-resonance-heart.webp`,
      `${root}/interface-cues/lunar-solar-cycle.webp`,
      `${root}/interface-cues/reading-journal.webp`,
      `${root}/interface-cues/symbolic-conversation.webp`,
      `${root}/interface-cues/personal-resonance-orb.webp`,
      `${root}/interface-cues/lunar-celestial-orb.webp`,
    ],
  },
  transitAspects: {
    supportive: [
      `${root}/transit-aspects/supportive-convergence.webp`,
      `${root}/transit-aspects/paired-planets-connection.webp`,
      `${root}/transit-aspects/harmonic-orbits.webp`,
      `${root}/transit-aspects/planetary-balance.webp`,
    ],
    attention: [
      `${root}/transit-aspects/tension-orbits.webp`,
      `${root}/transit-aspects/mirrored-planets.webp`,
      `${root}/transit-aspects/relational-orbits.webp`,
    ],
    intensified: [
      `${root}/transit-aspects/intensified-convergence.webp`,
      `${root}/transit-aspects/intensified-star-cluster.webp`,
      `${root}/transit-aspects/energy-focus-orbits.webp`,
      `${root}/transit-aspects/integrated-orbits.webp`,
    ],
    general: [
      `${root}/transit-aspects/aspect-network.webp`,
      `${root}/transit-aspects/planetary-network.webp`,
      `${root}/transit-aspects/three-body-transit-path.webp`,
      `${root}/transit-aspects/aspect-integration-infinity.webp`,
      `${root}/transit-aspects/planetary-aspect-web.webp`,
    ],
  },
  natalMap: {
    hero: [
      `${root}/natal-map/natal-sky-globe.webp`,
      `${root}/natal-map/planetary-system-core.webp`,
      `${root}/natal-map/whole-chart-galaxy.webp`,
    ],
    placement: [
      `${root}/natal-map/planet-sign-house-axis.webp`,
      `${root}/natal-map/zodiac-placement-wheel.webp`,
      `${root}/natal-map/zodiac-balance-orbits.webp`,
      `${root}/interface-cues/placement-triad.webp`,
      `${root}/symbolic-reading/celestial-study-books.webp`,
    ],
    layers: [
      `${root}/natal-map/whole-chart-network.webp`,
      `${root}/natal-map/layered-zodiac-cosmos.webp`,
      `${root}/overview/sky-layers-stack.webp`,
      `${root}/interface-cues/chart-exploration.webp`,
      `${root}/interface-cues/crystal-navigation.webp`,
    ],
    planetByBody: PDU_ASSETS.astrology.planets satisfies Record<NatalBody, string>,
    housesIntro: `${root}/natal-map/celestial-home-houses.webp`,
    houses: [
      `${root}/interface-cues/zodiac-wheel.webp`,
      `${root}/interface-cues/chart-exploration.webp`,
      `${root}/overview/layered-zodiac-stack.webp`,
      `${root}/overview/sky-layers-stack.webp`,
      `${root}/overview/layered-sky-stairway.webp`,
      `${root}/natal-map/layered-zodiac-cosmos.webp`,
      `${root}/natal-map/whole-chart-network.webp`,
      `${root}/natal-map/zodiac-balance-orbits.webp`,
      `${root}/natal-map/planet-sign-house-axis.webp`,
      `${root}/transit-aspects/aspect-network.webp`,
      `${root}/transit-aspects/planetary-network.webp`,
      `${root}/transit-aspects/aspect-integration-infinity.webp`,
    ],
  },
} as const;

export type DailyTransitArtworkPlan = {
  headerByTone: Record<DailyTone, string>;
  dailyCardByTransit: Record<string, string>;
  lumeCardByTransit: Record<string, string>;
  lumeHero: string;
};

const dailyToneOrder: DailyTone[] = ["supportive", "attention", "intensified"];

function distinctArtworks(artworks: readonly string[]) {
  return [...new Set(artworks)];
}

function takeArtwork(available: string[], preferred: readonly string[]) {
  const preferredIndex = available.findIndex((artwork) => preferred.includes(artwork));
  const artwork = preferredIndex >= 0 ? available.splice(preferredIndex, 1)[0] : available.shift();
  if (!artwork) throw new Error("The daily transit artwork pool is exhausted.");
  return artwork;
}

export function dailyTransitArtworkKey(transit: Pick<DailyTransit, "transitBody" | "type" | "natalBody">) {
  return `${transit.transitBody}:${transit.type}:${transit.natalBody}`;
}

/**
 * A daily sky can contain more aspects than a tone-specific visual group.
 * Allocate from one curated, de-duplicated pool instead of cycling an array:
 * each visible transit receives one unique artwork for that page render.
 */
export function createDailyTransitArtworkPlan(transits: readonly DailyTransit[]): DailyTransitArtworkPlan {
  const toneCandidates: Record<DailyTone, readonly string[]> = {
    supportive: ASTROLOGY_VISUALS.transitAspects.supportive,
    attention: ASTROLOGY_VISUALS.transitAspects.attention,
    intensified: ASTROLOGY_VISUALS.transitAspects.intensified,
  };
  const fixedDailySkyArt = new Set<string>([
    ASTROLOGY_VISUALS.dailySky.hero,
    ASTROLOGY_VISUALS.dailySky.positionsIntro,
    ...ASTROLOGY_VISUALS.dailySky.positionExplainers,
  ]);
  const available = distinctArtworks([
    ...ASTROLOGY_VISUALS.transitAspects.supportive,
    ...ASTROLOGY_VISUALS.transitAspects.attention,
    ...ASTROLOGY_VISUALS.transitAspects.intensified,
    ...ASTROLOGY_VISUALS.transitAspects.general,
    ...ASTROLOGY_VISUALS.dailySky.lume,
    ...ASTROLOGY_VISUALS.dailySky.headerAlternates,
    ...ASTROLOGY_VISUALS.natalMap.layers,
    ...ASTROLOGY_VISUALS.natalMap.placement,
    ...ASTROLOGY_VISUALS.natalMap.houses,
    ...ASTROLOGY_VISUALS.natalMap.hero,
    ASTROLOGY_VISUALS.overview.hero,
    ASTROLOGY_VISUALS.overview.heroAtmosphere,
    ...Object.values(ASTROLOGY_VISUALS.overview.experiences),
    ASTROLOGY_VISUALS.overview.navigation,
    ASTROLOGY_VISUALS.overview.compass,
  ].filter((artwork) => !fixedDailySkyArt.has(artwork)));
  const headerByTone = Object.fromEntries(
    dailyToneOrder.map((tone) => [tone, takeArtwork(available, toneCandidates[tone])]),
  ) as Record<DailyTone, string>;
  const lumeHero = takeArtwork(available, ASTROLOGY_VISUALS.dailySky.lume);
  const orderedTransits = [...transits].sort((first, second) => dailyTransitArtworkKey(first).localeCompare(dailyTransitArtworkKey(second)));
  const dailyCardByTransit: Record<string, string> = {};
  const lumeCardByTransit: Record<string, string> = {};

  for (const transit of orderedTransits) {
    dailyCardByTransit[dailyTransitArtworkKey(transit)] = takeArtwork(available, toneCandidates[transit.tone]);
  }
  for (const transit of orderedTransits) {
    lumeCardByTransit[dailyTransitArtworkKey(transit)] = takeArtwork(available, toneCandidates[transit.tone]);
  }

  return { headerByTone, dailyCardByTransit, lumeCardByTransit, lumeHero };
}
