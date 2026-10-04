"use client";

import { useRef, useState, useTransition } from "react";
import { Copy, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { deleteMessage, editMessage } from "@/lib/actions/messages";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REACTION_EMOJIS } from "@/lib/reactions";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// Edit/delete handlers, passed only for my own messages.
export type OwnMessageHandlers = {
  canEdit: boolean;
  onEdited: (body: string, editedAt: string) => void;
  onDeleted: () => void;
};

type Props = {
  messageId: string;
  body: string;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onReply?: () => void;
  /** The reaction row at the top of the menu; `myReaction` is highlighted, picking it again takes it back. */
  onReact?: (emoji: string | null) => void;
  myReaction?: string;
  own?: OwnMessageHandlers;
};

// Message menu: reply, copy, and for my own messages edit (sheet) and delete (confirmation).
// Opened from the hover button on desktop or by long-press on the bubble (see useLongPress).
export function MessageActions({ messageId, body, menuOpen, onMenuOpenChange, onReply, onReact, myReaction, own }: Props) {
  const t = useT();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [deleting, startDelete] = useTransition();

  function copy() {
    navigator.clipboard.writeText(body).then(
      () => toast.success("Nusxa olindi"),
      () => toast.error("Nusxa olib bo'lmadi"),
    );
  }

  function remove() {
    startDelete(async () => {
      const result = await deleteMessage(messageId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDialog(null);
      own?.onDeleted();
    });
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger
          aria-label={t("Xabar amallari")}
          className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 data-popup-open:bg-surface inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 data-popup-open:opacity-100 pointer-coarse:pointer-events-none"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {onReact ? (
            <div role="group" aria-label={t("Reaksiya")} className="flex gap-0.5 px-1 py-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(emoji === myReaction ? null : emoji);
                    onMenuOpenChange(false);
                  }}
                  aria-pressed={emoji === myReaction}
                  aria-label={emoji}
                  className={cn(
                    "hover:bg-surface focus-visible:ring-ring/50 inline-flex size-9 items-center justify-center rounded-full text-[20px] outline-none focus-visible:ring-3",
                    emoji === myReaction && "bg-primary/15",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
          {onReply ? (
            <DropdownMenuItem onClick={onReply}>
              <Reply aria-hidden />
              {t("Javob berish")}</DropdownMenuItem>
          ) : null}
          {body ? (
            <DropdownMenuItem onClick={copy}>
              <Copy aria-hidden />
              {t("Nusxa olish")}</DropdownMenuItem>
          ) : null}
          {own?.canEdit ? (
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <Pencil aria-hidden />
              {t("Tahrirlash")}</DropdownMenuItem>
          ) : null}
          {own ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
              <Trash2 aria-hidden />
              {t("O'chirish")}</DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} title={t("Xabarni tahrirlash")}>
        {dialog === "edit" ? (
          <MessageEditor
            messageId={messageId}
            initial={body}
            onSaved={(next, editedAt) => {
              setDialog(null);
              own?.onEdited(next, editedAt);
            }}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={t("Xabarni o'chirasizmi?")}
        description={t("Xabar ikkala tomondan ham o'chadi. Bu amalni ortga qaytarib bo'lmaydi.")}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => setDialog(null)}>
            {t("Bekor qilish")}</Button>
          <Button variant="destructive" size="lg" disabled={deleting} aria-busy={deleting} onClick={remove}>
            {deleting ? t("O'chirilmoqda…") : t("O'chirish")}
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}

function MessageEditor({
  messageId,
  initial,
  onSaved,
  onCancel,
}: {
  messageId: string;
  initial: string;
  onSaved: (body: string, editedAt: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState(initial);
  const [saving, startSaving] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const unchanged = draft.trim() === initial.trim();
  const invalid = !draft.trim() || unchanged;

  function save() {
    if (invalid || saving) return;
    startSaving(async () => {
      const result = await editMessage(messageId, draft);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onSaved(result.body, result.editedAt);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor={`edit-${messageId}`} className="sr-only">
        {t("Xabar matni")}</label>
      <textarea
        id={`edit-${messageId}`}
        ref={fieldRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        maxLength={4000}
        rows={3}
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 field-sizing-content max-h-[50dvh] min-h-24 w-full resize-none rounded-2xl border px-4 py-3 text-base leading-[1.6] outline-none focus-visible:ring-3"
      />
      <div className="flex items-center gap-2">
        <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, draft, emoji, setDraft)} />
        <Button type="button" variant="outline" className="ml-auto" onClick={onCancel}>
          {t("Bekor qilish")}</Button>
        <Button type="submit" disabled={invalid || saving} aria-busy={saving}>
          {saving ? t("Saqlanmoqda…") : t("Saqlash")}
        </Button>
      </div>
    </form>
  );
}
