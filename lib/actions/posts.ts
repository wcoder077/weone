"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { postBodySchema } from "@/lib/validation/post";
import type { ActionState } from "./types";

const idSchema = z.guid();
const FAILED = "Saqlab bo'lmadi. Qayta urinib ko'ring.";

export async function createPost(body: string): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({ author_id: userId, body: parsed.data });
  if (error) return { error: FAILED };

  refresh();
  return { message: "Post joylandi" };
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
  const { data, error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", userId).select("id");
  if (error || data.length === 0) return { error: "O'chirib bo'lmadi." };

  refresh();
  return { message: "Post o'chirildi" };
}
