"use client";

import { createPost } from "@/lib/actions/posts";
import { PostEditor } from "./post-editor";

export function PostComposer() {
  return <PostEditor id="new-post" submitLabel="Joylash" onSubmit={createPost} />;
}
