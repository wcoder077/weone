"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/i18n/i18n-provider";

// Container of a loading placeholder: announced as "Loading" in the visitor's language
// (and faded in after a short delay, see globals.css).
export function LoadingRegion({ className, children }: { className?: string; children: ReactNode }) {
  const t = useT();
  return (
    <div role="status" aria-label={t("Yuklanmoqda")} className={className}>
      {children}
    </div>
  );
}
