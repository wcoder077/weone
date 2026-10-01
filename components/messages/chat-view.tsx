"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { markConversationRead, sendMessage } from "@/lib/actions/messages";
import type { ChatMessage } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/format";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InviteCard } from "./invite-card";
import { InviteToProject } from "./invite-to-project";

type Person = { id: string; username: string; full_name: string; avatar_url: string | null; headline: string | null };

type MessageInsert = {
  id: string;
  sender_id: string;
  body: string;
  kind: string;
  project_id: string | null;
  created_at: string;
};

export function ChatView({
  conversationId,
  meId,
  other,
  initialMessages,
  myProjects,
  myProjectIds,
}: {
  conversationId: string;
  meId: string;
  other: Person | null;
  initialMessages: ChatMessage[];
  myProjects: { id: string; name: string }[];
  myProjectIds: string[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Adds a message once, whether it came from our own send or from Realtime.
  function append(message: ChatMessage) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

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
          });
          if (row.sender_id !== meId) void markConversationRead(conversationId);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, meId, router]);

  function send() {
    const body = draft.trim();
    if (!body || sending) return;
    startSending(async () => {
      const result = await sendMessage(conversationId, body);
      if ("error" in result) toast.error(result.error);
      else {
        append(result.message);
        setDraft("");
      }
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="bg-card border-border rounded-card flex h-[calc(100dvh-11rem)] flex-col border lg:h-full">
      <header className="border-border flex items-center gap-3 border-b px-3 py-3 sm:px-5">
        <Link href="/messages" aria-label="Suhbatlarga qaytish" className="text-muted inline-flex size-11 items-center justify-center rounded-full lg:hidden">
          <ArrowLeft className="size-5" />
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
        <InviteToProject conversationId={conversationId} projects={myProjects} onSent={append} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {messages.length === 0 ? (
          <p className="text-muted m-auto text-center text-[14px]">Birinchi xabarni yozing.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId;
            if (m.kind === "project_invite") {
              return (
                <InviteCard
                  key={m.id}
                  message={m}
                  mine={mine}
                  alreadyMember={m.projectId ? myProjectIds.includes(m.projectId) : false}
                />
              );
            }
            return (
              <div key={m.id} className={cn("flex max-w-[80%] flex-col gap-1", mine ? "items-end self-end" : "items-start")}>
                <p
                  className={cn(
                    "rounded-3xl px-4 py-2.5 text-[15px] leading-snug break-words whitespace-pre-wrap",
                    mine ? "bg-border rounded-br-lg" : "bg-surface rounded-bl-lg",
                  )}
                >
                  {m.body}
                </p>
                <span className="text-muted px-2 text-[11px]">{formatTime(m.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-border flex items-end gap-2 border-t p-3"
      >
        <label className="sr-only" htmlFor="message-input">
          Xabar
        </label>
        <textarea
          id="message-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={4000}
          placeholder="Xabar yozing…"
          className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 field-sizing-content max-h-40 min-h-11 flex-1 resize-none rounded-3xl border px-4 py-2.5 text-[15px] outline-none focus-visible:ring-3"
        />
        <Button type="submit" size="icon" aria-label="Yuborish" disabled={sending || !draft.trim()}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
