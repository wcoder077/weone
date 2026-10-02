"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ConversationSummary } from "@/lib/queries/messages";
import { cn } from "@/lib/utils";
import { ConversationRow } from "./conversation-row";
import { RefreshIfStale } from "@/components/shared/refresh-if-stale";
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
            Hali suhbat yo&apos;q. Bog&apos;langan maqsaddoshingiz profilida «Xabar yozish» tugmasini bosing.
          </p>
        ) : (
          <ul className="divide-border/70 border-border/70 flex min-h-0 flex-col divide-y overflow-y-auto border-t pb-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <ConversationRow conversation={c} active={c.id === activeId} />
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className={cn("min-h-0 min-w-0", !inChat && "hidden lg:block")}>{children}</section>
      <LiveConversationRefresh />
      <RefreshIfStale path="/messages" />
    </div>
  );
}
