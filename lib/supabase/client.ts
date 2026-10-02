import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { requireSupabaseEnv } from "./env";

export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}

// A tab hidden this long leaves its channels; the socket closes once none are left,
// so background tabs don't hold one of the project's limited Realtime connections.
const HIDDEN_LEAVE_MS = 60_000;

// Realtime joins a channel with whatever token it holds at that moment. The
// browser client reads the session from cookies asynchronously, so a channel
// subscribed right away joins as anon and RLS filters out every row. Load the
// user's token first, then subscribe. Returns the cleanup for useEffect.
// `onSubscribed` runs each time the channel is (re)joined; `resumed` is true when
// it rejoins after the tab was hidden, so the caller can fetch what it missed.
export function subscribeWithAuth(
  supabase: SupabaseClient<Database>,
  build: () => RealtimeChannel,
  onSubscribed?: (channel: RealtimeChannel, resumed: boolean) => void,
): () => void {
  let channel: RealtimeChannel | null = null;
  let cancelled = false;
  let paused = false;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  function join(resumed: boolean) {
    void supabase.realtime.setAuth().then(() => {
      if (cancelled || paused || channel) return;
      const ch = build();
      channel = ch.subscribe((status) => {
        if (status === "SUBSCRIBED") onSubscribed?.(ch, resumed);
      });
    });
  }
  function leave() {
    if (channel) void supabase.removeChannel(channel);
    channel = null;
  }
  function onVisibility() {
    clearTimeout(leaveTimer);
    if (document.visibilityState === "hidden") {
      leaveTimer = setTimeout(() => {
        paused = true;
        leave();
      }, HIDDEN_LEAVE_MS);
    } else if (paused) {
      paused = false;
      join(true);
    }
  }

  join(false);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    cancelled = true;
    clearTimeout(leaveTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    leave();
  };
}
