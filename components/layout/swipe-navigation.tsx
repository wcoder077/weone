"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/components/i18n/i18n-provider";
import { navItems } from "./nav-items";

const EDGE = 24; // px from the screen edge left to the browser's own back/forward gesture
const LOCK = 10; // px of movement before deciding between a horizontal swipe and a scroll
const TRIGGER = 0.22; // share of the width that switches the tab on release
const FLICK = 0.45; // px/ms: a quick flick switches even when it's short
const GAP = 16; // px between the two pages while they slide
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

// Elements where a sideways drag belongs to the element itself (carousels, inputs, video…).
function ownsHorizontalDrag(target: EventTarget | null, root: HTMLElement) {
  for (let el = target instanceof Element ? target : null; el && el !== root; el = el.parentElement) {
    if (el.matches("input, textarea, select, video, [contenteditable], [role='slider'], [data-no-swipe]")) return true;
    if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
  }
  return false;
}

// The tab bar's blue pill follows the swipe: how far we are between this tab and the next (-1..1).
function setTabProgress(value: number) {
  document.documentElement.style.setProperty("--tab-progress", String(value));
}
function setSwiping(on: boolean) {
  if (on) document.documentElement.setAttribute("data-swiping", "");
  else document.documentElement.removeAttribute("data-swiping");
}

type Peek = { href: string; side: 1 | -1 };

// Swipe left/right on a main tab (Asosiy, Kashf, Postlar, Xabarlar, own Profil) to move
// to the next/previous tab, like a pager: the page follows the finger one to one and the
// neighbouring page (a placeholder until it loads) slides in beside it. The tab bar's pill
// moves along. Inner pages (a post, a chat, someone else's profile) are left alone.
// Styles are written straight to the elements inside requestAnimationFrame, so dragging
// never re-renders React and stays smooth.
export function SwipeNavigation({ username, children }: { username: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const tabs = navItems.map((i) => (i.href === "/profile" ? `/u/${username}` : i.href));
  const index = tabs.indexOf(pathname);
  const prev = index > 0 ? tabs[index - 1] : null;
  const next = index >= 0 && index < tabs.length - 1 ? tabs[index + 1] : null;

  // Neighbours are prefetched, so the switch is instant.
  useEffect(() => {
    if (prev) router.prefetch(prev);
    if (next) router.prefetch(next);
  }, [prev, next, router]);

  // New page arrived: drop the drag styles and the placeholder, and fade the page in.
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.style.transition = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.style.willChange = "";
    setTabProgress(0);
    setSwiping(false);
    setPeek(null);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 160, easing: EASE });
    }
  }, [pathname]);

  // The placeholder starts off-screen on the side the next page comes from.
  useEffect(() => {
    const el = pageRef.current;
    const panel = peekRef.current;
    if (!peek || !el || !panel) return;
    panel.style.transform = `translateX(${peek.side * (el.clientWidth + GAP)}px)`;
  }, [peek]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el || index < 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let start: { x: number; y: number; t: number } | null = null;
    let axis: "x" | "y" | null = null;
    let dx = 0;
    let frame = 0;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let restTimer: ReturnType<typeof setTimeout> | undefined;

    const width = () => el!.clientWidth + GAP;

    function paint(offset: number, withPeek: boolean) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el!.style.transform = offset ? `translateX(${offset}px)` : "";
        const panel = peekRef.current;
        if (withPeek && panel) {
          const side = offset < 0 ? 1 : -1;
          panel.style.transform = `translateX(${side * width() + offset}px)`;
          setTabProgress(Math.max(-1, Math.min(1, -offset / width())));
        }
      });
    }

    // Animates both pages to the given state. When back at rest, drop will-change: a
    // transformed ancestor would break `position: fixed` children (the full-screen chat).
    function settle(pageX: number, peekX: number | null, progress: number, ms: number) {
      cancelAnimationFrame(frame);
      clearTimeout(restTimer);
      const transition = `transform ${ms}ms ${EASE}`;
      el!.style.transition = transition;
      el!.style.transform = pageX ? `translateX(${pageX}px)` : "";
      const panel = peekRef.current;
      if (panel && peekX !== null) {
        panel.style.transition = transition;
        panel.style.transform = `translateX(${peekX}px)`;
      }
      setSwiping(false); // lets the tab bar's pill animate to its resting place
      setTabProgress(progress);
      if (!pageX) {
        restTimer = setTimeout(() => {
          el!.style.transition = "";
          el!.style.willChange = "";
          setPeek(null);
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
        clearTimeout(restTimer);
        el!.style.transition = "";
        el!.style.willChange = "transform";
        setSwiping(true);
      }
      if (reduceMotion.matches) return;
      const target = dx < 0 ? next : prev;
      if (!target) {
        paint(dx * 0.12, false); // rubber band when there is no tab that way
        return;
      }
      const side = dx < 0 ? 1 : -1;
      setPeek((current) => (current?.href === target ? current : { href: target, side }));
      paint(dx, true);
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
        if (!reduceMotion.matches) settle(-direction * width(), 0, direction, 200);
        router.push(target);
        // If the page takes a while, don't leave the old one pushed aside forever.
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => settle(0, direction * width(), 0, 200), 2500);
      } else {
        settle(0, dx < 0 ? width() : -width(), 0, 220); // spring back
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

  return (
    <div className="relative overflow-x-clip">
      <div ref={pageRef}>{children}</div>
      {peek ? <PeekPage ref={peekRef} href={peek.href} username={username} /> : null}
    </div>
  );
}

// Stand-in for the page that is sliding in: its title and a few soft blocks, until the real page loads.
function PeekPage({ ref, href, username }: { ref: React.Ref<HTMLDivElement>; href: string; username: string }) {
  const t = useT();
  const item = navItems.find((i) => (i.href === "/profile" ? `/u/${username}` : i.href) === href);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[calc(100dvh-8rem)] flex-col gap-4 overflow-hidden will-change-transform">
      <h2 className="text-2xl font-bold lg:text-[32px]">{item ? t(item.label) : null}</h2>
      <div className="bg-card border-border rounded-card h-40 border" />
      <div className="bg-card border-border rounded-card h-56 border" />
      <div className="bg-card border-border rounded-card h-40 border" />
    </div>
  );
}
