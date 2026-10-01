"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { formatRelative } from "@/lib/format";
import type { ConversationSummary } from "@/lib/queries/messages";
import { Badge } from "@/components/shared/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { LiveConversationRefresh } from "./live-refresh";

// Desktop: list + chat side by side. Mobile: list on /messages, chat alone on /messages/[id].
export function MessagesShell({ conversations, children }: { conversations: ConversationSummary[]; children: ReactNode }) {
  const activeId = useSelectedLayoutSegment();
  const inChat = activeId !== null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:h-[calc(100dvh-7.5rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside
        aria-label="Suhbatlar"
        className={cn(
          "bg-card border-border rounded-card flex min-h-0 min-w-0 flex-col border",
          inChat && "hidden lg:flex",
        )}
      >
        <h1 className="px-5 pt-5 pb-3 text-xl font-bold">Xabarlar</h1>
        {conversations.length === 0 ? (
          <p className="text-muted px-5 pb-5 text-[14px]">
            Hali suhbat yo&apos;q. Bog&apos;langan odamingiz profilida «Xabar yozish» tugmasini bosing.
          </p>
        ) : (
          <ul className="flex min-h-0 flex-col overflow-y-auto px-2 pb-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <ConversationLink conversation={c} active={c.id === activeId} />
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className={cn("min-h-0 min-w-0", !inChat && "hidden lg:block")}>{children}</section>
      <LiveConversationRefresh />
    </div>
  );
}

function ConversationLink({ conversation: c, active }: { conversation: ConversationSummary; active: boolean }) {
  const preview = c.last ? (c.last.kind === "project_invite" ? "Loyihaga taklif" : c.last.body) : "Yangi suhbat";
  return (
    <Link
      href={`/messages/${c.id}`}
      aria-current={active ? "page" : undefined}
      className={cn("flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors", active ? "bg-surface" : "hover:bg-surface/60")}
    >
      <UserAvatar name={c.other?.full_name ?? "?"} url={c.other?.avatar_url ?? null} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("flex min-w-0 items-center gap-2", c.unread > 0 ? "font-semibold" : "font-medium")}>
            <span className="truncate">{c.other?.full_name ?? "Suhbat"}</span>
            {c.status === "pending" ? <Badge className="h-5 px-2 text-[11px]">Jarayonda</Badge> : null}
          </span>
          {c.last ? <span className="text-muted shrink-0 text-[12px]">{formatRelative(c.last.created_at)}</span> : null}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[14px]", c.unread > 0 ? "text-text" : "text-muted")}>{preview}</span>
          {c.unread > 0 ? (
            <span className="bg-text text-bg flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
              {c.unread}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
