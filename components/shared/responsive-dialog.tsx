"use client";

import { useEffect, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/i18n-provider";

// Phone keyboards cover the bottom of the screen without resizing the page, so a bottom sheet would
// sit behind them. While a dialog is open, publish how much of the bottom the keyboard covers
// (--sheet-bottom) and how tall the visible area is (--sheet-height); the sheet follows both.
function useKeyboardInset(open: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return;
    const root = document.documentElement;

    function update() {
      if (!viewport) return;
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      root.style.setProperty("--sheet-bottom", `${covered}px`);
      root.style.setProperty("--sheet-height", `${viewport.height}px`);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--sheet-bottom");
      root.style.removeProperty("--sheet-height");
    };
  }, [open]);
}

// Centered dialog on desktop, bottom sheet on mobile (spec: "dialog desktop, sheet mobile").
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const t = useT();
  useKeyboardInset(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-[var(--sheet-bottom,0px)] max-h-[min(92dvh,calc(var(--sheet-height,100dvh)-0.5rem))] max-w-full translate-y-0 overflow-y-auto rounded-b-none pb-8 sm:top-1/2 sm:bottom-auto sm:max-h-[92dvh] sm:max-w-lg sm:-translate-y-1/2 sm:rounded-b-card sm:pb-6">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-lg font-semibold">{t(title)}</DialogTitle>
          {description ? <DialogDescription>{t(description)}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
