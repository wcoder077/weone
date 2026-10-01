"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideJoinRequest } from "@/lib/actions/projects";
import { acceptCollab, declineCollab, respondConnection } from "@/lib/actions/social";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";

function AcceptDecline({
  onAccept,
  onDecline,
  acceptLabel = "Qabul qilish",
}: {
  onAccept: () => Promise<ActionState>;
  onDecline: () => Promise<ActionState>;
  acceptLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast.error(result.error);
      else if (result?.message) toast.success(result.message);
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => run(onAccept)}>
        {acceptLabel}
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(onDecline)}>
        Rad etish
      </Button>
    </div>
  );
}

export function ConnectionRequestActions({ connectionId }: { connectionId: string }) {
  return (
    <AcceptDecline
      onAccept={() => respondConnection(connectionId, true)}
      onDecline={() => respondConnection(connectionId, false)}
    />
  );
}

// Accepting redirects to the new chat.
export function CollabRequestActions({ requestId }: { requestId: string }) {
  return (
    <AcceptDecline
      acceptLabel="Qabul qilish va yozish"
      onAccept={() => acceptCollab(requestId)}
      onDecline={() => declineCollab(requestId)}
    />
  );
}

export function JoinRequestActions({ requestId }: { requestId: string }) {
  return (
    <AcceptDecline
      onAccept={() => decideJoinRequest(requestId, true)}
      onDecline={() => decideJoinRequest(requestId, false)}
    />
  );
}
