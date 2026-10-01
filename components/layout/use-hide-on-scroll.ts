"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const THRESHOLD = 8; // px of movement before changing direction, avoids flicker
const REVEAL_ZONE = 64; // always shown near the top of the page

// True while the header should be hidden: after scrolling down, until scrolling up.
// Stays visible with reduced motion, or while it contains focus or an open menu.
export function useHideOnScroll(headerRef: RefObject<HTMLElement | null>) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    lastY.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < THRESHOLD) return;
      lastY.current = y;

      const header = headerRef.current;
      const busy =
        reduceMotion.matches ||
        Boolean(header?.contains(document.activeElement)) ||
        Boolean(header?.querySelector("[aria-expanded='true']"));
      setHidden(!busy && delta > 0 && y > REVEAL_ZONE);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerRef]);

  // E.g. keyboard focus moving into the hidden header brings it back.
  const reveal = () => setHidden(false);
  return { hidden, reveal };
}
