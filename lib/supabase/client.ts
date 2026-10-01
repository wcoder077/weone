import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { requireSupabaseEnv } from "./env";

export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}

// Realtime joins a channel with whatever token it holds at that moment. The
// browser client reads the session from cookies asynchronously, so a channel
// subscribed right away joins as anon and RLS filters out every row. Load the
// user's token first, then subscribe. Returns the cleanup for useEffect.
// `onSubscribed` runs each time the channel is (re)joined.
export function subscribeWithAuth(
  supabase: SupabaseClient<Database>,
  build: () => RealtimeChannel,
  onSubscribed?: (channel: RealtimeChannel) => void,
): () => void {
  let channel: RealtimeChannel | null = null;
  let cancelled = false;
  void supabase.realtime.setAuth().then(() => {
    if (cancelled) return;
    const ch = build();
    channel = ch.subscribe((status) => {
      if (status === "SUBSCRIBED") onSubscribed?.(ch);
    });
  });
  return () => {
    cancelled = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
