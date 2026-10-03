"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useLang } from "@/components/i18n/i18n-provider";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/lib/actions/push";
import { toast } from "@/lib/toast";
import {
  getCurrentSubscription,
  getPushSupport,
  subscribeToPush,
  unsubscribeFromPush,
  type PushSupport,
} from "@/lib/push/client";

export type PushState = "loading" | PushSupport | "denied" | "off" | "on";

// One place that knows whether this device gets push notifications and can switch them on or off.
export function usePush() {
  const lang = useLang();
  const [state, setState] = useState<PushState>("loading");
  const [pending, startTransition] = useTransition();

  const refreshState = useCallback(async () => {
    const support = getPushSupport();
    if (support !== "ready") return setState(support);
    if (Notification.permission === "denied") return setState("denied");
    setState((await getCurrentSubscription()) && Notification.permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    // Reading browser state: it does not exist on the server, so it is set after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshState();
  }, [refreshState]);

  function enable() {
    startTransition(async () => {
      const result = await subscribeToPush();
      if (!result.ok) {
        if (result.reason === "denied") toast.error("Ruxsat berilmadi. Brauzer sozlamalaridan yoqishingiz mumkin.");
        else toast.error("Bu qurilmada bildirishnomalarni yoqib bo'lmadi.");
        return void refreshState();
      }
      const saved = await savePushSubscription({ ...result, lang });
      if (!saved.ok) toast.error(saved.error);
      else toast.success("Bildirishnomalar yoqildi");
      void refreshState();
    });
  }

  function disable() {
    startTransition(async () => {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await removePushSubscription(endpoint);
      toast.success("Bildirishnomalar o'chirildi");
      void refreshState();
    });
  }

  function sendTest() {
    startTransition(async () => {
      const result = await sendTestPush();
      if (!result.ok) toast.error(result.error);
      else toast.message("Sinov bildirishnomasi yuborildi");
    });
  }

  return { state, pending, enable, disable, sendTest };
}
