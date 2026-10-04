"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CHAT_TINTS, DEFAULT_CHAT_BACKGROUND } from "@/lib/chat-background";
import { cn } from "@/lib/utils";
import { useChatBackground } from "./use-chat-background";

const FALLBACK_COLOR = "#3d4bff";

// A button in the chat header that opens the background choices: a few tints, any colour, the pattern on or off.
export function ChatBackgroundPicker() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [background, save] = useChatBackground();
  const custom = background.color !== null && !CHAT_TINTS.some((tint) => tint.color === background.color);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("Chat foni")}
        className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-3"
      >
        <Palette className="size-5" aria-hidden />
      </button>

      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Chat foni" description="Tanlov faqat shu qurilmada saqlanadi.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t("Rang")}>
            <Swatch label={t("Standart")} selected={background.color === null} onClick={() => save({ ...background, color: null })} />
            {CHAT_TINTS.map((tint) => (
              <Swatch
                key={tint.color}
                label={t(tint.label)}
                color={tint.color}
                selected={background.color === tint.color}
                onClick={() => save({ ...background, color: tint.color })}
              />
            ))}
            <label
              className={cn(
                "relative inline-flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2",
                custom ? "border-primary" : "border-border",
              )}
              title={t("O'z rangim")}
            >
              <input
                type="color"
                aria-label={t("O'z rangim")}
                value={background.color ?? FALLBACK_COLOR}
                onChange={(event) => save({ ...background, color: event.target.value })}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span aria-hidden className="size-full" style={{ background: custom ? (background.color ?? undefined) : "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
            </label>
          </div>

          <label className="border-border flex min-h-11 items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-[14px]">
            {t("Naqsh (fon rasmi)")}
            <Switch checked={background.pattern} onCheckedChange={(pattern) => save({ ...background, pattern })} />
          </label>

          <Button variant="outline" size="lg" onClick={() => save(DEFAULT_CHAT_BACKGROUND)}>
            {t("Asl holiga qaytarish")}
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}

function Swatch({ label, color, selected, onClick }: { label: string; color?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={cn(
        "bg-surface inline-flex size-11 items-center justify-center rounded-full border-2 transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-primary" : "border-border",
      )}
      style={color ? { backgroundColor: `color-mix(in oklab, ${color} 55%, var(--surface))` } : undefined}
    >
      {selected ? <Check className="size-4" aria-hidden /> : null}
    </button>
  );
}
