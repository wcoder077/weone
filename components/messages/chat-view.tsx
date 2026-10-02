"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { markConversationRead } from "@/lib/actions/messages";
import { ATTACHMENT_BUCKET, type AttachmentKind } from "@/lib/attachments";
import { MESSAGES_READ_EVENT } from "@/components/layout/unread-messages";
import type { ChatMessage, ChatReply } from "@/lib/queries/messages";
import { messagePreview } from "@/lib/message-preview";
import type { ConnectionState } from "@/lib/queries/social";
import { createClient, subscribeWithAuth } from "@/lib/supabase/client";
import { formatDay } from "@/lib/format";
import { readStatus } from "@/lib/read-status";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConnectButton } from "@/components/social/connect-button";
import { ChatComposer } from "./chat-composer";
import { InviteCard } from "./invite-card";
import { InviteToProject } from "./invite-to-project";
import { DaySeparator, MessageBubble } from "./message-bubble";
import { useVisualViewportFit } from "./use-visual-viewport-fit";

type Person = { id: string; username: string; full_name: string; avatar_url: string | null; headline: string | null };

type MessageInsert = {
  id: string;
  sender_id: string;
  body: string;
  kind: string;
  project_id: string | null;
  created_at: string;
  reply_to: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
};

type MessageUpdate = { id: string; body: string; edited_at: string | null };

type Connection = { id: string; status: string; requestedByMe: boolean } | null;

// Quote data for a reply to `m`.
function replyFrom(m: ChatMessage): ChatReply {
  return {
    id: m.id,
    senderId: m.senderId,
    preview: messagePreview({ body: m.body, kind: m.kind, attachment_type: m.attachment?.kind, image_path: m.imageUrl }),
  };
}

