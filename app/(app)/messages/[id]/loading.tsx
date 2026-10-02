"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/i18n-provider";

export default function ConversationLoading() {
  const t = useT();
  return (
    <div role="status" aria-label={t("Yuklanmoqda")} className="bg-card flex flex-col gap-4 p-5 max-lg:fixed max-lg:inset-0 max-lg:z-50 lg:border-border lg:rounded-card lg:h-full lg:border">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-2/3 rounded-3xl" />
      <Skeleton className="h-10 w-1/2 self-end rounded-3xl" />
      <Skeleton className="h-10 w-3/5 rounded-3xl" />
    </div>
  );
}
