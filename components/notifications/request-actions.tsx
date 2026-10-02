"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideJoinRequest } from "@/lib/actions/projects";
import { respondConnectionRequest } from "@/lib/actions/connections";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

function AcceptDecline({
  onAccept,
  onDecline,
}: {
  onAccept: () => Promise<ActionState>;
  onDecline: () => Promise<ActionState>;
}) {
  const t = useT();
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
        {t("Qabul qilish")}</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(onDecline)}>
        {t("Rad etish")}</Button>
    </div>
  );
}

export function ConnectionRequestActions({ connectionId }: { connectionId: string }) {
  return (
    <AcceptDecline
      onAccept={() => respondConnectionRequest(connectionId, true)}
      onDecline={() => respondConnectionRequest(connectionId, false)}
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
