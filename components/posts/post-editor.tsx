"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/actions/types";
import { graphemeLength } from "@/lib/text";
import { POST_MAX } from "@/lib/validation/post";
import { CharCounter } from "@/components/shared/char-counter";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";

// Text area + emoji + live "x/500" counter; used to create and to edit posts.
export function PostEditor({
  id,
  initial = "",
  submitLabel,
  onSubmit,
  onDone,
  autoFocus = false,
}: {
  id: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<ActionState>;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState(initial);
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const count = graphemeLength(body.trim());
  const invalid = count === 0 || count > POST_MAX;

  function submit() {
    if (invalid || pending) return;
    startTransition(async () => {
      const result = await onSubmit(body);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.message) toast.success(result.message);
      setBody("");
      onDone?.();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor={id} className="sr-only">
        Post matni
      </label>
      <textarea
        id={id}
        ref={fieldRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus={autoFocus}
        rows={3}
        placeholder="Nima ustida ishlayapsiz? Fikr, yangilik yoki savol yozing…"
        aria-describedby={`${id}-count`}
        aria-invalid={count > POST_MAX}
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive field-sizing-content min-h-24 w-full resize-none rounded-2xl border px-4 py-3 text-base leading-[1.6] outline-none focus-visible:ring-3"
      />
      <div className="flex items-center gap-2">
        <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, body, emoji, setBody)} />
        <span className="ml-auto">
          <CharCounter id={`${id}-count`} count={count} max={POST_MAX} />
        </span>
        <Button type="submit" disabled={invalid || pending}>
          {pending ? "Saqlanmoqda…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
