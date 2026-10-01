"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useBarsVisibility } from "./bars-visibility";
import { isActive, navItems } from "./nav-items";

export function MobileTabBar({ username }: { username: string }) {
  const pathname = usePathname();
  const { hidden, revealOnKeyboardFocus } = useBarsVisibility();

  return (
    <nav
      aria-label="Asosiy menyu"
      data-hidden={hidden}
      onFocus={revealOnKeyboardFocus}
      className={cn(
        // Docked bar with rounded top corners matching the header's bottom corners.
        "glass shadow-bar-up rounded-t-bar fixed inset-x-2 bottom-0 z-40 flex justify-between border-b-0 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden",
        hidden && "translate-y-full",
      )}
    >
      {navItems.map(({ href: itemHref, label, icon: Icon }) => {
        const href = itemHref === "/profile" ? `/u/${username}` : itemHref;
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[13px] font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
