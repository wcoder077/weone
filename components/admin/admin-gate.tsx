"use client";

import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { unlockAdmin } from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/types";
import { useT } from "@/components/i18n/i18n-provider";
import { FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";

type TurnstileApi = {
  render: (element: HTMLElement, options: { sitekey: string; theme: "auto" }) => string;
  reset: (widgetId: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Second step before the panel: a captcha (Cloudflare Turnstile) and a hidden honeypot field.
export function AdminGate({ adminPath }: { adminPath: string }) {
  const t = useT();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await unlockAdmin(prev, formData);
    // A captcha token works once: show a fresh challenge after a failed try.
    if (result?.error && widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    return result;
  }, null);

  useEffect(() => {
    if (!scriptReady || !siteKey || !boxRef.current || widgetId.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(boxRef.current, { sitekey: siteKey, theme: "auto" });
  }, [scriptReady, siteKey]);

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
      <h1 className="inline-flex items-center gap-3 text-2xl font-bold">
        <ShieldCheck className="size-7 shrink-0" aria-hidden />
        {t("Tekshiruv")}
      </h1>
      <p className="text-muted text-[15px]">{t("Davom etish uchun captcha'dan o'ting.")}</p>
      {siteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            // onReady also fires when the script was loaded earlier and this page is shown again.
            onReady={() => setScriptReady(true)}
          />
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="adminPath" value={adminPath} />
            {/* Honeypot: invisible to people; anything typed here is refused. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="admin-website">Website</label>
              <input id="admin-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>
            <div ref={boxRef} className="min-h-[65px]" />
            <FormMessage error={state?.error} />
            <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
              {pending ? t("Tekshirilmoqda…") : t("Davom etish")}
            </Button>
          </form>
        </>
      ) : (
        <FormMessage error="Admin paneli sozlanmagan." />
      )}
    </div>
  );
}
