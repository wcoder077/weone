"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/i18n-provider";

export default function ProjectLoading() {
  const t = useT();
  return (
    <div role="status" aria-label={t("Yuklanmoqda")} className="flex flex-col gap-6">
      <Skeleton className="rounded-card h-36" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="rounded-card h-64" />
      </div>
    </div>
  );
}
