"use client";

import { useEffect } from "react";

const STORAGE_KEY = "pdu_home_scroll_recovery_v1";
type StoredScroll = {
  key: string;
  y: number;
  timestamp: number;
};

function getLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function writeStoredScroll() {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        key: getLocationKey(),
        y: Math.max(0, Math.round(window.scrollY)),
        timestamp: Date.now(),
      } satisfies StoredScroll)
    );
  } catch {
    // Scroll recovery is best-effort; the page must still work without storage.
  }
}

export function usePduScrollRecovery() {
  useEffect(() => {
    let frame = 0;

    const saveScrollPosition = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        writeStoredScroll();
        frame = 0;
      });
    };

    const saveScrollPositionNow = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      writeStoredScroll();
    };

    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("pagehide", saveScrollPositionNow);
    window.addEventListener("beforeunload", saveScrollPositionNow);
    document.addEventListener("visibilitychange", saveScrollPositionNow);

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("pagehide", saveScrollPositionNow);
      window.removeEventListener("beforeunload", saveScrollPositionNow);
      document.removeEventListener("visibilitychange", saveScrollPositionNow);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}
