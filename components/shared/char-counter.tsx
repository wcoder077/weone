"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// "x/200" live counter; turns red above the limit. Count graphemes with lib/text.
export function CharCounter({ count, max, id }: { count: number; max: number; id?: string }) {
  const t = useT();
  const over = count > max;
  return (
    <span
      id={id}
      aria-live="polite"
      className={cn("text-[13px] tabular-nums", over ? "text-danger font-semibold" : "text-muted")}
    >
      {count}/{max}
      {over ? <span className="sr-only"> {" "}{t("— juda uzun")}</span> : null}
    </span>
  );
}
