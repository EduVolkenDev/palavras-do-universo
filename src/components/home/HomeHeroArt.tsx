"use client";

import { useEffect, useState } from "react";
import { PDU_ASSETS } from "@/lib/pdu-assets";

const marks = PDU_ASSETS.brand.heroMarkRotation;
const fallback = marks[marks.length - 1];
const lastMarkKey = "pdu_last_hero_mark";

export default function HomeHeroArt({ className }: { className: string }) {
  const [mark, setMark] = useState(fallback);

  useEffect(() => {
    if (marks.length < 2) return;
    const frame = window.requestAnimationFrame(() => {
      let lastPath: string | null = null;
      try {
        lastPath = window.localStorage.getItem(lastMarkKey);
      } catch {
        // The image can still rotate when storage is unavailable.
      }

      const eligible = marks.filter((candidate) => candidate.assetPath !== lastPath);
      const random = new Uint32Array(1);
      window.crypto.getRandomValues(random);
      const next = eligible[random[0] % eligible.length] ?? fallback;
      setMark(next);

      try {
        window.localStorage.setItem(lastMarkKey, next.assetPath);
      } catch {
        // A restricted storage context must not block the hero image.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <picture>
        <source media="(max-width: 600px)" srcSet={mark.mobileAssetPath} />
        <img
          src={mark.assetPath}
          alt=""
          width={560}
          height={560}
          fetchPriority="high"
          onError={() => setMark(fallback)}
        />
      </picture>
    </div>
  );
}
