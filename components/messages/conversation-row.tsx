"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { hideConversation, setConversationMuted, setConversationPinned } from "@/lib/actions/messages";
import { ATTACHMENT_LABELS, type AttachmentKind } from "@/lib/attachments";
import { formatRelative } from "@/lib/format";
import type { ConversationSummary } from "@/lib/queries/messages";
import { Badge } from "@/components/shared/badge";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { UnreadBadge } from "@/components/shared/unread-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ACTION_WIDTH = 72;
const ACTIONS = 3;
const OPEN_X = -ACTION_WIDTH * ACTIONS;
const LOCK = 8;

// Only one row stays swiped open at a time (identified by its element, which is stable across renders).
let openRow: { el: HTMLElement; close: () => void } | null = null;

function previewOf(last: NonNullable<ConversationSummary["last"]>) {
  if (last.kind === "project_invite") return "Loyihaga taklif";
  if (last.body) return last.body;
  return ATTACHMENT_LABELS[last.attachment_type as AttachmentKind] ?? "Xabar";
}

// A chat in the list. Touch: swipe left to reveal Ovozsiz / Qadash / O'chirish.
// Mouse and keyboard: the same actions in the "…" menu. Everything here changes only
// my side of the chat; "O'chirish" hides it for me, the other person keeps it.
export function ConversationRow({ conversation: c, active }: { conversation: ConversationSummary; active: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const draggedRef = useRef(false);
  const name = c.other?.full_name ?? "Suhbat";

  function slideTo(x: number) {
    const el = contentRef.current;
    if (!el) return;
    el.style.transition = "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.transform = x ? `translateX(${x}px)` : "";
    openRef.current = x !== 0;
    if (x) {
      if (openRow && openRow.el !== el) openRow.close();
      openRow = { el, close };
    } else if (openRow?.el === el) openRow = null;
  }
  function close() {
    slideTo(0);
  }

  useEffect(() => {
    const row = rowRef.current;
    const el = contentRef.current;
    if (!row || !el) return;
    let start: { x: number; y: number; t: number } | null = null;
    let axis: "x" | "y" | null = null;
    let offset = 0;
    let frame = 0;

    function onStart(e: TouchEvent) {
      const t = e.touches[0];
      if (!t || e.touches.length !== 1) return;
      start = { x: t.clientX, y: t.clientY, t: performance.now() };
      axis = null;
      draggedRef.current = false;
    }
    function onMove(e: TouchEvent) {
      const t = e.touches[0];
      if (!start || !t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (!axis) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axis === "y") {
          start = null;
          return;
        }
        draggedRef.current = true;
        el!.style.transition = "";
      }
      const base = openRef.current ? OPEN_X : 0;
      offset = Math.min(0, Math.max(OPEN_X - 24, base + dx));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el!.style.transform = `translateX(${offset}px)`;
      });
    }
    function onEnd() {
      if (!start || axis !== "x") {
        start = null;
        return;
      }
      const speed = (offset - (openRef.current ? OPEN_X : 0)) / Math.max(1, performance.now() - start.t);
      start = null;
      cancelAnimationFrame(frame);
      slideTo(offset < OPEN_X / 3 || speed < -0.5 ? OPEN_X : 0);
    }

    row.addEventListener("touchstart", onStart, { passive: true });
    row.addEventListener("touchmove", onMove, { passive: true });
    row.addEventListener("touchend", onEnd, { passive: true });
    row.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      row.removeEventListener("touchstart", onStart);
      row.removeEventListener("touchmove", onMove);
      row.removeEventListener("touchend", onEnd);
      row.removeEventListener("touchcancel", onEnd);
      cancelAnimationFrame(frame);
    };
    // slideTo only touches refs and the DOM, so the listeners are attached once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function run(action: () => Promise<{ error?: string }>, done?: string) {
    close();
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else if (done) toast.success(done);
    });
  }

  const toggleMute = () =>
    run(() => setConversationMuted(c.id, !c.muted), c.muted ? "Ovoz yoqildi" : "Ovozsiz qilindi");
  const togglePin = () => run(() => setConversationPinned(c.id, !c.pinnedAt), c.pinnedAt ? "Qadash olib tashlandi" : "Qadaldi");
  const remove = () =>
    startTransition(async () => {
      const result = await hideConversation(c.id);
      if (result.error) toast.error(result.error);
      else setConfirming(false);
    });

  return (
    <div ref={rowRef} data-no-swipe className="group relative overflow-hidden">
      {/* Revealed by swiping left (touch only). */}
      <div className="absolute inset-y-0 right-0 flex" aria-hidden={!openRef.current}>
        <SwipeAction label={c.muted ? "Ovozni yoqish" : "Ovozsiz"} className="bg-surface text-text" onClick={toggleMute}>
          {c.muted ? <Bell className="size-5" /> : <BellOff className="size-5" />}
        </SwipeAction>
        <SwipeAction label={c.pinnedAt ? "Qadashni olish" : "Qadash"} className="bg-primary text-on-accent" onClick={togglePin}>
          {c.pinnedAt ? <PinOff className="size-5" /> : <Pin className="size-5" />}
        </SwipeAction>
        <SwipeAction
          label="O'chirish"
          className="bg-danger text-on-accent"
          onClick={() => {
            close();
            setConfirming(true);
          }}
        >
          <Trash2 className="size-5" />
        </SwipeAction>
      </div>

      <div ref={contentRef} className={cn("bg-card relative flex items-center", pending && "opacity-60")}>
        <Link
          href={`/messages/${c.id}`}
          aria-current={active ? "page" : undefined}
          aria-label={c.unread > 0 ? `${name}, ${c.unread} ta o'qilmagan xabar` : undefined}
          onClick={(e) => {
            // A swipe or an open row: the tap closes it instead of opening the chat.
            if (draggedRef.current || openRef.current) {
              e.preventDefault();
              draggedRef.current = false;
              close();
            }
          }}
          className={cn(
            "flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-3 transition-colors",
            active ? "bg-surface" : "hover:bg-surface/60",
          )}
        >
          <UserAvatar name={name} url={c.other?.avatar_url ?? null} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline justify-between gap-2">
              <span className={cn("flex min-w-0 items-center gap-1.5", c.unread > 0 ? "font-semibold" : "font-medium")}>
                <span className="truncate">{name}</span>
                {c.muted ? <BellOff className="text-muted size-3.5 shrink-0" aria-label="Ovozsiz" /> : null}
                {c.status === "pending" ? <Badge className="h-5 px-2 text-[11px]">Jarayonda</Badge> : null}
              </span>
              <span className="text-muted flex shrink-0 items-center gap-1 text-[12px]">
                {c.pinnedAt ? <Pin className="size-3.5" aria-label="Qadalgan" /> : null}
                {c.last ? formatRelative(c.last.created_at) : null}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className={cn("truncate text-[14px]", c.unread > 0 ? "text-text" : "text-muted")}>
                {c.last ? previewOf(c.last) : "Yangi suhbat"}
              </span>
              <UnreadBadge
                count={c.unread}
                className={cn("h-5 min-w-5 shrink-0 px-1.5", c.muted && "bg-border! text-text!")}
              />
            </span>
          </span>
        </Link>
        {/* Mouse and keyboard: the same actions in a menu. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${name}: amallar`}
            className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 data-popup-open:bg-surface mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 data-popup-open:opacity-100 pointer-coarse:hidden"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem onClick={toggleMute}>
              {c.muted ? <Bell aria-hidden /> : <BellOff aria-hidden />}
              {c.muted ? "Ovozni yoqish" : "Ovozsiz qilish"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={togglePin}>
              {c.pinnedAt ? <PinOff aria-hidden /> : <Pin aria-hidden />}
              {c.pinnedAt ? "Qadashni olish" : "Qadash"}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden />
              O&apos;chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ResponsiveDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Suhbatni o'chirasizmi?"
        description={`Suhbat faqat siz uchun o'chadi. ${name} uchun u saqlanib qoladi. Yangi xabar kelsa, suhbat yana ko'rinadi.`}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => setConfirming(false)}>
            Bekor qilish
          </Button>
          <Button variant="destructive" size="lg" disabled={pending} onClick={remove}>
            {pending ? "O'chirilmoqda…" : "O'chirish"}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}

function SwipeAction({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={-1}
      style={{ width: ACTION_WIDTH }}
      className={cn("flex flex-col items-center justify-center gap-1 text-[12px] font-medium", className)}
    >
      {children}
      {label}
    </button>
  );
}
