"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleLike } from "@/lib/actions/posts";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// Optimistic: the heart and the number change at once, the server answer then replaces them.
export function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked: boolean; initialCount: number }) {
  const t = useT();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const before = { liked, count };
    setLiked(!liked);
    setCount(Math.max(0, count + (liked ? -1 : 1)));
    startTransition(async () => {
      const result = await toggleLike(postId);
      if ("error" in result) {
        setLiked(before.liked);
        setCount(before.count);
        toast.error(result.error);
        return;
      }
      setLiked(result.liked);
      setCount(result.count);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? t("Yoqtirishni bekor qilish") : t("Yoqtirish")}
      className={cn(
        "hover:bg-surface focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[14px] transition-colors duration-150 outline-none focus-visible:ring-3",
        liked ? "text-danger" : "text-muted hover:text-text",
      )}
    >
      <Heart className={cn("size-5", liked && "fill-current")} aria-hidden />
      <span className="tabular-nums">{formatCount(count)}</span>
    </button>
  );
}
