"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient, subscribeWithAuth } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

const NOBODY = new Set<string>();
const NO_TIMES = new Map<string, string>();
const OnlineContext = createContext<Set<string>>(NOBODY);
// When a user went offline while this tab watched (fresher than the stored last-seen time).
const LeftAtContext = createContext<Map<string, string>>(NO_TIMES);

// While the app is visible, the last-seen time is refreshed this often (the database
// also stamps it on open and on hide, and ignores calls closer than 30 seconds).
const LAST_SEEN_EVERY_MS = 3 * 60_000;

// Who is online right now, via Supabase Realtime Presence (the presence itself writes
// nothing; only the last-seen time is stamped through touch_last_seen).
// Every signed-in tab joins one channel keyed by the user's id; a user counts as
// online while at least one of their tabs is open and visible. Hiding the tab (or
// closing the app) leaves the channel, so the green dot disappears within seconds.
export function OnlinePresenceProvider({ meId, children }: { meId: string; children: ReactNode }) {
  const [online, setOnline] = useState<Set<string>>(NOBODY);
  const [leftAt, setLeftAt] = useState<Map<string, string>>(NO_TIMES);
  const onlineRef = useRef<Set<string>>(NOBODY);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const visible = () => document.visibilityState === "visible";
    const touchLastSeen = () => void supabase.rpc("touch_last_seen");
    function onVisibility() {
      touchLastSeen();
      if (!channel) return;
      if (visible()) void channel.track({});
      else void channel.untrack();
    }
    function onSync(now: Set<string>) {
      const gone = [...onlineRef.current].filter((id) => !now.has(id));
      onlineRef.current = now;
      setOnline(now);
      if (gone.length === 0) return;
      const at = new Date().toISOString();
      setLeftAt((prev) => new Map([...prev, ...gone.map((id) => [id, at] as const)]));
    }

    // subscribeWithAuth also leaves the channel after a minute in the background.
    const unsubscribe = subscribeWithAuth(
      supabase,
      () => {
        const ch = supabase.channel("online-users", { config: { presence: { key: meId } } });
        return ch.on("presence", { event: "sync" }, () => onSync(new Set(Object.keys(ch.presenceState()))));
      },
      (ch) => {
        channel = ch;
        if (visible()) void ch.track({});
      },
    );
    document.addEventListener("visibilitychange", onVisibility);
    touchLastSeen();
    const heartbeat = setInterval(() => {
      if (visible()) touchLastSeen();
    }, LAST_SEEN_EVERY_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(heartbeat);
      unsubscribe();
    };
  }, [meId]);

  return (
    <OnlineContext.Provider value={online}>
      <LeftAtContext.Provider value={leftAt}>{children}</LeftAtContext.Provider>
    </OnlineContext.Provider>
  );
}

export function useIsOnline(userId: string | undefined) {
  const online = useContext(OnlineContext);
  return Boolean(userId && online.has(userId));
}

// When this user went offline while the app was open, or null.
export function useLeftAt(userId: string | undefined) {
  const leftAt = useContext(LeftAtContext);
  return (userId && leftAt.get(userId)) || null;
}

// Green dot on an avatar, only while that user is online.
export function OnlineDot({ userId, className }: { userId: string; className?: string }) {
  const t = useT();
  if (!useIsOnline(userId)) return null;
  return (
    <span
      role="img"
      aria-label={t("Onlayn")}
      className={cn("bg-success ring-card absolute right-0 bottom-0 size-3 rounded-full ring-2", className)}
    />
  );
}

// "Onlayn" next to a name (profile header).
export function OnlineLabel({ userId }: { userId: string }) {
  const t = useT();
  if (!useIsOnline(userId)) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="bg-success size-2 rounded-full" aria-hidden />
      {t("Onlayn")}</span>
  );
}
