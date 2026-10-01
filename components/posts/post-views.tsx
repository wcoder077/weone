"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { recordPostViews } from "@/lib/actions/posts";
import { formatCount } from "@/lib/format";

// Ids already reported in this browser tab, so scrolling back and forth sends nothing twice.
const reported = new Set<string>();

// View counter. A post counts as seen when at least 60 % of it stays on screen for a second.
// Your own posts are never counted (the database ignores them too).
export function PostViews({ postId, initialCount, track }: { postId: string; initialCount: number; track: boolean }) {
  const [count, setCount] = useState(initialCount);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = ref.current?.closest("article") ?? ref.current;
    if (!track || !target || reported.has(postId)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (!entry?.isIntersecting) return;
        timer = setTimeout(async () => {
          observer.disconnect();
          reported.add(postId);
          const firstTime = await recordPostViews([postId]);
          if (firstTime.includes(postId)) setCount((n) => n + 1);
        }, 1000);
      },
      { threshold: 0.6 },
    );
    observer.observe(target);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [postId, track]);

  return (
    <span ref={ref} className="text-muted inline-flex min-h-11 items-center gap-1.5 px-3 text-[14px]" aria-label={`${count} marta ko'rilgan`}>
      <Eye className="size-5" aria-hidden />
      <span className="tabular-nums">{formatCount(count)}</span>
    </span>
  );
}
