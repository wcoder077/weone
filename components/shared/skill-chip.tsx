import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const base = "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap";

// Read-only chip. `matched` = the skill satisfies someone's requirement.
export function SkillChip({
  children,
  matched = false,
  className,
}: {
  children: ReactNode;
  matched?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        base,
        "h-8 px-3 text-[13px]",
        matched ? "border-primary bg-primary/10 text-text" : "border-border bg-surface text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Selectable chip for pickers and filters; selected = solid primary.
export function ToggleChip({
  selected,
  className,
  ...props
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        base,
        "focus-visible:ring-ring/50 min-h-11 px-4 text-[15px] transition-colors outline-none focus-visible:ring-3 disabled:opacity-50",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted hover:text-text",
        className,
      )}
      {...props}
    />
  );
}
