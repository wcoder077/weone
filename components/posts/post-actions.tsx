"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost, updatePost } from "@/lib/actions/posts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostEditor } from "./post-editor";
import { useT } from "@/components/i18n/i18n-provider";

// Author-only: edit in a dialog, delete with a confirmation step.
export function PostActions({ postId, body }: { postId: string; body: string }) {
  const t = useT();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(result?.message ?? "");
        setDialog(null);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("Post amallari")} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            <Pencil aria-hidden />
            {t("Tahrirlash")}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 aria-hidden />
            {t("O'chirish")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} title={t("Postni tahrirlash")}>
        {dialog === "edit" ? (
          <PostEditor
            id={`edit-${postId}`}
            initial={body}
            autoFocus
            submitLabel={t("Saqlash")}
            onSubmit={(next) => updatePost(postId, next)}
            onDone={() => setDialog(null)}
          />
        ) : null}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={t("Postni o'chirasizmi?")}
        description={t("Bu amalni ortga qaytarib bo'lmaydi.")}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => setDialog(null)}>
            {t("Bekor qilish")}</Button>
          <Button variant="destructive" size="lg" disabled={pending} onClick={remove}>
            {pending ? t("O'chirilmoqda…") : t("O'chirish")}
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
