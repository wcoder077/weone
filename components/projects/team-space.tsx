"use client";

import { useState, useSyncExternalStore } from "react";
import { CalendarClock, Link2, Lock, MessagesSquare, Pencil, Pin, Plus, Send, Users, Video } from "lucide-react";
import { useLang, useT } from "@/components/i18n/i18n-provider";
import { buttonVariants, Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import {
  formatMeetingTime,
  getChatProvider,
  isUpcoming,
  type ChatProvider,
  type TeamSpaceProps,
} from "@/lib/team-space";
import { cn } from "@/lib/utils";
import { TeamSpaceEditModal } from "./team-space-edit-modal";

// Text that depends on the viewer's clock or time zone is filled in after hydration only:
// the server's own clock and zone would differ, and React would complain about the mismatch.
const noSubscribe = () => () => {};
function useAfterHydration(compute: () => string) {
  return useSyncExternalStore(noSubscribe, compute, () => "");
}

const PROVIDERS: Record<ChatProvider, { label: string; icon: typeof Send }> = {
  telegram: { label: "Telegram guruhga qo'shilish", icon: Send },
  discord: { label: "Discord'ga qo'shilish", icon: MessagesSquare },
  other: { label: "Guruhga qo'shilish", icon: Link2 },
};

const NOTICE_FOLD_CHARS = 140;
const NOTICE_FOLD_LINES = 3;

function externalLink(variant: "default" | "outline") {
  return buttonVariants({ variant, size: "lg", className: "w-full sm:w-auto" });
}

// A small block under the project card, for members only: the group chat link, one pinned
// notice and the next meeting. Everything comes through props.
export function TeamSpace({ space, viewerRole, onSave }: TeamSpaceProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const isFounder = viewerRole === "founder";

  if (viewerRole === "guest") {
    return (
      <section className="bg-card border-border rounded-card flex items-center gap-3 border p-5 text-[14px]">
        <span className="bg-surface text-muted flex size-10 shrink-0 items-center justify-center rounded-full">
          <Lock className="size-4" aria-hidden />
        </span>
        <p className="text-muted">{t("Jamoa maydoni qo'shilgandan keyin ochiladi")}</p>
      </section>
    );
  }

  const chatUrl = space?.chatUrl ?? null;
  const notice = space?.pinnedNotice ?? null;
  const meetingAt = space?.nextMeetingAt && isUpcoming(space.nextMeetingAt) ? space.nextMeetingAt : null;
  const nothingYet = !chatUrl && !notice && !meetingAt && !space?.meetingUrl;

  return (
    <section aria-labelledby="team-space-title" className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 id="team-space-title" className="inline-flex items-center gap-2 text-base font-semibold">
          <Users className="size-4" aria-hidden />
          {t("Jamoa maydoni")}
        </h2>
        {isFounder && onSave ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil data-icon="inline-start" />
            {t("Tahrirlash")}
          </Button>
        ) : null}
      </div>

      {nothingYet ? (
        <div className="bg-surface flex flex-col items-start gap-3 rounded-2xl p-4">
          <p className="text-muted text-[14px]">
            {isFounder ? t("Telegram guruh linkini qo'shing, jamoa tezroq jonlanadi.") : t("Asoschi hali guruh linki qo'shmagan.")}
          </p>
          {isFounder && onSave ? (
            <Button size="lg" onClick={() => setEditing(true)} className="w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              {t("Qo'shish")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ChatLink url={chatUrl} isFounder={isFounder} />
          {notice ? <PinnedNotice text={notice} updatedAt={space?.pinnedNoticeUpdatedAt ?? null} /> : null}
          <NextMeeting at={meetingAt} url={space?.meetingUrl ?? null} />
        </div>
      )}

      {isFounder && onSave ? (
        <TeamSpaceEditModal open={editing} onOpenChange={setEditing} space={space} onSave={onSave} />
      ) : null}
    </section>
  );
}

function ChatLink({ url, isFounder }: { url: string | null; isFounder: boolean }) {
  const t = useT();
  if (!url) {
    return (
      <p className="text-muted text-[14px]">
        {isFounder ? t("Guruh linki hali qo'shilmagan.") : t("Asoschi hali guruh linki qo'shmagan.")}
      </p>
    );
  }
  const { label, icon: Icon } = PROVIDERS[getChatProvider(url)];
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={externalLink("default")}>
      <Icon data-icon="inline-start" />
      {t(label)}
    </a>
  );
}

function PinnedNotice({ text, updatedAt }: { text: string; updatedAt: string | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const foldable = text.length > NOTICE_FOLD_CHARS || text.split("\n").length > NOTICE_FOLD_LINES;
  const updated = useAfterHydration(() => (updatedAt ? formatRelative(updatedAt, t) : ""));

  return (
    <div className="bg-surface flex flex-col gap-2 rounded-2xl p-4">
      <p className="text-muted inline-flex items-center gap-1.5 text-[12px] font-medium">
        <Pin className="size-3.5" aria-hidden />
        {t("E'lon")}
      </p>
      <p className={cn("text-[15px] leading-[1.6] break-words whitespace-pre-wrap select-text", foldable && !open && "line-clamp-3")}>{text}</p>
      {foldable ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="text-primary -my-2 min-h-11 self-start text-[14px] font-medium hover:underline"
        >
          {open ? t("Yopish") : t("Yana")}
        </button>
      ) : null}
      {updated ? <p className="text-muted text-[12px]">{updated}</p> : null}
    </div>
  );
}

function NextMeeting({ at, url }: { at: string | null; url: string | null }) {
  const t = useT();
  const lang = useLang();
  const when = useAfterHydration(() => (at ? formatMeetingTime(at, lang) : ""));

  if (!at) {
    return (
      <p className="text-muted inline-flex items-center gap-2 text-[14px]">
        <CalendarClock className="size-4 shrink-0" aria-hidden />
        {t("Rejalashtirilgan uchrashuv yo'q")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="text-muted inline-flex items-center gap-2 text-[12px] font-medium">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          {t("Keyingi uchrashuv")}
        </p>
        <p className="min-h-6 text-[16px] font-semibold">{when}</p>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={externalLink("outline")}>
          <Video data-icon="inline-start" />
          {t("Qo'shilish")}
        </a>
      ) : null}
    </div>
  );
}
