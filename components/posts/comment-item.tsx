"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteComment } from "@/lib/actions/posts";
import { formatRelative } from "@/lib/format";
import type { PostComment } from "@/lib/queries/posts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

// `canDelete`: the commenter or the post's author (RLS checks it again).
export function CommentItem({ comment, canDelete }: { comment: PostComment; canDelete: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result?.error) toast.error(result.error);
      else setConfirming(false);
    });
  }

  return (
    <li className="flex items-start gap-3">
      <Link href={`/u/${comment.author.username}`} className="shrink-0" aria-label={comment.author.full_name}>
        <UserAvatar name={comment.author.full_name} url={comment.author.avatar_url} size="sm" userId={comment.author.id} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex items-baseline gap-2">
          <Link href={`/u/${comment.author.username}`} className="truncate text-[14px] font-semibold hover:underline">
            {comment.author.full_name}
          </Link>
          <time dateTime={comment.createdAt} className="text-muted shrink-0 text-[12px]">
            {formatRelative(comment.createdAt)}
          </time>
        </p>
        <p className="max-w-[65ch] text-[15px] leading-[1.6] break-words whitespace-pre-wrap">{comment.body}</p>
      </div>
      {canDelete ? (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Izohni o'chirish"
            className="text-muted hover:text-danger hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3"
          >
            <Trash2 className="size-4" />
          </button>
          <ResponsiveDialog
            open={confirming}
            onOpenChange={setConfirming}
            title="Izohni o'chirasizmi?"
            description="Bu amalni ortga qaytarib bo'lmaydi."
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => setConfirming(false)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" size="lg" disabled={pending} onClick={remove}>
                {pending ? "O'chirilmoqda…" : "O'chirish"}
              </Button>
            </div>
          </ResponsiveDialog>
        </>
      ) : null}
    </li>
  );
}
