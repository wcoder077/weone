"use client";

import { useState, useTransition } from "react";
import { ChevronDown, MessageCircle, Pencil, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { cancelConnectionRequest, openConversation, reconnect, removeConnection, respondConnectionRequest } from "@/lib/actions/connections";
import type { ActionState } from "@/lib/actions/types";
import type { ConnectionState } from "@/lib/queries/social";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RequestComposeDialog, RequestReviewDialog } from "./request-dialogs";
import { useT } from "@/components/i18n/i18n-provider";

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
  const t = useT();
  const [dialog, setDialog] = useState<"compose" | "edit" | "review" | "remove" | null>(null);
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
            {t("Bog'lanish")}</Button>
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
              {t("So'rov yuborildi")}<ChevronDown data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem onClick={() => setDialog("edit")}>
                <Pencil aria-hidden />
                {t("Xabarni tahrirlash")}</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => run(() => cancelConnectionRequest(connection.connectionId))}>
                <X aria-hidden />
                {t("So'rovni bekor qilish")}</DropdownMenuItem>
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
              {t("Qabul qilish")}</Button>
            <Button variant="outline" className="flex-1" disabled={pending} onClick={() => run(() => respondConnectionRequest(connection.connectionId, false))}>
              {t("Rad etish")}</Button>
            <Button variant="ghost" size="icon" aria-label={t("So'rov xabarini ko'rish")} onClick={() => setDialog("review")}>
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
        <>
          <span className={cn("flex gap-2", className)}>
            <Button className="flex-1" disabled={pending} onClick={() => run(() => openConversation(userId))}>
              <MessageCircle data-icon="inline-start" />
              {t("Xabar yozish")}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={pending}
                aria-label={t("Bog'lanish amallari")}
                render={<Button variant="outline" size="icon" />}
              >
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem variant="destructive" onClick={() => setDialog("remove")}>
                  <UserMinus aria-hidden />
                  {t("Bog'lanishni uzish")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
          <ResponsiveDialog
            open={dialog === "remove"}
            onOpenChange={close}
            title={t("Bog'lanishni uzasizmi?")}
            description={t("{name} bilan yozishuv tarixi saqlanadi, lekin yangi xabar yozib bo'lmaydi. Keyin qayta bog'lanish mumkin.", { name })}
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => setDialog(null)}>
                {t("Bekor qilish")}</Button>
              <Button
                variant="destructive"
                size="lg"
                disabled={pending}
                onClick={() => {
                  setDialog(null);
                  run(() => removeConnection(connection.connectionId));
                }}
              >
                {t("Uzish")}
              </Button>
            </div>
          </ResponsiveDialog>
        </>
      );

    case "removed":
      return (
        <Button variant="outline" className={className} disabled={pending} onClick={() => run(() => reconnect(connection.connectionId))}>
          <UserPlus data-icon="inline-start" />
          {t("Qayta bog'lanish")}</Button>
      );

    case "rejected":
      return (
        <Button variant="outline" disabled className={className}>
          {connection.byMe ? t("Siz rad etgansiz") : t("So'rov rad etildi")}
        </Button>
      );
  }
}
