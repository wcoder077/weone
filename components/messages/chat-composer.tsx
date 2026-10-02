"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { FileText, Loader2, Reply, Send, Video, X } from "lucide-react";
import { toast } from "sonner";
import {
  ATTACHMENT_BUCKET,
  ATTACHMENTS_ENABLED,
  attachmentKindOf,
  attachmentPath,
  attachmentProblem,
  formatBytes,
  type AttachmentKind,
} from "@/lib/attachments";
import { sendAttachment, sendMessage } from "@/lib/actions/messages";
import type { ChatMessage, ChatReply } from "@/lib/queries/messages";
import { PHOTO_MAX_SIDE, shrinkImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";
import { AttachMenu } from "./attach-menu";
import { useT } from "@/components/i18n/i18n-provider";

type Staged = { file: File; kind: AttachmentKind; previewUrl: string | null };

// Text + emoji, plus one photo / video / file at a time (with an optional caption).
// `replyTo` quotes a message (Esc or ✕ cancels). Enter sends, Shift+Enter adds a line.
export function ChatComposer({
  conversationId,
  meId,
  onSent,
  replyTo,
  replyName,
  onCancelReply,
}: {
  conversationId: string;
  meId: string;
  onSent: (message: ChatMessage) => void;
  replyTo: ChatReply | null;
  replyName: string;
  onCancelReply: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [staged, setStaged] = useState<Staged | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sending, startSending] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Choosing "Javob berish" puts the cursor in the field.
  useEffect(() => {
    if (replyTo) fieldRef.current?.focus();
  }, [replyTo]);

  // Free the thumbnail's object URL when it is replaced, removed or the chat closes.
  useEffect(() => {
    const url = staged?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [staged]);

  // Photos are shrunk in the browser first (WebP, ≤ 1600 px), then checked against the limit.
  async function stage(picked: File) {
    setPreparing(true);
    const file = attachmentKindOf(picked.type) === "image" ? await shrinkImage(picked, PHOTO_MAX_SIDE) : picked;
    setPreparing(false);
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
    if ((!body && !staged) || sending || preparing) return;
    startSending(async () => {
      const result = staged
        ? await uploadAndSend(staged, body)
        : await sendMessage(conversationId, body, replyTo?.id);
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
    return sendAttachment(
      conversationId,
      { path, name: item.file.name, kind: item.kind, size: item.file.size },
      caption,
      replyTo?.id,
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape" && replyTo) {
      e.preventDefault();
      onCancelReply();
      return;
    }
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
      {replyTo ? (
        <div className="bg-surface/60 flex items-center gap-2 rounded-2xl py-1 pr-1 pl-3">
          <Reply className="text-primary size-4 shrink-0" aria-hidden />
          <span className="border-primary min-w-0 flex-1 border-l-[3px] pl-2">
            <span className="text-primary block truncate text-[12px] font-semibold">{replyName} {" "}{t("ga javob")}</span>
            <span className="text-muted block truncate text-[13px]">{replyTo.preview}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label={t("Javobni bekor qilish")}
            className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}
      {staged ? <StagedPreview staged={staged} sending={sending} onRemove={() => setStaged(null)} /> : null}
      <div className="flex items-end gap-2">
        {/* Telegram-style pill: emoji on the left, text in the middle, paperclip on the right. */}
        <div className="border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-w-0 flex-1 items-end rounded-3xl border focus-within:ring-3">
          <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, draft, emoji, setDraft)} />
          <label className="sr-only" htmlFor="message-input">
            {t("Xabar")}</label>
          <textarea
            id="message-input"
            ref={fieldRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={4000}
            placeholder={staged ? t("Izoh qo'shing…") : t("Xabar yozing…")}
            className="field-sizing-content max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-snug outline-none"
          />
          {ATTACHMENTS_ENABLED ? <AttachMenu onPick={(file) => void stage(file)} disabled={sending || preparing} /> : null}
        </div>
        <Button type="submit" size="icon" aria-label={t("Yuborish")} disabled={sending || preparing || (!draft.trim() && !staged)}>
          {sending || preparing ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
    </form>
  );
}

function StagedPreview({ staged, sending, onRemove }: { staged: Staged; sending: boolean; onRemove: () => void }) {
  const t = useT();
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
        <span className="text-muted text-[12px]">{sending ? t("Yuborilmoqda…") : formatBytes(file.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={sending}
        aria-label={t("Biriktirilgan faylni olib tashlash")}
        className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
