"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";

// "Filtrlar" button with the number of active filters; the filters open in a bottom
// sheet on phones (dialog on desktop), so the results start right under the search.
export function FiltersSheet({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="bg-card h-12 shrink-0"
        onClick={() => setOpen(true)}
        aria-label={count ? `Filtrlar, ${count} ta faol` : "Filtrlar"}
      >
        <SlidersHorizontal data-icon="inline-start" />
        <span className="max-sm:sr-only">Filtrlar</span>
        {count ? (
          <span className="bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full text-[12px] tabular-nums">
            {count}
          </span>
        ) : null}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Filtrlar" description="Natijalar darhol yangilanadi.">
        <div className="flex flex-col gap-5">
          {children}
          <Button size="lg" onClick={() => setOpen(false)}>
            Natijalarni ko&apos;rish
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
