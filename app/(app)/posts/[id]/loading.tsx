"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/i18n-provider";

export default function Loading() {
  const t = useT();
  return (
    <div role="status" aria-label={t("Yuklanmoqda")} className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
      <Skeleton className="h-11 w-28 rounded-full" />
      <div className="bg-card border-border rounded-card flex flex-col gap-3 border p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
