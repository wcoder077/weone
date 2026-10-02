"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const HOLD_MS = 500; // how long to hold before the photo opens
const MOVE_TOLERANCE_PX = 10; // moving more than this (scrolling, swiping) cancels the hold

// Press and hold an avatar to see the photo large and round over a blurred, see-through
// backdrop. Tap anywhere (or Esc) closes it. A hold never also opens the link around the
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
      {open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={name}
              // The overlay lives in a portal but React events still bubble to the avatar's
              // parents (e.g. a profile link): keep taps on the overlay to itself.
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="animate-in fade-in-0 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/40 p-6 backdrop-blur-md duration-150"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="animate-in zoom-in-90 size-[min(78vw,340px)] rounded-full object-cover shadow-2xl ring-4 ring-white/15 duration-200"
              />
              <p className="max-w-[80vw] truncate text-lg font-semibold text-white drop-shadow">{name}</p>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
