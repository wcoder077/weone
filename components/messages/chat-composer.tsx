"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { FileText, Loader2, Send, Video, X } from "lucide-react";
import { toast } from "sonner";
import {
  ATTACHMENT_BUCKET,
  attachmentKindOf,
  attachmentPath,
  attachmentProblem,
  formatBytes,
  type AttachmentKind,
} from "@/lib/attachments";
import { sendAttachment, sendMessage } from "@/lib/actions/messages";
import type { ChatMessage } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/client";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";
import { AttachMenu } from "./attach-menu";

type Staged = { file: File; kind: AttachmentKind; previewUrl: string | null };

// Text + emoji, plus one photo / video / file at a time (with an optional caption).
// Enter sends, Shift+Enter adds a line.
export function ChatComposer({
  conversationId,
  meId,
  onSent,
}: {
  conversationId: string;
  meId: string;
  onSent: (message: ChatMessage) => void;
}) {
  const [draft, setDraft] = useState("");
  const [staged, setStaged] = useState<Staged | null>(null);
  const [sending, startSending] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Free the thumbnail's object URL when it is replaced, removed or the chat closes.
  useEffect(() => {
    const url = staged?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [staged]);

  function stage(file: File) {
    const problem = attachmentProblem(file);
    const kind = attachmentKindOf(file.type);
    if (problem || !kind) {
      toast.error(problem ?? "Bu turdagi faylni yuborib bo'lmaydi");
      return;
    }
    setStaged({ file, kind, previewUrl: kind === "image" ? URL.createObjectURL(file) : null });
    fieldRef.current?.focus();
  }

  function send() {
    const body = draft.trim();
    if ((!body && !staged) || sending) return;
    startSending(async () => {
      const result = staged ? await uploadAndSend(staged, body) : await sendMessage(conversationId, body);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onSent(result.message);
      setDraft("");
      setStaged(null);
      fieldRef.current?.focus();
    });
  }

  async function uploadAndSend(item: Staged, caption: string) {
    const path = attachmentPath(meId, conversationId, item.file.type);
    const { error } = await createClient()
      .storage.from(ATTACHMENT_BUCKET)
      .upload(path, item.file, { contentType: item.file.type });
    if (error) return { error: "Faylni yuklab bo'lmadi. Qayta urinib ko'ring." };
    return sendAttachment(conversationId, { path, name: item.file.name, kind: item.kind, size: item.file.size }, caption);
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
      className="border-border bg-card flex shrink-0 flex-col gap-2 border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {staged ? <StagedPreview staged={staged} sending={sending} onRemove={() => setStaged(null)} /> : null}
      <div className="flex items-end gap-2">
        {/* Telegram-style pill: emoji on the left, text in the middle, paperclip on the right. */}
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
            placeholder={staged ? "Izoh qo'shing…" : "Xabar yozing…"}
            className="field-sizing-content max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-snug outline-none"
          />
          <AttachMenu onPick={stage} disabled={sending} />
        </div>
        <Button type="submit" size="icon" aria-label="Yuborish" disabled={sending || (!draft.trim() && !staged)}>
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
    </form>
  );
}

function StagedPreview({ staged, sending, onRemove }: { staged: Staged; sending: boolean; onRemove: () => void }) {
  const { file, kind, previewUrl } = staged;
  return (
    <div className="bg-surface/60 flex items-center gap-3 rounded-2xl p-2">
      {previewUrl ? (
        // Local object URL of the picked photo.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="bg-primary text-on-accent flex size-12 shrink-0 items-center justify-center rounded-xl">
          {kind === "video" ? <Video className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-medium">{file.name}</span>
        <span className="text-muted text-[12px]">{sending ? "Yuborilmoqda…" : formatBytes(file.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={sending}
        aria-label="Biriktirilgan faylni olib tashlash"
        className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
