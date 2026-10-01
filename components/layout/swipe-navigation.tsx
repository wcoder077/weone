"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "./nav-items";

const EDGE = 24; // px from the screen edge left to the browser's own back/forward gesture
const LOCK = 10; // px of movement before deciding between a horizontal swipe and a scroll
const TRIGGER = 0.22; // share of the width that switches the tab on release
const FLICK = 0.45; // px/ms: a quick flick switches even when it's short
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

// Direction of the last swipe, so the next page slides in from the matching side.
let incoming: -1 | 0 | 1 = 0;

// Elements where a sideways drag belongs to the element itself (carousels, inputs, video…).
function ownsHorizontalDrag(target: EventTarget | null, root: HTMLElement) {
  for (let el = target instanceof Element ? target : null; el && el !== root; el = el.parentElement) {
    if (el.matches("input, textarea, select, video, [contenteditable], [role='slider'], [data-no-swipe]")) return true;
    if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
  }
  return false;
}

// Swipe left/right on a main tab (Asosiy, Kashf, Postlar, Xabarlar, own Profil) to move
// to the next/previous tab. The page follows the finger, then the next page slides in.
// Inner pages (a post, a chat, someone else's profile) are left alone.
// Styles are written straight to the element inside requestAnimationFrame, so dragging
// never re-renders React and stays smooth.
export function SwipeNavigation({ username, children }: { username: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const tabs = navItems.map((i) => (i.href === "/profile" ? `/u/${username}` : i.href));
  const index = tabs.indexOf(pathname);
  const prev = index > 0 ? tabs[index - 1] : null;
  const next = index >= 0 && index < tabs.length - 1 ? tabs[index + 1] : null;

  // Neighbours are prefetched, so the switch is instant.
  useEffect(() => {
    if (prev) router.prefetch(prev);
    if (next) router.prefetch(next);
  }, [prev, next, router]);

  // New page: clear the drag styles and slide in from the side the swipe came from.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.style.willChange = "";
    const from = incoming;
    incoming = 0;
    if (from && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.animate(
        [
          { transform: `translateX(${from * 32}px)`, opacity: 0.5 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 240, easing: EASE },
      );
    }
  }, [pathname]);

  useEffect(() => {
    const el = ref.current;
    if (!el || index < 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let start: { x: number; y: number; t: number } | null = null;
    let axis: "x" | "y" | null = null;
    let dx = 0;
    let frame = 0;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    function paint(offset: number) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el!.style.transform = offset ? `translateX(${offset}px)` : "";
        el!.style.opacity = offset ? String(1 - Math.min(Math.abs(offset) / el!.clientWidth, 0.35)) : "";
      });
    }

    // Animates to the given state. When back at rest, drop will-change: a transformed
    // ancestor would break `position: fixed` children (the full-screen chat).
    let restTimer: ReturnType<typeof setTimeout> | undefined;
    function settle(transform: string, opacity: string, ms: number) {
      cancelAnimationFrame(frame);
      clearTimeout(restTimer);
      el!.style.transition = `transform ${ms}ms ${EASE}, opacity ${ms}ms ${EASE}`;
      el!.style.transform = transform;
      el!.style.opacity = opacity;
      if (!transform) {
        restTimer = setTimeout(() => {
          el!.style.transition = "";
          el!.style.willChange = "";
        }, ms);
      }
    }

    function onStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (e.touches.length !== 1 || !touch) return;
      if (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) return;
      if (ownsHorizontalDrag(e.target, el!)) return;
      start = { x: touch.clientX, y: touch.clientY, t: performance.now() };
      axis = null;
      dx = 0;
    }

    function onMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!start || !touch) return;
      dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!axis) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        axis = Math.abs(dx) > Math.abs(dy) * 1.3 ? "x" : "y";
        if (axis === "y") {
          start = null; // a normal vertical scroll
          return;
        }
        el!.style.transition = "";
        el!.style.willChange = "transform, opacity";
      }
      if (reduceMotion.matches) return;
      const hasTarget = dx < 0 ? next : prev;
      paint(dx * (hasTarget ? 0.5 : 0.12)); // rubber band when there is no tab that way
    }

    function onEnd() {
      if (!start || axis !== "x") {
        start = null;
        return;
      }
      const elapsed = Math.max(1, performance.now() - start.t);
      const target = dx < 0 ? next : prev;
      const far = Math.abs(dx) > el!.clientWidth * TRIGGER;
      const flick = Math.abs(dx) / elapsed > FLICK && Math.abs(dx) > 40;
      start = null;

      if (target && (far || flick)) {
        const direction = dx < 0 ? 1 : -1;
        incoming = direction;
        if (!reduceMotion.matches) settle(`translateX(${-direction * 72}px)`, "0.2", 140);
        router.push(target);
        // If the page takes a while, don't leave the old one dimmed forever.
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => settle("", "", 200), 2500);
      } else {
        settle("", "", 220); // spring back
      }
    }

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      cancelAnimationFrame(frame);
      clearTimeout(resetTimer);
      clearTimeout(restTimer);
    };
  }, [index, prev, next, router]);

  return <div ref={ref}>{children}</div>;
}
