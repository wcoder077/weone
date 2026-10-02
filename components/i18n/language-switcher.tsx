"use client";

import { useTransition } from "react";
import { setLanguage } from "@/lib/actions/language";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n/core";
import { cn } from "@/lib/utils";
import { useLang, useT } from "./i18n-provider";

// "O'zbekcha / English / Русский" as a radio group (same look as the theme switch).
export function LanguageSwitcher({ className }: { className?: string }) {
  const lang = useLang();
  const t = useT();
  const [pending, startTransition] = useTransition();

  function choose(next: Lang) {
    if (next === lang) return;
    startTransition(() => setLanguage(next));
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("Til")}
      aria-busy={pending}
      className={cn("bg-surface border-border flex w-full gap-1 rounded-full border p-1 sm:w-fit", className)}
    >
      {LANGS.map((value) => {
        const checked = value === lang;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            lang={value}
            disabled={pending}
            onClick={() => choose(value)}
            className={cn(
              "focus-visible:ring-ring/50 inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-[14px] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-3 sm:flex-none",
              checked ? "bg-primary text-on-accent" : "text-muted hover:text-text",
            )}
          >
            {LANG_NAMES[value]}
          </button>
        );
      })}
    </div>
  );
}
