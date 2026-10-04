"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstMessageSchema, type FirstMessageInput } from "@/lib/validation/connection";
import type { ActionState } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const idSchema = z.guid();
const FAILED = "Bajarib bo'lmadi. Qayta urinib ko'ring.";
const IMAGE_URL_TTL = 60 * 60;

// The database errors that users can hit through normal use.
function requestError(code: string | undefined) {
  if (code === "23505") return "Sizlar o'rtasida so'rov allaqachon bor.";
  if (code === "22001") return "Xabar 200 ta belgidan oshmasin.";
  if (code === "P0002") return "So'rov endi kutilmayapti.";
  return FAILED;
}

// The first message of a connection request, with a signed URL for its private image.
async function firstMessage(supabase: Supabase, connectionId: string) {
  const { data } = await supabase
    .from("conversations")
    .select("messages(body, image_path, created_at)")
    .eq("connection_id", connectionId)
    .order("created_at", { referencedTable: "messages", ascending: true })
    .limit(1, { referencedTable: "messages" })
    .maybeSingle();
  const message = data?.messages[0];
  if (!message) return null;

  const imageUrl = message.image_path
    ? (await supabase.storage.from("message-images").createSignedUrl(message.image_path, IMAGE_URL_TTL)).data?.signedUrl ?? null
    : null;
  return { body: message.body, imagePath: message.image_path, imageUrl };
}

export type ConnectionRequestDetails = NonNullable<Awaited<ReturnType<typeof firstMessage>>>;

// Loaded when the edit / review dialog opens (RLS: only the two people involved).
export async function getConnectionRequest(connectionId: string): Promise<ConnectionRequestDetails | null> {
  await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return null;
  return firstMessage(await createClient(), connectionId);
}

export async function sendConnectionRequest(addresseeId: string, input: FirstMessageInput): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = firstMessageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };
  if (!idSchema.safeParse(addresseeId).success || addresseeId === userId) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_connection_request", {
    p_addressee: addresseeId,
    p_body: parsed.data.body,
    p_image_path: parsed.data.imagePath ?? undefined,
  });
  if (error) return { error: requestError(error.code) };

  refresh();
  return { message: "So'rov yuborildi" };
}

export async function updateConnectionRequest(connectionId: string, input: FirstMessageInput): Promise<ActionState> {
  await requireUserId();
  const parsed = firstMessageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const before = await firstMessage(supabase, connectionId);
  const { error } = await supabase.rpc("update_connection_request", {
    p_connection_id: connectionId,
    p_body: parsed.data.body,
    p_image_path: parsed.data.imagePath ?? undefined,
  });
  if (error) return { error: requestError(error.code) };

  // The replaced image is no longer referenced.
  if (before?.imagePath && before.imagePath !== parsed.data.imagePath) {
    await supabase.storage.from("message-images").remove([before.imagePath]);
  }
  refresh();
  return { message: "Xabar yangilandi" };
}

export async function cancelConnectionRequest(connectionId: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const before = await firstMessage(supabase, connectionId);
  // RLS: only the requester, only while pending. The chat and first message cascade.
  const { data, error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .eq("requester_id", userId)
    .eq("status", "pending")
    .select("id");
  if (error || data.length === 0) return { error: requestError("P0002") };

  if (before?.imagePath) await supabase.storage.from("message-images").remove([before.imagePath]);
  refresh();
  return { message: "So'rov bekor qilindi" };
}

// Ends an accepted connection. The row stays ("removed"): the chat history is kept on both sides, but
// nobody can write in it until the two connect again.
export async function removeConnection(connectionId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_connection", { p_connection_id: connectionId });
  if (error) return { error: error.code === "P0002" ? "Bog'lanish allaqachon uzilgan." : FAILED };

  refresh();
  return { message: "Bog'lanish uzildi" };
}

// After a removal either side can ask again; the other person accepts or rejects as with any request.
export async function reconnect(connectionId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reconnect_request", { p_connection_id: connectionId });
  if (error) return { error: error.code === "P0002" ? requestError("P0002") : FAILED };

  refresh();
  return { message: "So'rov yuborildi" };
}

export async function respondConnectionRequest(connectionId: string, accept: boolean): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_connection_request", {
    p_connection_id: connectionId,
    p_accept: accept,
  });
  if (error) return { error: requestError(error.code) };

  refresh();
  return { message: accept ? "Bog'landingiz" : "So'rov rad etildi" };
}

// "Xabar yozish": opens the chat of an accepted connection (checked in SQL).
export async function openConversation(otherUserId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(otherUserId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data: conversationId, error } = await supabase.rpc("start_conversation", { other_user: otherUserId });
  if (error) return { error: "Yozish uchun avval bog'laning." };
  redirect(`/messages/${conversationId}`);
}
