"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// A small built-in set instead of a heavy emoji library.
const GROUPS = [
  {
    label: "Yuzlar",
    emojis: "😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😎 🤓 🧐 🤔 🤗 🤭 😐 😏 😌 😴 😮 😢 😭 😤 😡 🥳 😬 🙃 🫡".split(" "),
  },
  {
    label: "Qo'llar",
    emojis: "👍 👎 👌 ✌️ 🤞 🤝 👏 🙌 🙏 💪 👋 ✋ 🫶 👀 🧠 🫵 ☝️ 👉 👈 🤙".split(" "),
  },
  {
    label: "Ish",
    emojis: "💻 📱 ⌨️ 🖥️ 🧑‍💻 👩‍💻 🚀 🎯 🏆 🥇 📈 📊 💡 🛠️ ⚙️ 🧪 📚 📝 📌 🗓️ ⏰ ☕ 🎨 🎮 🎓 💼 🤖 🔒".split(" "),
  },
  {
    label: "Belgilar",
    emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💯 ✨ 🔥 ⭐ 🌟 ⚡ ✅ ❌ ❓ ❗ 🎉 🎊 💬 👋 🇺🇿 🌍".split(" "),
  },
];

export function EmojiPicker({ onPick, disabled }: { onPick: (emoji: string) => void; disabled?: boolean }) {
  const t = useT();
  const [group, setGroup] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={t("Emoji qo'shish")}
        className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        <Smile className="size-5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="glass-panel w-[min(20rem,calc(100vw-2rem))] gap-2 rounded-2xl p-2">
        <div role="tablist" aria-label={t("Emoji turlari")} className="flex gap-1">
          {GROUPS.map((g, i) => (
            <button
              key={g.label}
              type="button"
              role="tab"
              aria-selected={group === i}
              onClick={() => setGroup(i)}
              className={cn(
                "min-h-9 flex-1 rounded-full px-2 text-[12px] font-medium transition-colors duration-150",
                group === i ? "bg-surface text-text" : "text-muted hover:text-text",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={GROUPS[group].label} className="grid grid-cols-8 gap-0.5">
          {GROUPS[group].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={emoji}
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className="hover:bg-surface focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-lg text-xl outline-none focus-visible:ring-2"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inserts `text` at the textarea's caret (replacing a selection) and restores focus after it.
export function insertAtCursor(
  field: HTMLTextAreaElement | null,
  value: string,
  text: string,
  setValue: (next: string) => void,
) {
  const start = field?.selectionStart ?? value.length;
  const end = field?.selectionEnd ?? value.length;
  setValue(value.slice(0, start) + text + value.slice(end));
  requestAnimationFrame(() => {
    if (!field) return;
    field.focus();
    field.setSelectionRange(start + text.length, start + text.length);
  });
}
