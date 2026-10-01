"use client";

import { useEffect } from "react";

// App chrome and controls: long-press shouldn't open the browser's link/image menu.
const BLOCKED = 'a, button, img, label, nav, [role="button"], [role="tab"], [role="menuitem"]';
// Text fields keep their native menu (paste, select all…).
const ALLOWED = 'input, textarea, [contenteditable="true"]';

// Touch only: right-click on desktop keeps "open in new tab" etc.
export function ContextMenuGuard() {
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");

    function onContextMenu(event: MouseEvent) {
      const touch = "pointerType" in event ? event.pointerType !== "mouse" : coarse.matches;
      const target = event.target;
      if (!touch || !(target instanceof Element) || target.closest(ALLOWED)) return;
      if (target.closest(BLOCKED)) event.preventDefault();
    }

    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  return null;
}
