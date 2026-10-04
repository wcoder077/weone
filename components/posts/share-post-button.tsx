"use client";

import { Share2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useT } from "@/components/i18n/i18n-provider";

const SNIPPET = 100;

// Share right under the post. On phones this opens the system share sheet (Telegram, Instagram,
// WhatsApp…); where that is not available (most desktop browsers) the link is copied instead.
export function SharePostButton({ postId, author, body }: { postId: string; author: string; body: string }) {
  const t = useT();

  async function share() {
    const url = `${window.location.origin}/posts/${postId}`;
    const text = body.length > SNIPPET ? `${body.slice(0, SNIPPET).trimEnd()}…` : body;
    if (navigator.share) {
      try {
        await navigator.share({ title: author, text, url });
      } catch {
        // The person closed the share sheet: nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Havola nusxalandi");
    } catch {
      toast.error("Nusxa olib bo'lmadi");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={t("Ulashish")}
      className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-full px-3 transition-colors duration-150 outline-none focus-visible:ring-3"
    >
      <Share2 className="size-5" aria-hidden />
    </button>
  );
}
