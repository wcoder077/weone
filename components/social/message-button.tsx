"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { openConversation } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";

export function MessageButton({ userId, className }: { userId: string; className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          // Redirects to the chat on success.
          const result = await openConversation(userId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      <MessageCircle data-icon="inline-start" />
      Xabar
    </Button>
  );
}
