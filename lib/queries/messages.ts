import { ATTACHMENT_BUCKET, type AttachmentKind } from "@/lib/attachments";
import { messagePreview } from "@/lib/message-preview";
import { readStatus } from "@/lib/read-status";
import { createClient } from "@/lib/supabase/server";

const PROFILE_FIELDS = "username, full_name, avatar_url";

// Exact unread counts per conversation for the signed-in user (RPC, scoped to auth.uid()).
export async function getUnreadCounts() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_unread_counts");
  if (error) throw error;
  return new Map(data.map((r) => [r.conversation_id, r.unread]));
}

// Nav badge total: muted chats don't count.
export async function getUnreadMessageTotal() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_unread_counts");
  if (error) throw error;
  return data.reduce((sum, r) => sum + (r.muted ? 0 : r.unread), 0);
}

// The user's chats, newest activity first, with the other person, last message
// and how many messages from others arrived after the user last read it.
export async function getConversations(userId: string) {
  const supabase = await createClient();
  const { data: mine, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, muted, pinned_at, hidden_at, conversations(created_at, connections(status))")
    .eq("user_id", userId);
  if (error) throw error;
  if (mine.length === 0) return [];

  const ids = mine.map((m) => m.conversation_id);
  const [others, messages, unread] = await Promise.all([
    supabase
      .from("conversation_members")
      .select(`conversation_id, user_id, last_read_at, profiles(${PROFILE_FIELDS})`)
      .in("conversation_id", ids)
      .neq("user_id", userId),
    // Recent messages across the user's chats; enough for previews.
    supabase
      .from("messages")
      .select("conversation_id, sender_id, body, kind, attachment_type, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(500),
    getUnreadCounts(),
  ]);
  if (others.error) throw others.error;
  if (messages.error) throw messages.error;

  return mine
    .map((m) => {
      const other = others.data.find((o) => o.conversation_id === m.conversation_id);
      // "Deleted for me": only messages after hidden_at exist for me.
      const own = messages.data.filter(
        (msg) => msg.conversation_id === m.conversation_id && (!m.hidden_at || msg.created_at > m.hidden_at),
      );
      const last = own[0];
      return {
        id: m.conversation_id,
        other: other?.profiles ? { id: other.user_id, ...other.profiles } : null,
        last: last ?? null,
        // ✓ / ✓✓ for my own last message (read = the other person opened the chat after it).
        lastStatus: last && last.sender_id === userId ? readStatus(last.created_at, other?.last_read_at) : null,
        unread: unread.get(m.conversation_id) ?? 0,
        activityAt: last?.created_at ?? m.conversations?.created_at ?? "",
        muted: m.muted,
        pinnedAt: m.pinned_at,
        hidden: Boolean(m.hidden_at) && !last,
        // Chats without a connection (older collaboration chats) stay readable but closed.
        status: m.conversations?.connections?.status ?? "closed",
      };
    })
    .filter((c) => c.status !== "rejected" && !c.hidden)
    // Pinned chats first (newest pin first), then by latest activity.
    .sort((a, b) =>
      a.pinnedAt || b.pinnedAt
        ? (b.pinnedAt ?? "").localeCompare(a.pinnedAt ?? "")
        : b.activityAt.localeCompare(a.activityAt),
    );
}

export type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number];

const MESSAGE_FIELDS =
  "id, sender_id, body, kind, project_id, image_path, edited_at, created_at, reply_to, attachment_path, attachment_name, attachment_type, attachment_size, projects(name, slug, tagline, logo_url)";

// Null when the conversation does not exist or the user is not a member (RLS).
export async function getConversation(conversationId: string, userId: string) {
  const supabase = await createClient();
  const [members, messages, conversation] = await Promise.all([
    supabase
      .from("conversation_members")
      .select(`user_id, hidden_at, last_read_at, profiles(${PROFILE_FIELDS}, headline)`)
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("conversations")
      .select("connections(id, status, requester_id)")
      .eq("id", conversationId)
      .maybeSingle(),
  ]);
  if (members.error) throw members.error;
  if (messages.error) throw messages.error;
  const mine = members.data.find((m) => m.user_id === userId);
  if (!mine) return null;
  // "Deleted for me": older messages are gone from my side only.
  const visible = mine.hidden_at ? messages.data.filter((m) => m.created_at > mine.hidden_at!) : messages.data;

  // First-message images live in a private bucket: sign them for an hour.
  const imagePaths = visible.flatMap((m) => (m.image_path ? [m.image_path] : []));
  const signed = imagePaths.length
    ? (await supabase.storage.from("message-images").createSignedUrls(imagePaths, 60 * 60)).data ?? []
    : [];
  const imageUrls = new Map(signed.flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])));

  // Attachments are private too: sign them for an hour.
  const attachmentPaths = visible.flatMap((m) => (m.attachment_path ? [m.attachment_path] : []));
  const signedAttachments = attachmentPaths.length
    ? ((await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrls(attachmentPaths, 60 * 60)).data ?? [])
    : [];
  const attachmentUrls = new Map(
    signedAttachments.flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])),
  );

  // Quoted messages for replies; older ones outside the loaded page are fetched once.
  const loaded = new Map(visible.map((m) => [m.id, m]));
  const missing = [...new Set(visible.flatMap((m) => (m.reply_to && !loaded.has(m.reply_to) ? [m.reply_to] : [])))];
  const quotedRows = missing.length
    ? ((await supabase.from("messages").select("id, sender_id, body, kind, attachment_type, image_path").in("id", missing)).data ?? [])
    : [];
  const quoted = new Map<string, { id: string; sender_id: string; body: string; kind: string; attachment_type: string | null; image_path: string | null }>(
    [...visible, ...quotedRows].map((m) => [m.id, m]),
  );
  const replyOf = (id: string | null): ChatReply | null => {
    const q = id ? quoted.get(id) : undefined;
    return q ? { id: q.id, senderId: q.sender_id, preview: messagePreview(q) } : null;
  };

  const connection = conversation.data?.connections ?? null;
  const other = members.data.find((m) => m.user_id !== userId);
  return {
    other: other?.profiles ? { id: other.user_id, ...other.profiles } : null,
    otherReadAt: other?.last_read_at ?? null,
    // Messaging is open only once the connection is accepted (enforced by RLS).
    connection: connection
      ? { id: connection.id, status: connection.status, requestedByMe: connection.requester_id === userId }
      : null,
    messages: visible
      .reverse()
      .map((m) => ({
        ...toChatMessage(m, m.attachment_path ? attachmentUrls.get(m.attachment_path) : undefined, replyOf(m.reply_to)),
        imageUrl: m.image_path ? (imageUrls.get(m.image_path) ?? null) : null,
      })),
  };
}

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  kind: string;
  project_id: string | null;
  image_path?: string | null;
  edited_at?: string | null;
  created_at: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  projects: { name: string; slug: string; tagline: string | null; logo_url: string | null } | null;
};

export type ChatAttachment = { url: string; name: string; kind: AttachmentKind; size: number };

// The message a reply quotes: who wrote it and a one-line preview.
export type ChatReply = { id: string; senderId: string; preview: string };

// `attachmentUrl` is the signed URL of the row's attachment (callers sign it, see getConversation).
export function toChatMessage(row: MessageRow, attachmentUrl?: string, replyTo: ChatReply | null = null) {
  const attachment: ChatAttachment | null =
    row.attachment_path && row.attachment_name && row.attachment_type && row.attachment_size && attachmentUrl
      ? { url: attachmentUrl, name: row.attachment_name, kind: row.attachment_type as AttachmentKind, size: row.attachment_size }
      : null;
  return {
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    kind: row.kind,
    createdAt: row.created_at,
    projectId: row.project_id,
    project: row.projects,
    editedAt: row.edited_at ?? null,
    imageUrl: null as string | null,
    attachment,
    replyTo,
  };
}

export type ChatMessage = ReturnType<typeof toChatMessage>;
