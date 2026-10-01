"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/lib/actions/messages";
import type { ChatMessage } from "@/lib/queries/messages";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";

// Text + emoji only. Enter sends, Shift+Enter adds a line.
export function ChatComposer({ conversationId, onSent }: { conversationId: string; onSent: (message: ChatMessage) => void }) {
  const [draft, setDraft] = useState("");
  const [sending, startSending] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  function send() {
    const body = draft.trim();
    if (!body || sending) return;
    startSending(async () => {
      const result = await sendMessage(conversationId, body);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onSent(result.message);
      setDraft("");
      fieldRef.current?.focus();
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="border-border bg-card flex shrink-0 items-end gap-2 border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {/* Telegram-style pill: emoji on the left, text in the middle. */}
      <div className="border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-w-0 flex-1 items-end rounded-3xl border focus-within:ring-3">
        <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, draft, emoji, setDraft)} />
        <label className="sr-only" htmlFor="message-input">
          Xabar
        </label>
        <textarea
          id="message-input"
          ref={fieldRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={4000}
          placeholder="Xabar yozing…"
          className="field-sizing-content max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 pr-4 text-[15px] leading-snug outline-none"
        />
      </div>
      <Button type="submit" size="icon" aria-label="Yuborish" disabled={sending || !draft.trim()}>
        <Send />
      </Button>
    </form>
  );
}
