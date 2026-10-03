"use client";

import { useT } from "@/components/i18n/i18n-provider";
import { toast } from "@/lib/toast";

// Tap the @username to copy it (text selection is off in the app, so this is the way to take it).
export function CopyUsername({ username }: { username: string }) {
  const t = useT();
  function copy() {
    navigator.clipboard.writeText(`@${username}`).then(
      () => toast.success("Nusxa olindi"),
      () => toast.error("Nusxa olib bo'lmadi"),
    );
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t("Nusxa olish")}
      className="text-muted hover:text-text focus-visible:ring-ring/50 -my-2 min-h-11 w-fit rounded-full text-left outline-none focus-visible:ring-3"
    >
      @{username}
    </button>
  );
}
