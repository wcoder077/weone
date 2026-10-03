"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { hideConversation, setConversationMuted, setConversationPinned } from "@/lib/actions/messages";
import { ATTACHMENT_LABELS, type AttachmentKind } from "@/lib/attachments";
import { formatRelative } from "@/lib/format";
import type { ConversationSummary } from "@/lib/queries/messages";
import { Badge } from "@/components/shared/badge";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { UnreadBadge } from "@/components/shared/unread-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ReadMark } from "./message-bubble";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TFunction } from "@/lib/i18n/core";
import { useT } from "@/components/i18n/i18n-provider";

function previewOf(last: NonNullable<ConversationSummary["last"]>, t: TFunction) {
  if (last.kind === "project_invite") return t("Loyihaga taklif");
  if (last.body) return last.body;
  return t(ATTACHMENT_LABELS[last.attachment_type as AttachmentKind] ?? "Xabar");
}

// A chat in the list. Ovozsiz / Qadash / O'chirish live in the "…" menu (touch, mouse and keyboard);
// swiping sideways is left to the page-to-page swipe navigation. Everything here changes only
// my side of the chat; "O'chirish" hides it for me, the other person keeps it.
export function ConversationRow({ conversation: c, active }: { conversation: ConversationSummary; active: boolean }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const name = c.other?.full_name ?? t("Suhbat");

  function run(action: () => Promise<{ error?: string }>, done?: string) {
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
    <div className="group relative overflow-hidden">
      <div className={cn("bg-card relative flex items-center", pending && "opacity-60")}>
        <Link
          href={`/messages/${c.id}`}
          aria-current={active ? "page" : undefined}
          aria-label={c.unread > 0 ? t("{name}, {unread} ta o'qilmagan xabar", { name, unread: c.unread }) : undefined}
          className={cn(
            "flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-3 transition-colors",
            active ? "bg-surface" : "hover:bg-surface/60",
          )}
        >
          <UserAvatar name={name} url={c.other?.avatar_url ?? null} userId={c.other?.id} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline justify-between gap-2">
              <span className={cn("flex min-w-0 items-center gap-1.5", c.unread > 0 ? "font-semibold" : "font-medium")}>
                <span className="truncate">{name}</span>
                {c.muted ? <BellOff className="text-muted size-3.5 shrink-0" aria-label={t("Ovozsiz")} /> : null}
                {c.status === "pending" ? <Badge className="h-5 px-2 text-[11px]">{t("Jarayonda")}</Badge> : null}
              </span>
              <span className="text-muted flex shrink-0 items-center gap-1 text-[12px]">
                {c.pinnedAt ? <Pin className="size-3.5" aria-label={t("Qadalgan")} /> : null}
                {c.lastStatus ? <ReadMark status={c.lastStatus} /> : null}
                {c.last ? formatRelative(c.last.created_at, t) : null}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className={cn("truncate text-[14px]", c.unread > 0 ? "text-text" : "text-muted")}>
                {c.last ? previewOf(c.last, t) : t("Yangi suhbat")}
              </span>
              <UnreadBadge
                count={c.unread}
                className={cn("h-5 min-w-5 shrink-0 px-1.5", c.muted && "bg-border! text-text!")}
              />
            </span>
          </span>
        </Link>
        {/* Always visible on touch; on desktop it appears on hover or focus. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("{name}: amallar", { name })}
            className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 data-popup-open:bg-surface mr-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 data-popup-open:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem onClick={toggleMute}>
              {c.muted ? <Bell aria-hidden /> : <BellOff aria-hidden />}
              {c.muted ? t("Ovozni yoqish") : t("Ovozsiz qilish")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={togglePin}>
              {c.pinnedAt ? <PinOff aria-hidden /> : <Pin aria-hidden />}
              {c.pinnedAt ? t("Qadashni olish") : t("Qadash")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden />
              {t("O'chirish")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ResponsiveDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("Suhbatni o'chirasizmi?")}
        description={t("Suhbat faqat siz uchun o'chadi. {name} uchun u saqlanib qoladi. Yangi xabar kelsa, suhbat yana ko'rinadi.", { name })}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => setConfirming(false)}>
            {t("Bekor qilish")}</Button>
          <Button variant="destructive" size="lg" disabled={pending} onClick={remove}>
            {pending ? t("O'chirilmoqda…") : t("O'chirish")}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
