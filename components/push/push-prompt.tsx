"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { usePush } from "./use-push";

const DISMISSED_KEY = "push-prompt-dismissed";

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

// A quiet card that asks once, after the person has been using the site for a moment.
// The browser's own permission dialog only appears after they press "Yoqish".
export function PushPrompt() {
  const t = useT();
  const { state, pending, enable } = usePush();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state !== "off" || wasDismissed()) return;
    const timer = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timer);
  }, [state]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Not saved: the card just returns next visit.
    }
  }

  if (!visible || state !== "off") return null;

  return (
    <div
      role="dialog"
      aria-label={t("Bildirishnomalar")}
      className="bg-card/95 border-border rounded-card fixed inset-x-4 bottom-24 z-40 flex items-start gap-3 border p-4 shadow-lg backdrop-blur-xl sm:left-auto sm:max-w-sm lg:bottom-6 lg:right-6"
    >
      <BellRing className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-semibold">{t("Xabarlarni o'tkazib yubormang")}</p>
          <p className="text-muted text-[14px]">{t("Yangi xabar kelsa, sayt yopiq bo'lsa ham bildirishnoma chiqadi.")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setVisible(false);
              enable();
            }}
            disabled={pending}
          >
            {t("Yoqish")}
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            {t("Keyinroq")}
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("Yopish")}
        className="text-muted hover:text-text -m-2 inline-flex size-11 items-center justify-center rounded-full"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
