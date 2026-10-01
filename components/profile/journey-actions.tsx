"use client";

import { useTransition } from "react";
import { BadgeCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmJourneyItem, deleteJourneyItem } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";

function toastResult(result: ActionState) {
  if (result?.error) toast.error(result.error);
  else if (result?.message) toast.success(result.message);
}

export function DeleteJourneyButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${title} — o'chirish`}
      disabled={pending}
      onClick={() => startTransition(async () => toastResult(await deleteJourneyItem(id)))}
    >
      <Trash2 />
    </Button>
  );
}

export function ConfirmJourneyButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => toastResult(await confirmJourneyItem(id)))}
    >
      <BadgeCheck data-icon="inline-start" />
      Tasdiqlash
    </Button>
  );
}
