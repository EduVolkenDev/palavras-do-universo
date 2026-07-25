"use client";

import { useEffect } from "react";

const STORAGE_KEY = "pdu_home_scroll_recovery_v1";
const MAX_AGE_MS = 30 * 60 * 1000;
const MIN_RESTORE_Y = 160;

type StoredScroll = {
  key: string;
  y: number;
  timestamp: number;
};

function getLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function hasIntentionalLandingTarget() {
  if (window.location.hash) return true;

  const params = new URLSearchParams(window.location.search);
  return params.has("product") || params.has("acao") || params.has("corrente");
}

function readStoredScroll(): StoredScroll | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredScroll>;
    if (
      typeof parsed.key !== "string" ||
      typeof parsed.y !== "number" ||
      typeof parsed.timestamp !== "number"
    ) {
      return null;
    }

    return {
      key: parsed.key,
      y: parsed.y,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
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
    const timers: number[] = [];

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

    const stored = readStoredScroll();
    const shouldRestore =
      stored &&
      stored.key === getLocationKey() &&
      stored.y >= MIN_RESTORE_Y &&
      Date.now() - stored.timestamp < MAX_AGE_MS &&
      !hasIntentionalLandingTarget();

    if (shouldRestore) {
      const restoreScrollPosition = () => {
        const maxY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const targetY = Math.min(stored.y, maxY);

        if (targetY >= MIN_RESTORE_Y) {
          window.scrollTo({ top: targetY, behavior: "auto" });
        }
      };

      [0, 120, 320, 700, 1200].forEach((delay) => {
        timers.push(window.setTimeout(restoreScrollPosition, delay));
      });
    }

    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("pagehide", saveScrollPositionNow);
    window.addEventListener("beforeunload", saveScrollPositionNow);
    document.addEventListener("visibilitychange", saveScrollPositionNow);

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("pagehide", saveScrollPositionNow);
      window.removeEventListener("beforeunload", saveScrollPositionNow);
      document.removeEventListener("visibilitychange", saveScrollPositionNow);
      timers.forEach((timer) => window.clearTimeout(timer));
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}
