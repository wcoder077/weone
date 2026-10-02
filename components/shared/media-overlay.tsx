"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// Full-screen viewer over a see-through, blurred backdrop (avatar photos, chat and post
// images). Tap anywhere or press Esc to close.
export function MediaOverlay({
  label,
  onClose,
  children,
  className,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(label)}
      // Portals still bubble React events to their React parents (e.g. a profile link
      // or a chat bubble): keep taps on the overlay to itself.
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={cn(
        "animate-in fade-in-0 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/45 p-4 backdrop-blur-md duration-150",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
