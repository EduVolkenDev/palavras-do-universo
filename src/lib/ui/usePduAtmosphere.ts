"use client";

import { useEffect } from "react";

export function usePduAtmosphere() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const revealItems = Array.from(document.querySelectorAll(".pdu-reveal"));
    const root = document.documentElement;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      root.classList.add("pdu-motion-ready");
      return () => root.classList.remove("pdu-motion-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }
      },
      { rootMargin: "0px 0px 18% 0px", threshold: 0.05 }
    );

    const showInitialViewportItems = () => {
      const revealLimit = window.innerHeight * 1.04;

      revealItems.forEach((item) => {
        if (item.getBoundingClientRect().top < revealLimit) {
          item.classList.add("is-visible");
        }
      });
    };

    // Mark viewport items as visible BEFORE adding pdu-motion-ready,
    // so hero elements are never briefly hidden by the opacity:0 rule.
    showInitialViewportItems();
    root.classList.add("pdu-motion-ready");
    revealItems.forEach((item) => observer.observe(item));

    let frame = 0;
    let scrollFrame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight * 0.35;

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;

      pointerX = event.clientX;
      pointerY = event.clientY;

      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--pdu-mx", `${pointerX}px`);
        document.documentElement.style.setProperty("--pdu-my", `${pointerY}px`);
        frame = 0;
      });
    };

    const updateScrollAtmosphere = () => {
      if (scrollFrame) return;

      scrollFrame = window.requestAnimationFrame(() => {
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        root.style.setProperty("--pdu-scroll", progress.toFixed(4));
        root.style.setProperty(
          "--pdu-scroll-shift",
          `${Math.round(progress * 42)}px`
        );
        scrollFrame = 0;
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", updateScrollAtmosphere, {
      passive: true,
    });
    updateScrollAtmosphere();

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", updateScrollAtmosphere);
      if (frame) window.cancelAnimationFrame(frame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      root.classList.remove("pdu-motion-ready");
    };
  }, []);
}
