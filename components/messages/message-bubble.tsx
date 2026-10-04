"use client";

import { LinkifiedText } from "@/components/shared/linkified-text";
import { useRef, useState, type RefObject, type TouchEvent } from "react";
import type { ChatMessage } from "@/lib/queries/messages";
import { Check, CheckCheck, Reply } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { ReadStatus } from "@/lib/read-status";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { AttachmentView } from "./attachment-view";
import { groupReactions } from "@/lib/reactions";
import { MessageActions } from "./message-actions";
import { useLongPress } from "./use-long-press";
import { useT } from "@/components/i18n/i18n-provider";

type EditHandlers = {
  onEdited: (id: string, body: string, editedAt: string) => void;
  onDeleted: (id: string) => void;
};

const SWIPE_REPLY_PX = 56; // drag right this far to reply (touch)
const SWIPE_MAX_PX = 72;

// Scrolls to a quoted message and briefly highlights it.
function jumpTo(id: string) {
  const el = document.getElementById(`msg-${id}`);
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.animate([{ backgroundColor: "rgb(61 75 255 / 0.18)" }, { backgroundColor: "transparent" }], { duration: 1200 });
}

// Own messages on the right, the other person's on the left. Text is rendered
// as plain text (React escapes it); line breaks are preserved by CSS.
// `onReply` is passed in an open chat (menu, long-press, swipe right on touch);
// `editing` only for my own text messages there.
export function MessageBubble({
  message,
  mine,
  editing,
  status,
  onReply,
  onReact,
  meId,
  replyName,
}: {
  message: ChatMessage;
  mine: boolean;
  editing?: EditHandlers;
  /** Own messages only: ✓ sent, ✓✓ read by the other person. */
  status?: ReadStatus;
  onReply?: () => void;
  /** Pass in an open chat: the menu gets a reaction row and the chips under the bubble toggle my reaction. */
  onReact?: (emoji: string | null) => void;
  meId?: string;
  /** Who wrote the quoted message ("Siz" or the other person's name). */
  replyName?: string;
}) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useLongPress(() => setMenuOpen(true));
  const bubbleRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  // My messages (right side) swipe left, the other person's swipe right.
  const swipeHandlers = useSwipeToReply(bubbleRef, iconRef, mine ? -1 : 1, onReply);
  const hasMenu = Boolean(onReply || editing || onReact);
  const reactionGroups = meId ? groupReactions(message.reactions, meId) : [];
  const myReaction = reactionGroups.find((group) => group.mine)?.emoji;
  const actions = hasMenu ? (
    <MessageActions
      messageId={message.id}
      body={message.body}
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onReply={onReply}
      onReact={onReact}
      myReaction={myReaction}
      own={
        editing
          ? {
              // Attachment messages can be deleted but not edited (delete and resend instead).
              canEdit: !message.attachment,
              onEdited: (body, editedAt) => editing.onEdited(message.id, body, editedAt),
              onDeleted: () => editing.onDeleted(message.id),
            }
          : undefined
      }
    />
  ) : null;

  return (
    <div
      id={`msg-${message.id}`}
      className={cn("group flex max-w-[85%] flex-col gap-1 rounded-3xl sm:max-w-[70%]", mine ? "items-end self-end" : "items-start")}
    >
      <div className="relative flex max-w-full items-center gap-1">
        {onReply ? (
          <span
            ref={iconRef}
            aria-hidden
            // Behind the bubble, revealed as the bubble slides away (stays inside the list).
            className={cn("text-primary absolute top-1/2 z-0 -translate-y-1/2 opacity-0", mine ? "right-2" : "left-2")}
          >
            <Reply className="size-5" />
          </span>
        ) : null}
        {mine ? actions : null}
        <div
          ref={bubbleRef}
          {...(hasMenu ? longPress : {})}
          {...(onReply ? swipeHandlers : {})}
          // Desktop (mouse): double-click any message to reply; the first mousedown of a
          // double-click doesn't select a word.
          onDoubleClick={
            onReply
              ? () => {
                  if (window.matchMedia("(pointer: fine)").matches) onReply();
                }
              : undefined
          }
          onMouseDown={onReply ? (e) => e.detail > 1 && e.preventDefault() : undefined}
          className={cn(
            "relative z-10 min-w-0 rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-[0_1px_0_rgb(0_0_0/0.04)]",
            mine ? "bg-bubble-mine rounded-br-lg" : "bg-card border-border rounded-bl-lg border",
            // Long-press opens the menu on touch, so the native selection callout is off there ("Nusxa olish" copies).
            hasMenu && "pointer-coarse:touch-callout-none pointer-coarse:select-none",
          )}
        >
          {message.replyTo ? (
            <button
              type="button"
              onClick={() => jumpTo(message.replyTo!.id)}
              className="border-primary bg-primary/10 -mx-1 mb-1.5 block w-[calc(100%+0.5rem)] min-w-0 rounded-xl border-l-[3px] px-2.5 py-1 text-left"
            >
              <span className="text-text block truncate text-[12px] font-semibold">{replyName ?? t("Xabar")}</span>
              <span className="text-muted block truncate text-[13px] leading-snug">{message.replyTo.preview}</span>
            </button>
          ) : null}
          {message.imageUrl ? (
            // Signed URL of a private first-message image; tap opens it large.
            <div className="mb-2">
              <ImageLightbox src={message.imageUrl} alt={t("Xabardagi rasm")} className="max-h-64 rounded-2xl object-cover" />
            </div>
          ) : null}
          {message.attachment ? (
            <div className={cn(message.body && "mb-2", "-mx-1 -mt-1 first:mt-0")}>
              <AttachmentView attachment={message.attachment} />
            </div>
          ) : null}
          {message.body ? <LinkifiedText text={message.body} /> : null}
        </div>
        {mine ? null : actions}
      </div>
      {reactionGroups.length > 0 ? (
        <div className={cn("flex flex-wrap gap-1 px-1", mine ? "justify-end" : "justify-start")} role="group" aria-label={t("Reaksiyalar")}>
          {reactionGroups.map((group) => (
            <button
              key={group.emoji}
              type="button"
              onClick={onReact ? () => onReact(group.mine ? null : group.emoji) : undefined}
              disabled={!onReact}
              aria-pressed={group.mine}
              className={cn(
                "inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-[13px] leading-none transition-colors disabled:cursor-default",
                group.mine ? "border-primary bg-primary/15" : "border-border bg-card",
              )}
            >
              <span>{group.emoji}</span>
              {group.count > 1 ? <span className="text-muted tabular-nums">{group.count}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <span className="text-muted inline-flex items-center gap-1 px-2 text-[11px]">
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        {message.editedAt ? t(" · tahrirlangan") : null}
        {status ? <ReadMark status={status} /> : null}
      </span>
    </div>
  );
}

// Touch: drag a bubble sideways to reply (Telegram-style); `direction` 1 = right, -1 = left.
// Styles are written directly to the element, so dragging never re-renders React.
function useSwipeToReply(
  bubbleRef: RefObject<HTMLDivElement | null>,
  iconRef: RefObject<HTMLSpanElement | null>,
  direction: 1 | -1,
  onReply: (() => void) | undefined,
) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"x" | "y" | null>(null);
  const dx = useRef(0);

  function paint(x: number, animate: boolean) {
    const bubble = bubbleRef.current;
    const icon = iconRef.current;
    if (!bubble) return;
    bubble.style.transition = animate ? "transform 180ms ease-out" : "";
    bubble.style.transform = x ? `translateX(${x * direction}px)` : "";
    if (icon) icon.style.opacity = String(Math.min(1, x / SWIPE_REPLY_PX));
  }

  const handlers = {
    onTouchStart(e: TouchEvent<HTMLDivElement>) {
      const touch = e.touches[0];
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      axis.current = null;
      dx.current = 0;
    },
    onTouchMove(e: TouchEvent<HTMLDivElement>) {
      const touch = e.touches[0];
      if (!start.current || !touch) return;
      const x = touch.clientX - start.current.x;
      const y = touch.clientY - start.current.y;
      if (!axis.current) {
        if (Math.abs(x) < 8 && Math.abs(y) < 8) return;
        axis.current = x * direction > 0 && Math.abs(x) > Math.abs(y) ? "x" : "y";
      }
      if (axis.current !== "x") return;
      dx.current = Math.max(0, Math.min(SWIPE_MAX_PX, x * direction)); // distance in the reply direction
      paint(dx.current, false);
    },
    onTouchEnd: finish,
    onTouchCancel: finish,
  };

  function finish() {
    if (axis.current === "x" && dx.current >= SWIPE_REPLY_PX) {
      navigator.vibrate?.(10);
      onReply?.();
    }
    start.current = null;
    axis.current = null;
    paint(0, true);
  }

  return handlers;
}

// Telegram-style ticks: one grey tick = sent, two blue ticks = read.
export function ReadMark({ status, className }: { status: ReadStatus; className?: string }) {
  const t = useT();
  return status === "read" ? (
    <CheckCheck className={cn("text-primary size-3.5", className)} aria-label={t("O'qildi")} />
  ) : (
    <Check className={cn("size-3.5", className)} aria-label={t("Yuborildi")} />
  );
}

export function DaySeparator({ label }: { label: string }) {
  const t = useT();
  return (
    <div className="my-2 flex justify-center" role="separator" aria-label={t(label)}>
      <span className="bg-card border-border text-muted rounded-full border px-3 py-1 text-[12px] font-medium">{t(label)}</span>
    </div>
  );
}
