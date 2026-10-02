"use client";

import { createPost } from "@/lib/actions/posts";
import { PostEditor } from "./post-editor";
import { useT } from "@/components/i18n/i18n-provider";

export function PostComposer({ userId }: { userId: string }) {
  const t = useT();
  return <PostEditor id="new-post" submitLabel={t("Joylash")} media={{ userId }} onSubmit={createPost} />;
}
