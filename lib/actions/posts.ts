"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { POST_MEDIA_BUCKET } from "@/lib/post-media";
import { createClient } from "@/lib/supabase/server";
import { commentSchema, postBodySchema, postCaptionSchema } from "@/lib/validation/post";
import { insertError, POST_LIMIT_TEXT } from "@/lib/rate-limit";
import type { ActionState } from "./types";

const idSchema = z.guid();
const FAILED = "Saqlab bo'lmadi. Qayta urinib ko'ring.";

// The file is already uploaded by the browser into the author's folder of the private bucket;
// the database re-checks the path shape and that the object exists.
export type PostMediaInput = { path: string; name: string; kind: "image" | "video" };

export async function createPost(body: string, media?: PostMediaInput): Promise<ActionState> {
  const userId = await requireUserId();
  const text = postCaptionSchema.safeParse(body);
  if (!text.success) return { error: text.error.issues[0]?.message ?? FAILED };
  if (!text.data && !media) return { error: "Post bo'sh bo'lmasin" };

  const mediaFields = media
    ? z
        .object({
          path: z.string().regex(new RegExp(`^${userId}/[0-9a-f-]{36}\\.[a-z0-9]{1,5}$`)),
          name: z.string().trim().min(1).max(120),
          kind: z.enum(["image", "video"]),
        })
        .safeParse(media)
    : null;
  if (mediaFields && !mediaFields.success) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    author_id: userId,
    body: text.data,
    ...(mediaFields?.success
      ? { media_path: mediaFields.data.path, media_name: mediaFields.data.name, media_type: mediaFields.data.kind }
      : {}),
  });
  if (error) {
    // Don't leave an unused upload behind.
    if (mediaFields?.success) await supabase.storage.from(POST_MEDIA_BUCKET).remove([mediaFields.data.path]);
    return { error: insertError(error, FAILED, POST_LIMIT_TEXT) };
  }

  refresh();
  return { message: "Post joylandi" };
}

// A repost always points at the original post (reposting a repost reposts its original).
export async function repostPost(postId: string, comment: string): Promise<ActionState> {
  const userId = await requireUserId();
  const text = postCaptionSchema.safeParse(comment);
  if (!idSchema.safeParse(postId).success || !text.success) return { error: FAILED };

  const supabase = await createClient();
  const { data: target, error: lookupError } = await supabase
    .from("posts")
    .select("id, repost_of")
    .eq("id", postId)
    .maybeSingle();
  if (lookupError || !target) return { error: "Post topilmadi." };

  const { error } = await supabase
    .from("posts")
    .insert({ author_id: userId, body: text.data, repost_of: target.repost_of ?? target.id });
  if (error) return { error: insertError(error, FAILED, POST_LIMIT_TEXT) };

  refresh();
  return { message: "Repost qilindi" };
}

// RLS: only the author can edit or delete.
export async function updatePost(postId: string, body: string): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };
  if (!idSchema.safeParse(postId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ body: parsed.data })
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id");
  if (error || data.length === 0) return { error: FAILED };

  refresh();
  return { message: "Post yangilandi" };
}

export async function deletePost(postId: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(postId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id, media_path");
  if (error || data.length === 0) return { error: "O'chirib bo'lmadi." };

  // The post is gone; remove its photo/video too.
  const paths = data.flatMap((p) => (p.media_path ? [p.media_path] : []));
  if (paths.length) await supabase.storage.from(POST_MEDIA_BUCKET).remove(paths);

  refresh();
  return { message: "Post o'chirildi" };
}

// ---------------------------------------------------------------------------
// Likes, comments, views
// ---------------------------------------------------------------------------

type LikeResult = { liked: boolean; count: number } | { error: string };

// Toggles my like. The counter is kept by a database trigger; we only read it back.
export async function toggleLike(postId: string): Promise<LikeResult> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(postId).success) return { error: FAILED };

  const supabase = await createClient();
  const removed = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId).select("post_id");
  if (removed.error) return { error: FAILED };

  let liked = false;
  if (removed.data.length === 0) {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error) return { error: FAILED };
    liked = true;
  }

  const { data } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle();
  return { liked, count: data?.like_count ?? 0 };
}

export async function addComment(postId: string, body: string): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };
  if (!idSchema.safeParse(postId).success) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: userId, body: parsed.data });
  if (error) return { error: insertError(error, "Izohni yuborib bo'lmadi.") };

  refresh();
  return { message: "Izoh qo'shildi" };
}

// RLS: the commenter or the post's author.
export async function deleteComment(commentId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(commentId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase.from("post_comments").delete().eq("id", commentId).select("id");
  if (error || data.length === 0) return { error: "O'chirib bo'lmadi." };

  refresh();
  return { message: "Izoh o'chirildi" };
}

// Returns the ids that were seen for the first time (never the author's own posts).
export async function recordPostViews(postIds: string[]): Promise<string[]> {
  await requireUserId();
  const ids = z.array(idSchema).max(50).safeParse(postIds);
  if (!ids.success || ids.data.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_post_views", { p_post_ids: ids.data });
  return error ? [] : data;
}
