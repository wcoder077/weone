import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-border text-muted",
  success: "border-success/40 text-success",
  danger: "border-danger/40 text-danger",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-[12px] font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
