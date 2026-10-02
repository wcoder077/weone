"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { hashtagHref } from "@/lib/hashtag";

// A link (http(s):// or www.) OR a hashtag: "#" at the start or after whitespace/"(", then 2-50
// letters, digits or "_" (no lookbehind: older Safari cannot parse it). Links come first in the
// pattern, so a "#fragment" inside a URL stays part of the link.
const TOKEN =
  /\b(?:https?:\/\/|www\.)[^\s<>"']+|(^|[\s(])#([^\s#.,;:!?(){}\[\]<>"'/\\|@$%^&*+=~`-]{2,50})/gi;
// Punctuation that usually ends a sentence, not the link: "see https://a.com."
const TRAILING = /[.,;:!?)\]}»”’]+$/;
const LINK_CLASS = "text-primary underline-offset-2 hover:underline";

function hrefOf(raw: string) {
  const href = /^www\./i.test(raw) ? `https://${raw}` : raw;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

// Stops the click from reaching a clickable or long-press area around the text (chat bubble, card).
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

// Plain text with real, clickable links. Built from React elements (never HTML), so user text
// stays escaped; only http(s) links are made, and they open in a new tab without referrer access.
// With `tags`, "#hashtags" link to their tag page (posts only: that is where tags are indexed).
export function LinkifiedText({ text, tags = false }: { text: string; tags?: boolean }) {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    const [whole, before, tag] = match;

    if (tag !== undefined) {
      const href = tags ? hashtagHref(tag) : null;
      if (!href) continue;
      const start = match.index + before.length;
      if (start > last) parts.push(text.slice(last, start));
      parts.push(
        <Link key={start} href={href} onClick={stop} className={LINK_CLASS}>
          #{tag}
        </Link>,
      );
      last = start + 1 + tag.length;
      continue;
    }

    const trimmed = whole.replace(TRAILING, "");
    const href = hrefOf(trimmed);
    if (!href) continue;
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        onClick={stop}
        className={`${LINK_CLASS} underline break-all`}
      >
        {trimmed}
      </a>,
    );
    last = match.index + trimmed.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>);
}
