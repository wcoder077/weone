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
      className="border-border bg-card flex items-end gap-1 border-t p-2 sm:p-3"
    >
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
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 field-sizing-content max-h-40 min-h-11 flex-1 resize-none rounded-3xl border px-4 py-2.5 text-[15px] leading-snug outline-none focus-visible:ring-3"
      />
      <Button type="submit" size="icon" aria-label="Yuborish" disabled={sending || !draft.trim()}>
        <Send />
      </Button>
    </form>
  );
}
