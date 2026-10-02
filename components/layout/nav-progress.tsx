"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A thin bar at the top while another page loads. It only appears if the page is still not
// there after SHOW_AFTER_MS, so on a fast connection (or a cached page) nothing flashes at all.
// When the page arrives the bar jumps to the end and fades out within a fraction of a second.
const SHOW_AFTER_MS = 150;
const GIVE_UP_MS = 15_000;
const FINISH_MS = 180;

type Phase = "idle" | "start" | "running" | "finishing";

// A click on a link to another page of this site that opens in this tab.
function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const link = (event.target as Element | null)?.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return false;
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return false;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname + url.search !== window.location.pathname + window.location.search;
}

export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const giveUpTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef(false);

  // A link was clicked: show the bar only if the page is slow.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!isInternalNavigation(event)) return;
      pending.current = true;
      clearTimeout(showTimer.current);
      clearTimeout(giveUpTimer.current);
      showTimer.current = setTimeout(() => setPhase("start"), SHOW_AFTER_MS);
      giveUpTimer.current = setTimeout(() => {
        pending.current = false;
        setPhase("idle");
      }, GIVE_UP_MS);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(showTimer.current);
      clearTimeout(giveUpTimer.current);
    };
  }, []);

  // The page changed: finish. If the bar never showed, there is nothing to hide.
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    clearTimeout(showTimer.current);
    clearTimeout(giveUpTimer.current);
    setPhase((current) => (current === "idle" ? "idle" : "finishing"));
  }, [pathname, search]);

  // start → running (so the width transition has a starting point); finishing → idle.
  useEffect(() => {
    if (phase === "start") {
      const frame = requestAnimationFrame(() => setPhase("running"));
      return () => cancelAnimationFrame(frame);
    }
    if (phase === "finishing") {
      const done = setTimeout(() => setPhase("idle"), FINISH_MS + 120);
      return () => clearTimeout(done);
    }
  }, [phase]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5"
      style={{ opacity: phase === "idle" || phase === "finishing" ? 0 : 1, transition: `opacity ${FINISH_MS}ms ease-out ${phase === "finishing" ? "120ms" : "0ms"}` }}
    >
      <div
        className="bg-primary h-full origin-left"
        style={{
          width: phase === "running" ? "75%" : phase === "finishing" ? "100%" : "0%",
          transition:
            phase === "running" ? "width 2.5s cubic-bezier(0.1, 0.7, 0.3, 1)" : phase === "finishing" ? `width ${FINISH_MS}ms ease-out` : "none",
        }}
      />
    </div>
  );
}
