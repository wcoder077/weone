"use client";

import { BellOff, BellRing } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { usePush } from "./use-push";

// Settings section: switch push notifications on or off for this device.
export function PushToggle() {
  const t = useT();
  const { state, pending, enable, disable, sendTest } = usePush();

  if (state === "loading") return <div className="bg-surface h-11 w-48 animate-pulse rounded-full" aria-hidden />;

  const hint =
    state === "unsupported"
      ? "Bu brauzer bildirishnomalarni qo'llab-quvvatlamaydi."
      : state === "needs-install"
        ? "iPhone'da bildirishnoma olish uchun saytni Bosh ekranga qo'shing: Ulashish, so'ng «Bosh ekranga qo'shish». Keyin ilovani shu yerdan oching."
        : state === "denied"
          ? "Bildirishnomalar brauzerda bloklangan. Sayt sozlamalaridan ruxsat bering."
          : "Xabar yoki yangilik kelganda, sayt yopiq bo'lsa ham qurilmangizda bildirishnoma chiqadi.";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-[14px]">{t(hint)}</p>
      {state === "off" || state === "on" ? (
        <div className="flex flex-wrap gap-2">
          {state === "off" ? (
            <Button size="lg" onClick={enable} disabled={pending}>
              <BellRing data-icon="inline-start" />
              {t("Bildirishnomalarni yoqish")}
            </Button>
          ) : (
            <>
              <Button size="lg" variant="outline" onClick={sendTest} disabled={pending}>
                <BellRing data-icon="inline-start" />
                {t("Sinab ko'rish")}
              </Button>
              <Button size="lg" variant="outline" onClick={disable} disabled={pending}>
                <BellOff data-icon="inline-start" />
                {t("O'chirish")}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
