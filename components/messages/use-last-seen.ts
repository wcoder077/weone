import { useSyncExternalStore } from "react";
import { useT } from "@/components/i18n/i18n-provider";
import { useIsOnline, useLeftAt } from "@/components/layout/online-presence";
import { formatRelative } from "@/lib/format";

// Re-renders once a minute so "5 daqiqa oldin" stays current.
function subscribeMinute(onTick: () => void) {
  const id = setInterval(onTick, 60_000);
  return () => clearInterval(id);
}

function latest(a: string | null, b: string | null) {
  if (!a || !b) return a ?? b;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

// Chat header status: "Onlayn" or "Oxirgi marta: 5 daqiqa oldin". Empty when unknown
// (no userId = not connected) and on the server, whose clock differs from the viewer's.
export function useLastSeenLabel(userId: string | undefined, storedAt: string | null) {
  const t = useT();
  const online = useIsOnline(userId);
  const seenAt = latest(storedAt, useLeftAt(userId));
  return useSyncExternalStore(
    subscribeMinute,
    () => {
      if (!userId) return "";
      if (online) return t("Onlayn");
      return seenAt ? t("Oxirgi marta: {time}", { time: formatRelative(seenAt, t) }) : "";
    },
    () => "",
  );
}
