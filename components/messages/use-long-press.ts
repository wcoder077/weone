"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

const HOLD_MS = 500;
const MOVE_TOLERANCE_PX = 10;

// Touch/pen hold → `onLongPress`. Scrolling cancels it (pointercancel / movement).
// The context-menu event (Android long-press, desktop right-click) opens the same
// action instead of the browser's native menu.
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  function cancel() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }

  return {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse") return;
      cancel();
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onLongPress();
      }, HOLD_MS);
    },
    onPointerMove(e: PointerEvent) {
      const start = origin.current;
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onContextMenu(e: MouseEvent) {
      e.preventDefault();
      cancel();
      onLongPress();
    },
  };
}
