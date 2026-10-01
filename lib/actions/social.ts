"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { COLLAB_REASON_VALUES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsOf, type ActionState } from "./types";

const idSchema = z.guid();
const FAILED = "Bajarib bo'lmadi. Qayta urinib ko'ring.";

export async function sendConnection(addresseeId: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(addresseeId).success || addresseeId === userId) return { error: FAILED };

  const supabase = await createClient();
  // A declined request would block the pair forever (one row per pair); clear it first.
  await supabase
    .from("connections")
    .delete()
    .eq("status", "declined")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${userId})`,
    );
  const { error } = await supabase.from("connections").insert({ requester_id: userId, addressee_id: addresseeId });
  // Unique pair index: a request already exists in one direction or the other.
  if (error?.code === "23505") return { error: "Sizlar o'rtasida so'rov allaqachon bor." };
  if (error) return { error: FAILED };

  refresh();
  return { message: "So'rov yuborildi" };
}

export async function respondConnection(connectionId: string, accept: boolean): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", connectionId)
    .eq("status", "pending")
    .select("id");
  if (error || data.length === 0) return { error: FAILED };

  refresh();
  return { message: accept ? "Bog'landingiz" : "Rad etildi" };
}

// Withdraws a pending request or removes an existing connection.
export async function removeConnection(connectionId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(connectionId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase.from("connections").delete().eq("id", connectionId).select("id");
  if (error || data.length === 0) return { error: FAILED };

  refresh();
  return { message: "Olib tashlandi" };
}

const collabSchema = z.object({
  receiver_id: z.guid(),
  reason: z.enum(COLLAB_REASON_VALUES, "Sababni tanlang"),
  project_id: z.union([z.literal(""), z.guid()]).transform((v) => v || null),
  message: z
    .string()
    .trim()
    .max(500, "Ko'pi bilan 500 ta belgi")
    .transform((v) => v || null),
});

export async function sendCollab(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = collabSchema.safeParse({
    receiver_id: formData.get("receiver_id"),
    reason: formData.get("reason"),
    project_id: formData.get("project_id") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (parsed.data.receiver_id === userId) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("collab_requests").insert({ ...parsed.data, sender_id: userId });
  if (error) return { error: "Taklif yuborib bo'lmadi." };

  refresh();
  return { message: "Taklif yuborildi" };
}

// Opens the chat, with the request's message as its first message.
export async function acceptCollab(requestId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(requestId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data: conversationId, error } = await supabase.rpc("accept_collab_request", { p_request_id: requestId });
  if (error) return { error: FAILED };
  redirect(`/messages/${conversationId}`);
}

export async function declineCollab(requestId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(requestId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collab_requests")
    .update({ status: "declined" })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id");
  if (error || data.length === 0) return { error: FAILED };

  refresh();
  return { message: "Rad etildi" };
}

// Message button: allowed only after an accepted connection or collaboration (checked in SQL).
export async function openConversation(otherUserId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(otherUserId).success) return { error: FAILED };

  const supabase = await createClient();
  const { data: conversationId, error } = await supabase.rpc("start_conversation", { other_user: otherUserId });
  if (error) return { error: "Yozish uchun avval bog'laning yoki hamkorlik qiling." };
  redirect(`/messages/${conversationId}`);
}

export async function markNotificationsRead(): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}
