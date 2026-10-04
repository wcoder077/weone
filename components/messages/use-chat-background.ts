import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  CHAT_BACKGROUND_KEY,
  DEFAULT_CHAT_BACKGROUND,
  parseChatBackground,
  type ChatBackground,
} from "@/lib/chat-background";

const CHANGED = "chat-background-changed";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function read() {
  try {
    return localStorage.getItem(CHAT_BACKGROUND_KEY) ?? "";
  } catch {
    return ""; // Storage blocked (private window): the default background, nothing saved.
  }
}

// The saved background of this device. The server and the first render use the default, then the saved one appears.
export function useChatBackground() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const background = useMemo(() => (raw ? parseChatBackground(raw) : DEFAULT_CHAT_BACKGROUND), [raw]);

  const save = useCallback((next: ChatBackground) => {
    try {
      localStorage.setItem(CHAT_BACKGROUND_KEY, JSON.stringify(next));
    } catch {
      // Not saved: the choice lasts until the page closes.
    }
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return [background, save] as const;
}
