"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { markConversationRead } from "@/lib/actions/messages";
import type { ChatMessage } from "@/lib/queries/messages";
import type { ConnectionState } from "@/lib/queries/social";
import { createClient } from "@/lib/supabase/client";
import { formatDay } from "@/lib/format";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConnectButton } from "@/components/social/connect-button";
import { ChatComposer } from "./chat-composer";
import { InviteCard } from "./invite-card";
import { InviteToProject } from "./invite-to-project";
import { DaySeparator, MessageBubble } from "./message-bubble";

type Person = { id: string; username: string; full_name: string; avatar_url: string | null; headline: string | null };

type MessageInsert = {
  id: string;
  sender_id: string;
  body: string;
  kind: string;
  project_id: string | null;
  created_at: string;
};

type MessageUpdate = { id: string; body: string; edited_at: string | null };

type Connection = { id: string; status: string; requestedByMe: boolean } | null;

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
  myProjects,
  myProjectIds,
  connection,
}: {
  conversationId: string;
  meId: string;
  other: Person | null;
  initialMessages: ChatMessage[];
  myProjects: { id: string; name: string }[];
  myProjectIds: string[];
  connection: Connection;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
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
    // Read on open; refresh so the list's unread counts update.
    void markConversationRead(conversationId).then(() => router.refresh());

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on<MessageInsert>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const row = payload.new;
          // Invite cards need the project; Realtime rows carry only its id.
          const project = row.project_id
            ? (await supabase.from("projects").select("name, slug, tagline, logo_url").eq("id", row.project_id).maybeSingle()).data
            : null;
          append({
            id: row.id,
            senderId: row.sender_id,
            body: row.body,
            kind: row.kind,
            createdAt: row.created_at,
            projectId: row.project_id,
            project,
            editedAt: null,
            imageUrl: null,
          });
          if (row.sender_id !== meId) void markConversationRead(conversationId);
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
          if (old.id) setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, meId, router]);

  return (
    // Below lg the chat is a full-screen view (the app bars are hidden, see isConversationPath).
    <div className="bg-card flex flex-col overflow-hidden max-lg:fixed max-lg:inset-0 max-lg:z-50 lg:border-border lg:rounded-card lg:h-full lg:border">
      <header className="border-border flex items-center gap-2 border-b px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-4 lg:gap-3 lg:px-5 lg:py-3">
        <Link
          href="/messages"
          aria-label="Suhbatlarga qaytish"
          className="text-text hover:bg-surface inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full pr-3 pl-2 text-[15px] font-medium transition-colors duration-150 lg:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Orqaga
        </Link>
        {other ? (
          <Link href={`/u/${other.username}`} className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatar name={other.full_name} url={other.avatar_url} />
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

      <div className="chat-surface flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6" aria-live="polite">
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
                  />
                )}
              </Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {open ? (
        <ChatComposer conversationId={conversationId} onSent={append} />
      ) : (
        <div role="status" className="border-border flex flex-col items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-muted text-[14px]">
            {pending?.state === "outgoing"
              ? "So'rovingiz hali qabul qilinmagan. Qabul qilinganidan keyin yozishingiz mumkin."
              : pending?.state === "incoming"
                ? "Bog'lanish so'rovini qabul qilsangiz, yozishuv ochiladi."
                : "Yozishuv faqat bog'langan odamlar bilan ochiladi."}
          </p>
          {pending && other ? (
            <ConnectButton meId={meId} userId={other.id} name={other.full_name} connection={pending} />
          ) : null}
        </div>
      )}
    </div>
  );
}
