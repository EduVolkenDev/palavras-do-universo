"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { hasLegacyHomeHash } from "@/lib/navigation/home-entry";
import { LUME_QUESTION_EVENT } from "@/lib/lume/persona";
import HomePortal from "./HomePortal";

const ReadingExperience = dynamic(() => import("./ReadingExperience"));

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(LUME_QUESTION_EVENT, onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(LUME_QUESTION_EVENT, onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

function getLegacySnapshot() {
  if (hasLegacyHomeHash(window.location.hash)) return true;
  try {
    return Boolean(window.sessionStorage.getItem("pdu_lume_question")?.trim());
  } catch {
    return false;
  }
}

export default function HomeEntry({ legacyIntent, navigationParams }: {
  legacyIntent: boolean;
  navigationParams: Record<string, string>;
}) {
  const legacyHash = useSyncExternalStore(subscribe, getLegacySnapshot, () => false);
  const readingOnly = navigationParams.readingOnly === "1" || (
    navigationParams.resume !== "checkout" && (
      Boolean(navigationParams.product) || (!legacyIntent && legacyHash && window.location.hash === "#leitura")
    )
  );
  return legacyIntent || legacyHash
    ? <ReadingExperience readingOnly={readingOnly} />
    : <HomePortal navigationParams={navigationParams} />;
}
