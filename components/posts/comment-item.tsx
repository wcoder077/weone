"use client";

import { LinkifiedText } from "@/components/shared/linkified-text";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CornerDownRight, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { deleteComment } from "@/lib/actions/posts";
import { formatRelative } from "@/lib/format";
import type { PostComment } from "@/lib/queries/posts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import { CommentForm } from "./comment-form";

export type CommentThreadItem = { comment: PostComment; canDelete: boolean };

// A top-level comment with its replies underneath (one level, indented). `canDelete`: the commenter
// or the post's author (RLS checks it again). Replying to a reply answers in the same thread.
export function CommentThread({ postId, item, replies }: { postId: string; item: CommentThreadItem; replies: CommentThreadItem[] }) {
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const root = item.comment;

  return (
    <li className="flex flex-col gap-3">
      <CommentRow item={item} onReply={() => setReplyingTo(root)} />
      {replies.length > 0 || replyingTo ? (
        <div className="border-border ml-4 flex flex-col gap-3 border-l pl-4 sm:ml-5">
          {replies.map((reply) => (
            <CommentRow key={reply.comment.id} item={reply} onReply={() => setReplyingTo(reply.comment)} />
          ))}
          {replyingTo ? (
            <CommentForm
              key={replyingTo.id}
              postId={postId}
              parentId={root.id}
              initial={replyingTo.id === root.id ? "" : `@${replyingTo.author.username} `}
              autoFocus
              onDone={() => setReplyingTo(null)}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function CommentRow({ item: { comment, canDelete }, onReply }: { item: CommentThreadItem; onReply: () => void }) {
  const t = useT();
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
    <div className="flex items-start gap-3">
      <Link href={`/u/${comment.author.username}`} className="shrink-0" aria-label={comment.author.full_name}>
        <UserAvatar name={comment.author.full_name} url={comment.author.avatar_url} size="sm" userId={comment.author.id} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex items-baseline gap-2">
          <Link href={`/u/${comment.author.username}`} className="truncate text-[14px] font-semibold hover:underline">
            {comment.author.full_name}
          </Link>
          <time dateTime={comment.createdAt} className="text-muted shrink-0 text-[12px]">
            {formatRelative(comment.createdAt, t)}
          </time>
        </p>
        <p className="max-w-[65ch] text-[15px] leading-[1.6] break-words whitespace-pre-wrap select-text"><LinkifiedText text={comment.body} /></p>
        <button
          type="button"
          onClick={onReply}
          className="text-muted hover:text-text -my-2 inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-medium"
        >
          <CornerDownRight className="size-3.5" aria-hidden />
          {t("Javob berish")}
        </button>
      </div>
      {canDelete ? (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={t("Izohni o'chirish")}
            className="text-muted hover:text-danger hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3"
          >
            <Trash2 className="size-4" />
          </button>
          <ResponsiveDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={t("Izohni o'chirasizmi?")}
            description={t("Bu amalni ortga qaytarib bo'lmaydi.")}
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => setConfirming(false)}>
                {t("Bekor qilish")}</Button>
              <Button variant="destructive" size="lg" disabled={pending} onClick={remove}>
                {pending ? t("O'chirilmoqda…") : t("O'chirish")}
              </Button>
            </div>
          </ResponsiveDialog>
        </>
      ) : null}
    </div>
  );
}
