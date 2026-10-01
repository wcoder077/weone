"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { addComment } from "@/lib/actions/posts";
import { graphemeLength } from "@/lib/text";
import { COMMENT_MAX } from "@/lib/validation/post";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";

export function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const count = graphemeLength(body.trim());
  const invalid = count === 0 || count > COMMENT_MAX;

  function submit() {
    if (invalid || pending) return;
    startTransition(async () => {
      const result = await addComment(postId, body);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setBody("");
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2"
    >
      <div className="border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-w-0 flex-1 items-end rounded-3xl border focus-within:ring-3">
        <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, body, emoji, setBody)} />
        <label htmlFor="comment-input" className="sr-only">
          Izoh
        </label>
        <textarea
          id="comment-input"
          ref={fieldRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          placeholder="Izoh yozing…"
          aria-invalid={count > COMMENT_MAX}
          className="field-sizing-content max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 pr-4 text-[15px] leading-snug outline-none"
        />
      </div>
      <Button type="submit" size="icon" aria-label="Izohni yuborish" disabled={invalid || pending}>
        <Send />
      </Button>
    </form>
  );
}
