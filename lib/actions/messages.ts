"use server";

import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { ATTACHMENT_BUCKET, ATTACHMENT_KINDS, ATTACHMENT_MAX_BYTES } from "@/lib/attachments";
import { toChatMessage, type ChatMessage } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.guid();
const bodySchema = z.string().trim().min(1).max(4000);
const MESSAGE_FIELDS = "id, sender_id, body, kind, project_id, created_at, projects(name, slug, tagline, logo_url)";
const ATTACHMENT_FIELDS = `${MESSAGE_FIELDS}, attachment_path, attachment_name, attachment_type, attachment_size`;
const SIGNED_URL_SECONDS = 60 * 60;

type SendResult = { message: ChatMessage } | { error: string };

// RLS checks the sender is a member of the conversation.
export async function sendMessage(conversationId: string, body: string): Promise<SendResult> {
  const userId = await requireUserId();
  const parsed = z.object({ conversationId: idSchema, body: bodySchema }).safeParse({ conversationId, body });
  if (!parsed.success) return { error: "Xabar bo'sh yoki juda uzun." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: parsed.data.conversationId, sender_id: userId, body: parsed.data.body })
    .select(MESSAGE_FIELDS)
    .single();
  if (error) return { error: "Xabarni yuborib bo'lmadi." };
  return { message: toChatMessage(data) };
}

// The file is already uploaded by the browser (own folder, bucket rules enforce type and size).
// The database re-checks the path, that the object exists and that the chat is open.
export async function sendAttachment(
  conversationId: string,
  file: { path: string; name: string; kind: string; size: number },
  caption: string,
): Promise<SendResult> {
  const userId = await requireUserId();
  const parsed = z
    .object({
      conversationId: idSchema,
      path: z.string().regex(new RegExp(`^${userId}/${conversationId}/[0-9a-f-]{36}\\.[a-z0-9]{1,5}$`)),
      name: z.string().trim().min(1).max(120),
      kind: z.enum(ATTACHMENT_KINDS),
      size: z.number().int().positive().max(ATTACHMENT_MAX_BYTES),
      caption: z.string().trim().max(4000),
    })
    .safeParse({ conversationId, ...file, caption });
  if (!parsed.success) return { error: "Faylni yuborib bo'lmadi." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: parsed.data.conversationId,
      sender_id: userId,
      body: parsed.data.caption,
      attachment_path: parsed.data.path,
      attachment_name: parsed.data.name,
      attachment_type: parsed.data.kind,
      attachment_size: parsed.data.size,
    })
    .select(ATTACHMENT_FIELDS)
    .single();
  if (error) {
    // Don't leave an unsent upload behind.
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([parsed.data.path]);
    return { error: "Faylni yuborib bo'lmadi." };
  }

  const { data: signed } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(parsed.data.path, SIGNED_URL_SECONDS);
  return { message: toChatMessage(data, signed?.signedUrl) };
}

// RLS checks the sender belongs to the project being shared.
export async function sendProjectInvite(conversationId: string, projectId: string): Promise<SendResult> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(conversationId).success || !idSchema.safeParse(projectId).success) {
    return { error: "Taklifni yuborib bo'lmadi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, kind: "project_invite", project_id: projectId })
    .select(MESSAGE_FIELDS)
    .single();
  if (error) return { error: "Taklifni yuborib bo'lmadi." };
  return { message: toChatMessage(data) };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(conversationId).success) return;

  const supabase = await createClient();
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

type EditResult = { body: string; editedAt: string } | { error: string };

// RLS limits this to the sender's own text messages in an open chat; edited_at is set by trigger.
export async function editMessage(messageId: string, body: string): Promise<EditResult> {
  const userId = await requireUserId();
  const parsed = z.object({ messageId: idSchema, body: bodySchema }).safeParse({ messageId, body });
  if (!parsed.success) return { error: "Xabar bo'sh yoki juda uzun." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .update({ body: parsed.data.body })
    .eq("id", parsed.data.messageId)
    .eq("sender_id", userId)
    .select("body, edited_at")
    .maybeSingle();
  if (error || !data) return { error: "Xabarni tahrirlab bo'lmadi." };
  return { body: data.body, editedAt: data.edited_at ?? new Date().toISOString() };
}

export async function deleteMessage(messageId: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(messageId).success) return { error: "Xabarni o'chirib bo'lmadi." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", userId)
    .select("id, attachment_path");
  if (error || data.length === 0) return { error: "Xabarni o'chirib bo'lmadi." };

  // The message row is gone; remove its file too (the owner's storage policy allows it).
  const paths = data.flatMap((m) => (m.attachment_path ? [m.attachment_path] : []));
  if (paths.length) await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
  return {};
}
