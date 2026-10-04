"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useBarsVisibility } from "./bars-visibility";
import { UnreadBadge } from "@/components/shared/unread-badge";
import { LinkPending } from "./link-pending";
import { ProfileTab } from "./profile-tab";
import type { Me } from "./types";
import { useUnreadMessages } from "./unread-messages";
import { isActive, isConversationPath, navItems } from "./nav-items";
import { useT } from "@/components/i18n/i18n-provider";

export function MobileTabBar({ me }: { me: Me }) {
  const username = me.username;
  const t = useT();
  const pathname = usePathname();
  const { hidden, revealOnKeyboardFocus } = useBarsVisibility();
  const unreadMessages = useUnreadMessages();
  const activeIndex = navItems.findIndex((item) => isActive(pathname, item.href === "/profile" ? `/u/${username}` : item.href));

  return (
    <nav
      aria-label={t("Asosiy menyu")}
      data-hidden={hidden}
      onFocus={revealOnKeyboardFocus}
      className={cn(
        // Docked bar with rounded top corners matching the header's bottom corners.
        "glass shadow-bar-up rounded-t-bar fixed inset-x-2 bottom-0 z-40 flex border-b-0 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden",
        hidden && "shadow-none! translate-y-full",
        isConversationPath(pathname) && "hidden",
      )}
    >
      {/* The blue pill is one element that slides to the active tab (and follows a swipe). */}
      <div className="relative flex flex-1">
        <span
          aria-hidden
          className={cn(
            "bg-primary pointer-events-none absolute inset-y-0 left-0 rounded-full transition-[transform,opacity] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none [html[data-swiping]_&]:transition-none",
            activeIndex < 0 && "opacity-0",
          )}
          style={{
            width: `${100 / navItems.length}%`,
            transform: `translateX(calc((${Math.max(activeIndex, 0)} + var(--tab-progress, 0)) * 100%))`,
          }}
        />
      {navItems.map(({ href: itemHref, label, icon: Icon }) => {
        const href = itemHref === "/profile" ? `/u/${username}` : itemHref;
        const active = isActive(pathname, href);
        if (itemHref === "/profile") return <ProfileTab key={href} me={me} href={href} active={active} />;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={href === "/messages" && unreadMessages > 0 ? t("{label}, {unreadMessages} ta o'qilmagan", { label, unreadMessages }) : undefined}
            className={cn(
              "relative z-10 flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[13px] font-medium transition-colors",
              active ? "text-primary-foreground" : "text-muted",
            )}
          >
            <span className="relative">
              <Icon className="size-5" aria-hidden />
              {href === "/messages" ? <UnreadBadge count={unreadMessages} className="absolute -top-1.5 left-3" /> : null}
            </span>
            <span>{t(label)}</span>
            <LinkPending />
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
