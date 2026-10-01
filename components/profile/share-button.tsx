"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ path }: { path: string }) {
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
      Ulashish
    </Button>
  );
}
