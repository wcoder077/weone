"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

// "Filtrlar" button with the number of active filters; the filters open in a bottom
// sheet on phones (dialog on desktop), so the results start right under the search.
export function FiltersSheet({ count, children }: { count: number; children: ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="bg-card h-12 shrink-0"
        onClick={() => setOpen(true)}
        aria-label={count ? t("Filtrlar, {count} ta faol", { count }) : t("Filtrlar")}
      >
        <SlidersHorizontal data-icon="inline-start" />
        <span className="max-sm:sr-only">{t("Filtrlar")}</span>
        {count ? (
          <span className="bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full text-[12px] tabular-nums">
            {count}
          </span>
        ) : null}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("Filtrlar")} description={t("Natijalar darhol yangilanadi.")}>
        <div className="flex flex-col gap-5">
          {children}
          <Button size="lg" onClick={() => setOpen(false)}>
            {t("Natijalarni ko'rish")}</Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
