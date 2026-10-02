"use client";

import { ListRowSkeleton } from "@/components/shared/skeletons";
import { useT } from "@/components/i18n/i18n-provider";

export default function MessagesLoading() {
  const t = useT();
  return (
    <div role="status" aria-label={t("Yuklanmoqda")} className="bg-card border-border rounded-card flex flex-col gap-2 border p-5">
      {Array.from({ length: 6 }, (_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}
