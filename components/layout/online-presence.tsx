"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient, subscribeWithAuth } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NOBODY = new Set<string>();
const OnlineContext = createContext<Set<string>>(NOBODY);

// Who is online right now, via Supabase Realtime Presence (no database writes).
// Every signed-in tab joins one channel keyed by the user's id; a user counts as
// online while at least one of their tabs is open and visible. Hiding the tab (or
// closing the app) leaves the channel, so the green dot disappears within seconds.
export function OnlinePresenceProvider({ meId, children }: { meId: string; children: ReactNode }) {
  const [online, setOnline] = useState<Set<string>>(NOBODY);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const visible = () => document.visibilityState === "visible";
    function onVisibility() {
      if (!channel) return;
      if (visible()) void channel.track({});
      else void channel.untrack();
    }

    // subscribeWithAuth also leaves the channel after a minute in the background.
    const unsubscribe = subscribeWithAuth(
      supabase,
      () => {
        const ch = supabase.channel("online-users", { config: { presence: { key: meId } } });
        return ch.on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(ch.presenceState()))));
      },
      (ch) => {
        channel = ch;
        if (visible()) void ch.track({});
      },
    );
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [meId]);

  return <OnlineContext.Provider value={online}>{children}</OnlineContext.Provider>;
}

export function useIsOnline(userId: string | undefined) {
  const online = useContext(OnlineContext);
  return Boolean(userId && online.has(userId));
}

// Green dot on an avatar, only while that user is online.
export function OnlineDot({ userId, className }: { userId: string; className?: string }) {
  if (!useIsOnline(userId)) return null;
  return (
    <span
      role="img"
      aria-label="Onlayn"
      className={cn("bg-success ring-card absolute right-0 bottom-0 size-3 rounded-full ring-2", className)}
    />
  );
}

// "Onlayn" next to a name (profile header).
export function OnlineLabel({ userId }: { userId: string }) {
  if (!useIsOnline(userId)) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="bg-success size-2 rounded-full" aria-hidden />
      Onlayn
    </span>
  );
}
