"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient, subscribeWithAuth } from "@/lib/supabase/client";

// Fired by the chat after it marks a conversation read.
export const MESSAGES_READ_EVENT = "weone:messages-read";

const UnreadMessagesContext = createContext(0);

// Total unread messages for the nav badge (muted chats excluded). Starts from the server count, then
// re-counts (my_unread_counts RPC, RLS-safe) when someone else's message arrives
// or a chat is marked read.
export function UnreadMessagesProvider({
  meId,
  initial,
  children,
}: {
  meId: string;
  initial: number;
  children: ReactNode;
}) {
  const [count, setCount] = useState(initial);
  const [serverCount, setServerCount] = useState(initial);

  // The layout re-rendered (router.refresh) with a fresh count.
  if (initial !== serverCount) {
    setServerCount(initial);
    setCount(initial);
  }

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function recount() {
      const { data, error } = await supabase.rpc("my_unread_counts");
      if (!error) setCount(data.reduce((sum, r) => sum + (r.muted ? 0 : r.unread), 0));
    }
    // Debounced so the open chat can mark the message read first.
    function scheduleRecount() {
      clearTimeout(timer);
      timer = setTimeout(() => void recount(), 600);
    }

    const unsubscribe = subscribeWithAuth(supabase, () =>
      supabase
        .channel(`unread-messages:${meId}`)
        .on<{ sender_id: string }>(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          ({ new: row }) => {
            if (row.sender_id !== meId) scheduleRecount();
          },
        )
    );
    window.addEventListener(MESSAGES_READ_EVENT, scheduleRecount);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(MESSAGES_READ_EVENT, scheduleRecount);
      unsubscribe();
    };
  }, [meId]);

  return <UnreadMessagesContext.Provider value={count}>{children}</UnreadMessagesContext.Provider>;
}

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext);
}
