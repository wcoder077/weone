"use client";

import { useState } from "react";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

// The first paragraph is the title; whatever follows a blank line stays folded until "Yana".
// Works for old posts too: it only reads the text.
export function splitPostBody(body: string) {
  const match = /\n[ \t]*\n/.exec(body);
  if (!match) return { title: body, rest: "" };
  const rest = body.slice(match.index + match[0].length).trim();
  return { title: body.slice(0, match.index).trimEnd(), rest };
}

// Longer texts are cut after this many characters until "Yana" is pressed.
export const PREVIEW_LENGTH = 200;

// Cuts at a space (so a link is never split in half) and counts characters, not UTF-16 units.
export function previewOf(text: string, max = PREVIEW_LENGTH) {
  const chars = Array.from(text);
  if (chars.length <= max) return { preview: text, cut: false };
  const head = chars.slice(0, max).join("");
  const lastSpace = head.search(/\s\S*$/);
  return { preview: (lastSpace > max / 2 ? head.slice(0, lastSpace) : head).trimEnd() + "…", cut: true };
}

// Plain React text nodes (escaped, never HTML); whitespace-pre-wrap keeps the author's line breaks.
export function PostBody({ body, small = false, expanded = false }: { body: string; small?: boolean; expanded?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(expanded);
  const { title, rest } = splitPostBody(body);
  const { preview, cut } = previewOf(title);
  const text = cn("max-w-[65ch] leading-[1.6] break-words whitespace-pre-wrap select-text", small ? "text-[15px]" : "text-base");
  const foldable = Boolean(rest) || cut;

  const toggle = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className="text-primary -my-2 min-h-11 self-start text-[14px] font-medium hover:underline"
    >
      {open ? t("Yopish") : t("Yana")}
    </button>
  );

  if (!foldable) return <p className={text}><LinkifiedText text={body} tags /></p>;
  return (
    <div className="flex flex-col gap-2">
      <p className={cn(text, rest && "font-semibold")}><LinkifiedText text={open ? title : preview} tags /></p>
      {open && rest ? <p className={text}><LinkifiedText text={rest} tags /></p> : null}
      {toggle}
    </div>
  );
}
