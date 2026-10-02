"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  THEME_OPTIONS,
  readThemePreference,
  setThemePreference,
  subscribeThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

const ICONS = { system: Monitor, light: Sun, dark: Moon };

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribeThemePreference, readThemePreference, () => "system");
}

// "Tizim" / "Yorug'" / "Qorong'i" as a radio group.
export function ThemeToggle() {
  const t = useT();
  const preference = useThemePreference();

  return (
    <div role="radiogroup" aria-label={t("Mavzu")} className="bg-surface border-border flex w-full gap-1 rounded-full border p-1 sm:w-fit">
      {THEME_OPTIONS.map(({ value, label }) => {
        const Icon = ICONS[value];
        const checked = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setThemePreference(value)}
            className={cn(
              "focus-visible:ring-ring/50 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-3 sm:flex-none",
              checked ? "bg-primary text-on-accent" : "text-muted hover:text-text",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
