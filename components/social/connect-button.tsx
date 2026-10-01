"use client";

import { useTransition } from "react";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { removeConnection, respondConnection, sendConnection } from "@/lib/actions/social";
import type { ActionState } from "@/lib/actions/types";
import type { ConnectionState } from "@/lib/queries/social";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shows the right action for the current connection state with `userId`.
export function ConnectButton({
  userId,
  connection,
  className,
}: {
  userId: string;
  connection: ConnectionState;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast.error(result.error);
      else if (result?.message) toast.success(result.message);
    });

  switch (connection.state) {
    case "none":
      return (
        <Button variant="outline" disabled={pending} className={className} onClick={() => run(() => sendConnection(userId))}>
          <UserPlus data-icon="inline-start" />
          Bog&apos;lanish
        </Button>
      );
    case "outgoing":
      return (
        <Button
          variant="outline"
          disabled={pending}
          className={cn("text-muted", className)}
          onClick={() => run(() => removeConnection(connection.connectionId))}
          title="Bekor qilish uchun bosing"
        >
          So&apos;rov yuborildi
        </Button>
      );
    case "incoming":
      return (
        <span className={cn("flex gap-2", className)}>
          <Button disabled={pending} onClick={() => run(() => respondConnection(connection.connectionId, true))}>
            Qabul qilish
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => run(() => respondConnection(connection.connectionId, false))}>
            Rad etish
          </Button>
        </span>
      );
    case "connected":
      return (
        <Button variant="outline" disabled className={cn("disabled:opacity-100", className)}>
          <Check data-icon="inline-start" />
          Bog&apos;langansiz
        </Button>
      );
  }
}
