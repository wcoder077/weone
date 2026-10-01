"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

// Small bar above a nav link while its route is loading. The delay hides it on
// fast navigations, so it only appears when the tap would otherwise feel ignored.
// Must be rendered inside a <Link> with `relative` positioning.
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current opacity-0 transition-opacity",
        pending && "opacity-100 delay-120",
      )}
    />
  );
}
