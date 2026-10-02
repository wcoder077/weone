"use client";

import { useState } from "react";
import { formatDayMonth } from "@/lib/format";
import type { ActivityWeek } from "@/lib/queries/activity-stats";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// Weekly activity as thin columns (one series, primary colour, no legend: the title names it).
// Bars ≤ 24 px with a 2 px gap and 4 px rounded tops, from one hairline baseline; empty
// weeks show a 2 px stub. Hover (or tap) shows the week and its count above the bar.
export function ActivityBars({
  weeks,
  className,
  axis = false,
}: {
  weeks: ActivityWeek[];
  className?: string;
  /** First week's date on the left, "Bu hafta" on the right. */
  axis?: boolean;
}) {
  const t = useT();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((sum, w) => sum + w.count, 0);
  const hovered = active === null ? null : weeks[active];

  return (
    <div className="relative">
      <div
        role="img"
        aria-label={t("So'nggi {length} haftada {total} ta faoliyat", { length: weeks.length, total })}
        onPointerLeave={() => setActive(null)}
        className={cn("border-border flex items-end gap-0.5 border-b", className)}
      >
        {weeks.map((w, i) => (
          <div key={w.start} onPointerEnter={() => setActive(i)} className="flex h-full flex-1 items-end justify-center">
            <div
              className={cn(
                "w-full max-w-6 rounded-t-[4px] transition-opacity duration-150",
                w.count ? "bg-primary" : "bg-border",
                active !== null && active !== i && "opacity-40",
              )}
              style={{ height: w.count ? `${Math.max(10, (w.count / max) * 100)}%` : 2 }}
            />
          </div>
        ))}
      </div>
      {hovered ? (
        <span
          className="bg-text text-bg pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full rounded-lg px-2 py-1 text-[12px] font-medium whitespace-nowrap shadow-md"
          style={{ left: `${((active! + 0.5) / weeks.length) * 100}%` }}
        >
          {formatDayMonth(hovered.start)} {" "}{t("haftasi ·")}{" "}{hovered.count} {" "}{t("ta")}</span>
      ) : null}
      {axis && weeks[0] ? (
        <div className="text-muted mt-1.5 flex justify-between text-[11px]">
          <span>{formatDayMonth(weeks[0].start)}</span>
          <span>{t("Bu hafta")}</span>
        </div>
      ) : null}
    </div>
  );
}
