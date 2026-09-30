"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { HeaderActions } from "./header-actions";
import { desktopNavItems, isActive } from "./nav-items";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 lg:px-8">
        <Logo />

        {/* Mobile: logo left, actions right. Desktop: search + links + actions. */}
        <form action="/find" role="search" className="hidden max-w-md flex-1 lg:block">
          <label className="relative block">
            <span className="sr-only">{"Odamlar, ko'nikmalar va loyihalarni qidiring"}</span>
            <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <input
              name="q"
              type="search"
              placeholder="Odamlar, ko'nikmalar, loyihalar"
              className="bg-surface/60 border-border placeholder:text-muted focus-visible:ring-primary/50 h-11 w-full rounded-full border pr-4 pl-11 text-[15px] outline-none focus-visible:ring-3"
            />
          </label>
        </form>

        <nav aria-label="Asosiy menyu" className="ml-auto hidden items-center gap-1 lg:flex">
          {desktopNavItems.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-medium transition-colors",
                  active ? "text-text" : "text-muted hover:text-text",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto lg:ml-2">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
