"use client";

import { useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { setTicketStatus } from "@/lib/actions/admin";
import { toast } from "@/lib/toast";
import { useT } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

export function TicketStatusButton({ adminPath, ticketId, status }: { adminPath: string; ticketId: string; status: "open" | "resolved" }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const next = status === "open" ? "resolved" : "open";

  function change() {
    startTransition(async () => {
      const result = await setTicketStatus(adminPath, ticketId, next);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button variant={status === "open" ? "default" : "outline"} onClick={change} disabled={pending} aria-busy={pending}>
      {status === "open" ? <Check data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" />}
      {status === "open" ? t("Hal qilindi") : t("Qayta ochish")}
    </Button>
  );
}
