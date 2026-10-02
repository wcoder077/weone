"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { HeaderActions } from "./header-actions";
import { useBarsVisibility } from "./bars-visibility";
import { UnreadBadge } from "@/components/shared/unread-badge";
import { LinkPending } from "./link-pending";
import { useUnreadMessages } from "./unread-messages";
import { desktopNavItems, isActive, isConversationPath } from "./nav-items";
import type { Me } from "./types";
import { useT } from "@/components/i18n/i18n-provider";

export function Navbar({ me }: { me: Me }) {
  const t = useT();
  const pathname = usePathname();
  const { hidden, revealOnKeyboardFocus } = useBarsVisibility();
  const unreadMessages = useUnreadMessages();

  return (
    <header
      data-hidden={hidden}
      onFocus={revealOnKeyboardFocus}
      className={cn(
        // Floating bar: inset from the edges, rounded bottom corners, soft shadow.
        "glass shadow-bar rounded-b-bar sticky top-0 z-40 mx-2 border-t-0 pt-[env(safe-area-inset-top)] transition-transform duration-200 ease-out motion-reduce:transition-none sm:mx-3",
        hidden && "shadow-none! -translate-y-full",
        isConversationPath(pathname) && "max-lg:hidden",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-3 lg:px-6">
        <Logo />

        {/* Mobile: logo left, actions right. Desktop: search + links + actions. */}
        <form action="/discover" role="search" className="hidden max-w-md flex-1 lg:block">
          <label className="relative block">
            <span className="sr-only">{t("Maqsaddoshlar, ko'nikmalar va loyihalarni qidiring")}</span>
            <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <input
              name="q"
              type="search"
              placeholder={t("Maqsaddoshlar, ko'nikmalar, loyihalar")}
              className="bg-surface/60 border-border placeholder:text-muted focus-visible:ring-primary/50 h-11 w-full rounded-full border pr-4 pl-11 text-[15px] outline-none focus-visible:ring-3"
            />
          </label>
        </form>

        <nav aria-label={t("Asosiy menyu")} className="ml-auto hidden items-center gap-1 lg:flex">
          {desktopNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={href === "/messages" && unreadMessages > 0 ? t("{label}, {unreadMessages} ta o'qilmagan", { label, unreadMessages }) : undefined}
                className={cn(
                  "relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors",
                  active ? "text-text" : "text-muted hover:text-text",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                {t(label)}
                {href === "/messages" ? <UnreadBadge count={unreadMessages} className="ml-1.5" /> : null}
                <LinkPending />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto lg:ml-2">
          <HeaderActions me={me} />
        </div>
      </div>
    </header>
  );
}
