import { cn } from "@/lib/utils";

// Red count badge; shows "9+" above nine. Renders nothing for zero.
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "bg-danger text-on-accent flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] leading-none font-semibold",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
