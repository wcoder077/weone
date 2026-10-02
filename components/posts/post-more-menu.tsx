"use client";

import { useState } from "react";
import { Link2, MoreHorizontal, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { repostPost } from "@/lib/actions/posts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostEditor } from "./post-editor";
import { useT } from "@/components/i18n/i18n-provider";

// "…" under the post: repost (with an optional comment of your own) and copy the post link.
export function PostMoreMenu({ postId }: { postId: string }) {
  const t = useT();
  const [reposting, setReposting] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`).then(
      () => toast.success("Havola nusxalandi"),
      () => toast.error("Nusxa olib bo'lmadi"),
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("Boshqa amallar")}
          className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 data-popup-open:bg-surface inline-flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3"
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem onClick={() => setReposting(true)}>
            <Repeat2 aria-hidden />
            {t("Repost")}</DropdownMenuItem>
          <DropdownMenuItem onClick={copyLink}>
            <Link2 aria-hidden />
            {t("Havolani nusxalash")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog
        open={reposting}
        onOpenChange={setReposting}
        title={t("Repost qilish")}
        description={t("Post sizning sahifangizda ko'rinadi. Xohlasangiz o'z fikringizni qo'shing.")}
      >
        {reposting ? (
          <PostEditor
            id={`repost-${postId}`}
            autoFocus
            allowEmpty
            placeholder={t("Fikringizni qo'shing (ixtiyoriy)…")}
            submitLabel={t("Repost qilish")}
            onSubmit={(comment) => repostPost(postId, comment)}
            onDone={() => setReposting(false)}
          />
        ) : null}
      </ResponsiveDialog>
    </>
  );
}
