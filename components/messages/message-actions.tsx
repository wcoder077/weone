"use client";

import { useRef, useState, useTransition } from "react";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

type Props = {
  messageId: string;
  body: string;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onEdited: (body: string, editedAt: string) => void;
  onDeleted: () => void;
};

// Own-message menu: copy, edit (sheet), delete (confirmation). Opened from the
// hover button on desktop or by long-press on the bubble (see useLongPress).
export function MessageActions({ messageId, body, menuOpen, onMenuOpenChange, onEdited, onDeleted }: Props) {
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
      onDeleted();
    });
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger
          aria-label="Xabar amallari"
          className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 data-popup-open:bg-surface inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 data-popup-open:opacity-100 pointer-coarse:pointer-events-none"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={copy}>
            <Copy aria-hidden />
            Nusxa olish
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            <Pencil aria-hidden />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 aria-hidden />
            O&apos;chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} title="Xabarni tahrirlash">
        {dialog === "edit" ? (
          <MessageEditor
            messageId={messageId}
            initial={body}
            onSaved={(next, editedAt) => {
              setDialog(null);
              onEdited(next, editedAt);
            }}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Xabarni o'chirasizmi?"
        description="Xabar ikkala tomondan ham o'chadi. Bu amalni ortga qaytarib bo'lmaydi."
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => setDialog(null)}>
            Bekor qilish
          </Button>
          <Button variant="destructive" size="lg" disabled={deleting} aria-busy={deleting} onClick={remove}>
            {deleting ? "O'chirilmoqda…" : "O'chirish"}
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
        Xabar matni
      </label>
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
          Bekor qilish
        </Button>
        <Button type="submit" disabled={invalid || saving} aria-busy={saving}>
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}
