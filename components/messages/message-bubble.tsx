"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/queries/messages";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MessageActions } from "./message-actions";
import { useLongPress } from "./use-long-press";

type EditHandlers = {
  onEdited: (id: string, body: string, editedAt: string) => void;
  onDeleted: (id: string) => void;
};

// Own messages on the right, the other person's on the left. Text is rendered
// as plain text (React escapes it); line breaks are preserved by CSS.
// `editing` is passed only for own text messages in an open chat.
export function MessageBubble({
  message,
  mine,
  editing,
}: {
  message: ChatMessage;
  mine: boolean;
  editing?: EditHandlers;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useLongPress(() => setMenuOpen(true));

  return (
    <div className={cn("group flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", mine ? "items-end self-end" : "items-start")}>
      <div className="flex max-w-full items-center gap-1">
        {editing ? (
          <MessageActions
            messageId={message.id}
            body={message.body}
            menuOpen={menuOpen}
            onMenuOpenChange={setMenuOpen}
            onEdited={(body, editedAt) => editing.onEdited(message.id, body, editedAt)}
            onDeleted={() => editing.onDeleted(message.id)}
          />
        ) : null}
        <div
          {...(editing ? longPress : {})}
          className={cn(
            "min-w-0 rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-[0_1px_0_rgb(0_0_0/0.04)]",
            mine ? "bg-bubble-mine rounded-br-lg" : "bg-card border-border rounded-bl-lg border",
            // Long-press opens the menu on touch, so the native selection callout is off there ("Nusxa olish" copies).
            editing && "pointer-coarse:touch-callout-none pointer-coarse:select-none",
          )}
        >
          {message.imageUrl ? (
            // Signed URL of a private first-message image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={message.imageUrl} alt="Xabardagi rasm" className="mb-2 max-h-64 rounded-2xl object-cover" />
          ) : null}
          {message.body}
        </div>
      </div>
      <span className="text-muted px-2 text-[11px]">
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        {message.editedAt ? " · tahrirlangan" : null}
      </span>
    </div>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-2 flex justify-center" role="separator" aria-label={label}>
      <span className="bg-card border-border text-muted rounded-full border px-3 py-1 text-[12px] font-medium">{label}</span>
    </div>
  );
}
