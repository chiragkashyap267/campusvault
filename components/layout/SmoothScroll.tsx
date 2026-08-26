"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useEffect, useState } from "react";

/**
 * Smooth scrolling wrapper.
 *
 * There is no GSAP/ScrollTrigger bridge here any more: the only two
 * scroll-driven animations in the app were simple fade-ins, and they now use
 * Framer Motion's `whileInView` like every other section does. That removed
 * GSAP from the bundle entirely, and with it the need to keep two separate
 * scroll clocks in sync.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  // Respect the OS reduce-motion setting, and skip smoothing on touch devices
  // where hijacking the scroll always feels worse than the native one.
  const [smoothEnabled, setSmoothEnabled] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    const update = () => setSmoothEnabled(!reduceMotion.matches && !coarsePointer.matches);
    update();

    reduceMotion.addEventListener("change", update);
    coarsePointer.addEventListener("change", update);
    return () => {
      reduceMotion.removeEventListener("change", update);
      coarsePointer.removeEventListener("change", update);
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        // One easing model only. The previous config set both `lerp` and
        // `duration`; Lenis uses one or the other, and a lerp of 0.08 is slow
        // enough that the viewport visibly trails the wheel.
        lerp: 0.14,
        smoothWheel: smoothEnabled,
        // Never smooth touch scrolling — mobile browsers hand off native
        // momentum scrolling to the compositor, and taking that over drops it
        // onto the main thread.
        syncTouch: false,
        touchMultiplier: 1.6,
      }}
    >
      {children}
    </ReactLenis>
  );
}
