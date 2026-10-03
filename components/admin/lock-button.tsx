"use client";

import { useTransition } from "react";
import { Lock } from "lucide-react";
import { lockAdmin } from "@/lib/actions/admin";
import { useT } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

export function LockButton({ adminPath }: { adminPath: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" onClick={() => startTransition(() => lockAdmin(adminPath))} disabled={pending}>
      <Lock data-icon="inline-start" />
      {t("Qulflash")}
    </Button>
  );
}
