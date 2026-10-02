"use client";

import { Share2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

export function ShareButton({ path }: { path: string }) {
  const t = useT();
  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      toast.success("Havola nusxalandi");
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  }

  return (
    <Button variant="outline" onClick={copy}>
      <Share2 data-icon="inline-start" />
      {t("Ulashish")}</Button>
  );
}
