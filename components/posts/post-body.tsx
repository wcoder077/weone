"use client";

import { useState } from "react";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { cn } from "@/lib/utils";

// The first paragraph is the title; whatever follows a blank line stays folded until "Yana".
// Works for old posts too: it only reads the text.
export function splitPostBody(body: string) {
  const match = /\n[ \t]*\n/.exec(body);
  if (!match) return { title: body, rest: "" };
  const rest = body.slice(match.index + match[0].length).trim();
  return { title: body.slice(0, match.index).trimEnd(), rest };
}

// Plain React text nodes (escaped, never HTML); whitespace-pre-wrap keeps the author's line breaks.
export function PostBody({ body, small = false, expanded = false }: { body: string; small?: boolean; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  const { title, rest } = splitPostBody(body);
  const text = cn("max-w-[65ch] leading-[1.6] break-words whitespace-pre-wrap", small ? "text-[15px]" : "text-base");

  if (!rest) return <p className={text}><LinkifiedText text={body} /></p>;
  return (
    <div className="flex flex-col gap-2">
      <p className={cn(text, "font-semibold")}><LinkifiedText text={title} /></p>
      {open ? <p className={text}><LinkifiedText text={rest} /></p> : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-primary -my-2 min-h-11 self-start text-[14px] font-medium hover:underline"
      >
        {open ? "Yopish" : "Yana"}
      </button>
    </div>
  );
}