// Adds server messages we don't have yet. Messages already on screen stay as they are
// (a fresh render re-signs attachment links, and swapping them would re-download files).
function mergeMessages(local: ChatMessage[], server: ChatMessage[]) {
  const byId = new Map(local.map((m) => [m.id, m]));
  for (const m of server) if (!byId.has(m.id)) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

// Pending chats hold only the request's first message; the footer then shows the
// request actions instead of a composer (RLS rejects messages until accepted).
function pendingState(connection: Connection): ConnectionState | null {
  if (connection?.status !== "pending") return null;
  return { state: connection.requestedByMe ? "outgoing" : "incoming", connectionId: connection.id };
}

export function ChatView({
  conversationId,
  meId,
  other,
  initialMessages,
  otherReadAt: initialOtherReadAt,
  myProjects,
  myProjectIds,
  connection,
}: {
  conversationId: string;
  meId: string;
  other: Person | null;
  initialMessages: ChatMessage[];
  otherReadAt: string | null;
  myProjects: { id: string; name: string }[];
  myProjectIds: string[];
  connection: Connection;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [serverMessages, setServerMessages] = useState(initialMessages);
  // A refresh brought a newer server list: add what we missed.
  if (initialMessages !== serverMessages) {
    setServerMessages(initialMessages);
    setMessages((prev) => mergeMessages(prev, initialMessages));
  }
  // When the other person last read this chat; drives ✓ / ✓✓ on my messages.
  const [otherReadAt, setOtherReadAt] = useState(initialOtherReadAt);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatReply | null>(null);
  const nameOf = (senderId: string) => (senderId === meId ? "Siz" : (other?.full_name ?? "Suhbatdosh"));
  const myReadAtRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = useCallback(() => bottomRef.current?.scrollIntoView({ block: "end" }), []);
  useVisualViewportFit(rootRef, scrollToEnd);
  const open = connection?.status === "accepted";
  const pending = pendingState(connection);

  // Adds a message once, whether it came from our own send or from Realtime.
  function append(message: ChatMessage) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

  function applyEdit(id: string, body: string, editedAt: string | null) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, body, editedAt } : m)));
  }

  function removeMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  const editing = {
    onEdited: applyEdit,
    onDeleted: removeMessage,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    // Tells the other person (if they have this chat open) that I've read up to now.
    function announceRead(channel: RealtimeChannel | null) {
      const at = myReadAtRef.current;
      if (channel && at) void channel.send({ type: "broadcast", event: "read", payload: { userId: meId, at } });
    }
    // Mark read, update the nav badge and list, and share the read time for ✓✓.
    function markRead() {
      void markConversationRead(conversationId).then((at) => {
        myReadAtRef.current = at;
        announceRead(channelRef.current);
        window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
        router.refresh();
      });
    }

    markRead(); // on open

    const supabase = createClient();
    const unsubscribe = subscribeWithAuth(
      supabase,
      () =>
      supabase
        .channel(`messages:${conversationId}`)
        // The other person read the chat (sent by their open chat, see announceRead).
        .on("broadcast", { event: "read" }, ({ payload }: { payload: { userId?: string; at?: string } }) => {
          const at = payload.at;
          if (payload.userId === meId || typeof at !== "string" || Number.isNaN(Date.parse(at))) return;
          setOtherReadAt((prev) => (prev && Date.parse(prev) >= Date.parse(at) ? prev : at));
        })
        .on<MessageInsert>(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          async (payload) => {
            const row = payload.new;
            // Invite cards need the project; Realtime rows carry only its id.
            const project = row.project_id
              ? (await supabase.from("projects").select("name, slug, tagline, logo_url").eq("id", row.project_id).maybeSingle()).data
              : null;
            // Attachments are private files: sign the link (RLS lets conversation members read).
            const signedUrl = row.attachment_path
              ? (await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(row.attachment_path, 60 * 60)).data?.signedUrl
              : undefined;
            const message: ChatMessage = {
              id: row.id,
              senderId: row.sender_id,
              body: row.body,
              kind: row.kind,
              createdAt: row.created_at,
              projectId: row.project_id,
              project,
              editedAt: null,
              imageUrl: null,
              attachment:
                signedUrl && row.attachment_name && row.attachment_type && row.attachment_size
                  ? { url: signedUrl, name: row.attachment_name, kind: row.attachment_type as AttachmentKind, size: row.attachment_size }
                  : null,
              replyTo: null,
            };
            // The quoted message is usually already on screen; otherwise a generic quote.
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              const quoted = row.reply_to ? prev.find((m) => m.id === row.reply_to) : undefined;
              const replyTo = row.reply_to
                ? quoted
                  ? replyFrom(quoted)
                  : { id: row.reply_to, senderId: "", preview: "Xabar" }
                : null;
              return [...prev, { ...message, replyTo }];
            });
            if (row.sender_id !== meId) markRead();
          },
        )
        .on<MessageUpdate>(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          ({ new: row }) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === row.id ? { ...m, body: row.body, editedAt: row.edited_at } : m)),
            ),
        )
        // Deletes can't be filtered by column and carry only the id; unknown ids are ignored.
        .on<{ id: string }>(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "messages" },
          ({ old }) => {
            // Replies to a deleted message keep their text but lose the quote (reply_to → null).
            if (old.id)
              setMessages((prev) =>
                prev.filter((m) => m.id !== old.id).map((m) => (m.replyTo?.id === old.id ? { ...m, replyTo: null } : m)),
              );
          },
        ),
      // Joined (or re-joined): repeat my read time in case the first announce went out too early.
      // Back from a hidden tab: markRead also refreshes the page, which brings missed messages.
      (channel, resumed) => {
        channelRef.current = channel;
        if (resumed) markRead();
        else announceRead(channel);
      },
    );
    return () => {
      channelRef.current = null;
      unsubscribe();
    };
  }, [conversationId, meId, router]);

  return (
    // Below lg the chat is a full-screen view (the app bars are hidden, see isConversationPath).
    // --vv-top / --vv-height follow the visible area, so the keyboard never pushes the header away.
    <div
      ref={rootRef}
      className="bg-card flex flex-col overflow-hidden max-lg:fixed max-lg:inset-x-0 max-lg:top-[var(--vv-top,0px)] max-lg:z-50 max-lg:h-[var(--vv-height,100dvh)] lg:border-border lg:rounded-card lg:h-full lg:border"
    >
      <header className="border-border flex shrink-0 items-center gap-1 border-b px-1 pt-[max(0.25rem,env(safe-area-inset-top))] pb-1 sm:px-3 lg:gap-3 lg:px-5 lg:py-3">
        <Link
          href="/messages"
          aria-label="Suhbatlarga qaytish"
          className="text-text hover:bg-surface inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full text-[15px] font-medium transition-colors duration-150 lg:pr-3 lg:pl-2"
        >
          <ArrowLeft className="size-6 lg:size-5" aria-hidden />
          <span className="max-lg:sr-only">Orqaga</span>
        </Link>
        {other ? (
          <Link href={`/u/${other.username}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
            <UserAvatar name={other.full_name} url={other.avatar_url} userId={other.id} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{other.full_name}</span>
              {other.headline ? <span className="text-muted truncate text-[13px]">{other.headline}</span> : null}
            </span>
          </Link>
        ) : (
          <span className="flex-1 font-semibold">Suhbat</span>
        )}
        {open ? <InviteToProject conversationId={conversationId} projects={myProjects} onSent={append} /> : null}
      </header>

      {/* Vertical scroll only: the swipe-to-reply icon sits just outside a bubble, and a
          sideways drag must move the bubble, never the whole list. */}
      <div
        className="chat-surface flex min-h-0 flex-1 touch-pan-y flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-6"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-muted m-auto text-center text-[14px]">Birinchi xabarni yozing.</p>
        ) : (
          messages.map((m, i) => {
            const day = formatDay(m.createdAt);
            const newDay = i === 0 || formatDay(messages[i - 1].createdAt) !== day;
            const mine = m.senderId === meId;
            return (
              <Fragment key={m.id}>
                {newDay ? <DaySeparator label={day} /> : null}
                {m.kind === "project_invite" ? (
                  <InviteCard
                    message={m}
                    mine={mine}
                    alreadyMember={m.projectId ? myProjectIds.includes(m.projectId) : false}
                  />
                ) : (
                  <MessageBubble
                    message={m}
                    mine={mine}
                    editing={open && mine && !m.imageUrl ? editing : undefined}
                    status={mine ? readStatus(m.createdAt, otherReadAt) : undefined}
                    onReply={open ? () => setReplyingTo(replyFrom(m)) : undefined}
                    replyName={m.replyTo ? nameOf(m.replyTo.senderId) : undefined}
                  />
                )}
              </Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {open ? (
        <ChatComposer
          conversationId={conversationId}
          meId={meId}
          replyTo={replyingTo}
          replyName={replyingTo ? nameOf(replyingTo.senderId) : ""}
          onCancelReply={() => setReplyingTo(null)}
          onSent={(message) => {
            append({ ...message, replyTo: replyingTo });
            setReplyingTo(null);
          }}
        />
      ) : (
        <div role="status" className="border-border flex flex-col items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-muted text-[14px]">
            {pending?.state === "outgoing"
              ? "So'rovingiz hali qabul qilinmagan. Qabul qilinganidan keyin yozishingiz mumkin."
              : pending?.state === "incoming"
                ? "Bog'lanish so'rovini qabul qilsangiz, yozishuv ochiladi."
                : "Yozishuv faqat bog'langan maqsaddoshlar bilan ochiladi."}
          </p>
          {pending && other ? (
            <ConnectButton meId={meId} userId={other.id} name={other.full_name} connection={pending} />
          ) : null}
        </div>
      )}
    </div>
  );
}
