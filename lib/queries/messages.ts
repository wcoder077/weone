import { createClient } from "@/lib/supabase/server";

const PROFILE_FIELDS = "username, full_name, avatar_url";

// The user's chats, newest activity first, with the other person, last message
// and how many messages from others arrived after the user last read it.
export async function getConversations(userId: string) {
  const supabase = await createClient();
  const { data: mine, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, conversations(created_at)")
    .eq("user_id", userId);
  if (error) throw error;
  if (mine.length === 0) return [];

  const ids = mine.map((m) => m.conversation_id);
  const [others, messages] = await Promise.all([
    supabase
      .from("conversation_members")
      .select(`conversation_id, user_id, profiles(${PROFILE_FIELDS})`)
      .in("conversation_id", ids)
      .neq("user_id", userId),
    // Recent messages across the user's chats; enough for previews and unread counts.
    supabase
      .from("messages")
      .select("conversation_id, sender_id, body, kind, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (others.error) throw others.error;
  if (messages.error) throw messages.error;

  return mine
    .map((m) => {
      const other = others.data.find((o) => o.conversation_id === m.conversation_id);
      const own = messages.data.filter((msg) => msg.conversation_id === m.conversation_id);
      const last = own[0];
      return {
        id: m.conversation_id,
        other: other?.profiles ? { id: other.user_id, ...other.profiles } : null,
        last: last ?? null,
        unread: own.filter((msg) => msg.sender_id !== userId && msg.created_at > m.last_read_at).length,
        activityAt: last?.created_at ?? m.conversations?.created_at ?? "",
      };
    })
    .sort((a, b) => b.activityAt.localeCompare(a.activityAt));
}

export type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number];

const MESSAGE_FIELDS = "id, sender_id, body, kind, project_id, created_at, projects(name, slug, tagline, logo_url)";

// Null when the conversation does not exist or the user is not a member (RLS).
export async function getConversation(conversationId: string, userId: string) {
  const supabase = await createClient();
  const [members, messages] = await Promise.all([
    supabase
      .from("conversation_members")
      .select(`user_id, profiles(${PROFILE_FIELDS}, headline)`)
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (members.error) throw members.error;
  if (messages.error) throw messages.error;
  if (!members.data.some((m) => m.user_id === userId)) return null;

  const other = members.data.find((m) => m.user_id !== userId);
  return {
    other: other?.profiles ? { id: other.user_id, ...other.profiles } : null,
    messages: messages.data.reverse().map(toChatMessage),
  };
}

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  kind: string;
  project_id: string | null;
  created_at: string;
  projects: { name: string; slug: string; tagline: string | null; logo_url: string | null } | null;
};

export function toChatMessage(row: MessageRow) {
  return {
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    kind: row.kind,
    createdAt: row.created_at,
    projectId: row.project_id,
    project: row.projects,
  };
}

export type ChatMessage = ReturnType<typeof toChatMessage>;
