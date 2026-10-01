"use client";

import { useState, useTransition } from "react";
import { ChevronDown, MessageCircle, Pencil, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { cancelConnectionRequest, openConversation, respondConnectionRequest } from "@/lib/actions/connections";
import type { ActionState } from "@/lib/actions/types";
import type { ConnectionState } from "@/lib/queries/social";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RequestComposeDialog, RequestReviewDialog } from "./request-dialogs";

// Bog'lanish → So'rov yuborildi (edit / cancel) → Xabar yozish; incoming → Accept / Reject.
export function ConnectButton({
  meId,
  userId,
  name,
  connection,
  className,
}: {
  meId: string;
  userId: string;
  name: string;
  connection: ConnectionState;
  className?: string;
}) {
  const [dialog, setDialog] = useState<"compose" | "edit" | "review" | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast.error(result.error);
      else if (result?.message) toast.success(result.message);
    });
  const close = (open: boolean) => !open && setDialog(null);

  switch (connection.state) {
    case "none":
      return (
        <>
          <Button className={className} onClick={() => setDialog("compose")}>
            <UserPlus data-icon="inline-start" />
            Bog&apos;lanish
          </Button>
          <RequestComposeDialog
            open={dialog === "compose"}
            onOpenChange={close}
            meId={meId}
            recipientName={name}
            mode={{ kind: "new", addresseeId: userId }}
          />
        </>
      );

    case "outgoing":
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={pending}
              render={<Button variant="outline" className={className} />}
            >
              So&apos;rov yuborildi
              <ChevronDown data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem onClick={() => setDialog("edit")}>
                <Pencil aria-hidden />
                Xabarni tahrirlash
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => run(() => cancelConnectionRequest(connection.connectionId))}>
                <X aria-hidden />
                So&apos;rovni bekor qilish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <RequestComposeDialog
            open={dialog === "edit"}
            onOpenChange={close}
            meId={meId}
            recipientName={name}
            mode={{ kind: "edit", connectionId: connection.connectionId }}
          />
        </>
      );

    case "incoming":
      return (
        <>
          <span className={cn("flex gap-2", className)}>
            <Button className="flex-1" disabled={pending} onClick={() => run(() => respondConnectionRequest(connection.connectionId, true))}>
              Qabul qilish
            </Button>
            <Button variant="outline" className="flex-1" disabled={pending} onClick={() => run(() => respondConnectionRequest(connection.connectionId, false))}>
              Rad etish
            </Button>
            <Button variant="ghost" size="icon" aria-label="So'rov xabarini ko'rish" onClick={() => setDialog("review")}>
              <MessageCircle />
            </Button>
          </span>
          <RequestReviewDialog
            open={dialog === "review"}
            onOpenChange={close}
            connectionId={connection.connectionId}
            senderName={name}
          />
        </>
      );

    case "connected":
      return (
        <Button className={className} disabled={pending} onClick={() => run(() => openConversation(userId))}>
          <MessageCircle data-icon="inline-start" />
          Xabar yozish
        </Button>
      );

    case "rejected":
      return (
        <Button variant="outline" disabled className={className}>
          {connection.byMe ? "Siz rad etgansiz" : "So'rov rad etildi"}
        </Button>
      );
  }
}
