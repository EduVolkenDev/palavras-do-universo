"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const UniverseCanvas = dynamic(
  () => import("./UniverseCanvas").then((module) => module.UniverseCanvas),
  { ssr: false }
);

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
};

function getSceneQuality() {
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const narrowViewport = window.matchMedia("(max-width: 768px)").matches;

  if (memory <= 2 || cores <= 2) return "reduced" as const;
  if (narrowViewport || memory <= 4 || cores <= 4) return "balanced" as const;
  return "high" as const;
}

export function UniverseExperience() {
  const [canRender, setCanRender] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneActive, setSceneActive] = useState(true);
  const [quality, setQuality] = useState<"high" | "balanced" | "reduced">(
    "balanced"
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const frame = window.requestAnimationFrame(() => {
      setQuality(getSceneQuality());
      setCanRender(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const host = document.querySelector("[data-universe-experience]");
    if (!host || !("IntersectionObserver" in window)) return;

    const syncVisibility = (inViewport: boolean) => {
      setSceneActive(inViewport && document.visibilityState === "visible");
    };

    let inViewport = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
        syncVisibility(inViewport);
      },
      { rootMargin: "20% 0px", threshold: 0.01 }
    );
    const onVisibilityChange = () => syncVisibility(inViewport);

    observer.observe(host);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!sceneReady) return;
    document.documentElement.classList.add("pdu-universe-ready");
    return () => document.documentElement.classList.remove("pdu-universe-ready");
  }, [sceneReady]);

  return (
    <div
      className="pdu-universe-experience"
      data-universe-experience
      data-scene-ready={sceneReady ? "true" : "false"}
      aria-hidden="true"
    >
      {canRender ? (
        <UniverseCanvas
          active={sceneActive}
          quality={quality}
          onReady={() => setSceneReady(true)}
        />
      ) : null}
    </div>
  );
}
