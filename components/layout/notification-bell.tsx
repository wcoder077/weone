"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient, subscribeWithAuth } from "@/lib/supabase/client";

// Unread badge that counts new notifications live (Realtime respects RLS:
// only the user's own rows arrive). Opening /notifications clears it.
export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const pathname = usePathname();
  const onPage = pathname === "/notifications";
  const [count, setCount] = useState(onPage ? 0 : initialUnread);
  const [wasOnPage, setWasOnPage] = useState(onPage);
  const [serverCount, setServerCount] = useState(initialUnread);

  // Visiting the notifications page marks everything read: drop the badge.
  if (onPage !== wasOnPage) {
    setWasOnPage(onPage);
    if (onPage) setCount(0);
  }
  // The layout re-rendered (refresh / server action) with a fresh count: trust it.
  if (initialUnread !== serverCount) {
    setServerCount(initialUnread);
    setCount(onPage ? 0 : initialUnread);
  }

  useEffect(() => {
    const supabase = createClient();
    const unsubscribe = subscribeWithAuth(supabase, () =>
      supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => setCount((n) => n + 1),
        ),
      // Back from a hidden tab: re-count what arrived meanwhile.
      async (_, resumed) => {
        if (!resumed) return;
        const { count: unread } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("read", false);
        if (unread !== null) setCount(unread);
      },
    );
    return () => {
      unsubscribe();
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Bildirishnomalar, ${count} ta yangi` : "Bildirishnomalar"}
      className="text-muted hover:text-text relative inline-flex size-11 items-center justify-center rounded-full transition-colors"
    >
      <Bell className="size-5" />
      {count > 0 && !onPage ? (
        <span className="bg-danger absolute top-1.5 right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-on-accent">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
