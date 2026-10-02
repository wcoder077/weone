"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { MediaOverlay } from "./media-overlay";

const HOLD_MS = 500; // how long to hold before the photo opens
const MOVE_TOLERANCE_PX = 10; // moving more than this (scrolling, swiping) cancels the hold

// Press and hold an avatar to see the photo large and round over a blurred, see-through
// backdrop (MediaOverlay). Tap anywhere (or Esc) closes it. A hold never also opens the link around the
// avatar: the click that follows it is swallowed.
export function AvatarPreview({ url, name, children }: { url: string; name: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const opened = useRef(false);

  function cancel() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => cancel, []);

  return (
    <span
      className="touch-callout-none inline-flex select-none"
      onPointerDown={(e: PointerEvent) => {
        if (e.button !== 0) return;
        cancel();
        opened.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        timer.current = window.setTimeout(() => {
          timer.current = null;
          opened.current = true;
          navigator.vibrate?.(10);
          setOpen(true);
        }, HOLD_MS);
      }}
      onPointerMove={(e: PointerEvent) => {
        const start = origin.current;
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      // The native long-press menu (save image / open link) would cover the preview.
      onContextMenu={(e: MouseEvent) => e.preventDefault()}
      onClickCapture={(e: MouseEvent) => {
        if (!opened.current) return;
        opened.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
      {open ? (
        <MediaOverlay label={name} onClose={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="animate-in zoom-in-90 size-[min(78vw,340px)] rounded-full object-cover shadow-2xl ring-4 ring-white/15 duration-200"
          />
          <p className="max-w-[80vw] truncate text-lg font-semibold text-white drop-shadow">{name}</p>
        </MediaOverlay>
      ) : null}
    </span>
  );
}
