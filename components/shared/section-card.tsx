"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/i18n/i18n-provider";

// Titled card used for page sections (profile, settings, home sidebar).
export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <section className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-base font-semibold whitespace-nowrap">{t(title)}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
