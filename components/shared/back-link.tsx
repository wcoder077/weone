"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// Client navigations since this tab loaded the app. A fresh load (deep link,
// installed app opened on an inner page) starts at 0, so "back" can't leave the app.
let inAppNavigations = 0;

// Mounted once in the app layout: counts route changes after the first render.
export function NavigationTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else inAppNavigations += 1;
  }, [pathname]);
  return null;
}

// In-app back (installed PWA has no browser back button). Goes back in history
// when there is in-app history, otherwise to `fallback`.
export function BackLink({ fallback, className }: { fallback: string; className?: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <Link
      href={fallback}
      onClick={(e) => {
        if (inAppNavigations > 0) {
          e.preventDefault();
          router.back();
        }
      }}
      className={cn(
        "text-muted hover:text-text hover:bg-surface -ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-full pr-3 pl-2 text-[15px] font-medium transition-colors",
        className,
      )}
    >
      <ArrowLeft className="size-5" aria-hidden />
      {t("Orqaga")}</Link>
  );
}
