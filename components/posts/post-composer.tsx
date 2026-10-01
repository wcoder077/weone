"use client";

import { createPost } from "@/lib/actions/posts";
import { PostEditor } from "./post-editor";

export function PostComposer({ userId }: { userId: string }) {
  return <PostEditor id="new-post" submitLabel="Joylash" media={{ userId }} onSubmit={createPost} />;
}
