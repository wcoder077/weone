"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { recordPostViews } from "@/lib/actions/posts";
import { formatCount } from "@/lib/format";

// Ids already reported in this browser tab, so scrolling back and forth sends nothing twice.
const reported = new Set<string>();

// Views seen within a short window go to the server in one request, not one per post.
const FLUSH_MS = 1500;
const BATCH_MAX = 50;
const waiting = new Map<string, (firstTime: boolean) => void>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  flushTimer = undefined;
  const batch = [...waiting.entries()].slice(0, BATCH_MAX);
  for (const [id] of batch) waiting.delete(id);
  if (waiting.size > 0) flushTimer = setTimeout(flush, FLUSH_MS);
  recordPostViews(batch.map(([id]) => id))
    .catch((): string[] => [])
    .then((firstTime) => {
      for (const [id, done] of batch) done(firstTime.includes(id));
    });
}

function queueView(postId: string, done: (firstTime: boolean) => void) {
  waiting.set(postId, done);
  flushTimer ??= setTimeout(flush, FLUSH_MS);
}

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
        timer = setTimeout(() => {
          observer.disconnect();
          reported.add(postId);
          queueView(postId, (firstTime) => {
            if (firstTime) setCount((n) => n + 1);
          });
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
