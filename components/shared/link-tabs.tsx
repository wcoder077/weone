import Link from "next/link";
import { cn } from "@/lib/utils";

// URL-driven tabs (?tab=...), so the active tab survives reloads and shared links.
export function LinkTabs({
  tabs,
  active,
  label,
}: {
  tabs: { value: string; label: string; href: string; count?: number }[];
  active: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="bg-surface border-border flex w-full gap-1 overflow-x-auto rounded-full border p-1 sm:w-fit">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-[14px] font-medium whitespace-nowrap transition-colors sm:flex-none",
              isActive ? "bg-primary text-primary-foreground" : "text-muted hover:text-text",
            )}
          >
            {tab.label}
            {tab.count ? <span className={isActive ? "opacity-80" : "text-muted"}>{tab.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
