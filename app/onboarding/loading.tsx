"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/i18n-provider";

export default function OnboardingLoading() {
  const t = useT();
  return (
    <div role="status" aria-label={t("Yuklanmoqda")} className="mx-auto flex max-w-[520px] flex-col gap-6 px-4 pt-20">
      <Skeleton className="h-1 w-full rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}
