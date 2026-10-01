"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { usePathname } from "next/navigation";

const THRESHOLD = 8; // px of movement before switching direction (no flicker)
const TOP_ZONE = 64; // bars are always shown near the top of the page

// Shared by the top header and the mobile tab bar: true while the user scrolls
// the page down, false when scrolling up, near the top, on route change, or with
// prefers-reduced-motion. Reads scroll position once per animation frame.
export function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  // A new page starts with the bars visible.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setHidden(false);
  }

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      // Clamp to the real scroll range: iOS rubber-banding past the top or bottom
      // would otherwise read as a direction change and flash the bars.
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(Math.max(0, window.scrollY), Math.max(0, maxY));
      if (reduceMotion.matches || y < TOP_ZONE) {
        setHidden(false);
        lastY = y;
        return;
      }
      const delta = y - lastY;
      if (Math.abs(delta) < THRESHOLD) return;
      setHidden(delta > 0);
      lastY = y;
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // Keyboard focus moving into a hidden bar brings both back. Mouse clicks leave
  // focus on links too, so only :focus-visible (keyboard) counts.
  const revealOnKeyboardFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) setHidden(false);
  };

  return { hidden, revealOnKeyboardFocus };
}
