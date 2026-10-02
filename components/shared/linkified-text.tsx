import { Fragment, type ReactNode } from "react";

// http(s):// or www. followed by non-space characters.
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
// Punctuation that usually ends a sentence, not the link: "see https://a.com."
const TRAILING = /[.,;:!?)\]}»”’]+$/;

function hrefOf(raw: string) {
  const href = /^www\./i.test(raw) ? `https://${raw}` : raw;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

// Plain text with real, clickable links. Built from React elements (never HTML), so user text
// stays escaped; only http(s) links are made, and they open in a new tab without referrer access.
export function LinkifiedText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const trimmed = match[0].replace(TRAILING, "");
    const href = hrefOf(trimmed);
    if (!href) continue;

    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        // The text may sit inside a clickable or long-press area (chat bubble, card).
        onClick={(e) => e.stopPropagation()}
        className="text-primary underline underline-offset-2 break-all hover:opacity-80"
      >
        {trimmed}
      </a>,
    );
    last = match.index + trimmed.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>);
}
