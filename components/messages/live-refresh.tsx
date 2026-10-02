"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, subscribeWithAuth } from "@/lib/supabase/client";

// Re-fetches the conversation list (previews, unread counts) when a message arrives
// in any of the user's chats. Realtime only delivers rows RLS lets the user read.
export function LiveConversationRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeWithAuth(supabase, () =>
      supabase
        .channel("conversation-list")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
          clearTimeout(timer);
          timer = setTimeout(() => router.refresh(), 400);
        }),
      // Back from a hidden tab: reload the list once for anything missed.
      (_, resumed) => {
        if (resumed) router.refresh();
      },
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [router]);

  return null;
}
