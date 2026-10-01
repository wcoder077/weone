import Link from "next/link";
import type { ReactNode } from "react";
import { COLLAB_REASONS, labelOf } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import type { NotificationItem } from "@/lib/queries/notifications";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { ConnectionRequestActions, JoinRequestActions } from "./request-actions";

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}

// Sentence + optional detail + inline actions for one notification.
function describe(n: NotificationItem): { text: ReactNode; detail?: string | null; href?: string; actions?: ReactNode } {
  const actor = <Strong>{n.actor?.full_name ?? "Kimdir"}</Strong>;
  const t = n.target;

  switch (n.type) {
    case "connection_request":
      return {
        text: <>{actor} siz bilan bog&apos;lanmoqchi</>,
        detail: t.kind === "connection" ? t.message : null,
        actions: t.kind === "connection" && t.pending ? <ConnectionRequestActions connectionId={t.id} /> : null,
      };
    case "connection_accepted":
      return { text: <>{actor} bog&apos;lanish so&apos;rovingizni qabul qildi</> };
    case "collab_request":
      return t.kind === "collab"
        ? {
            text: (
              <>
                {actor} hamkorlik taklif qildi: {labelOf(COLLAB_REASONS, t.reason).toLowerCase()}
                {t.projectName ? <> · «{t.projectName}»</> : null}
              </>
            ),
            detail: t.message,
          }
        : { text: <>{actor} hamkorlik taklif qildi</> };
    case "collab_accepted":
      return { text: <>{actor} hamkorlik taklifingizni qabul qildi</>, href: "/messages" };
    case "join_request":
      return t.kind === "join"
        ? {
            text: <>{actor} «{t.projectName}» loyihasiga qo&apos;shilmoqchi</>,
            detail: t.message,
            href: `/projects/${t.projectSlug}`,
            actions: t.pending ? <JoinRequestActions requestId={t.id} /> : null,
          }
        : { text: <>{actor} loyihangizga qo&apos;shilmoqchi</> };
    case "join_accepted":
      return t.kind === "project"
        ? { text: <>«{t.name}» jamoasiga qabul qilindingiz</>, href: `/projects/${t.slug}` }
        : { text: <>So&apos;rovingiz qabul qilindi</> };
    case "join_declined":
      return { text: <>«{t.kind === "project" ? t.name : "Loyiha"}» so&apos;rovingiz rad etildi</> };
    case "project_invite":
      return t.kind === "invite"
        ? { text: <>{actor} sizni «{t.projectName}» loyihasiga taklif qildi</>, href: `/messages/${t.conversationId}` }
        : { text: <>{actor} sizni loyihaga taklif qildi</> };
    case "new_project_member":
      return t.kind === "project"
        ? { text: <>{actor} «{t.name}» jamoasiga qo&apos;shildi</>, href: `/projects/${t.slug}` }
        : { text: <>{actor} jamoangizga qo&apos;shildi</> };
    case "journey_confirmed":
      return { text: <>{actor} «{t.kind === "journey" ? t.title : "tadbir"}» ishtirokingizni tasdiqladi</> };
    default:
      return { text: <>{actor}</> };
  }
}

export function NotificationRow({ notification: n }: { notification: NotificationItem }) {
  const { text, detail, href, actions } = describe(n);
  const profileHref = n.actor ? `/u/${n.actor.username}` : undefined;

  return (
    <li className={cn("flex gap-3 rounded-2xl p-3", !n.read && "bg-surface")}>
      {profileHref ? (
        <Link href={profileHref} aria-label={n.actor?.full_name} className="shrink-0">
          <UserAvatar name={n.actor?.full_name ?? "?"} url={n.actor?.avatar_url ?? null} />
        </Link>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[15px] leading-snug">
          {href ? (
            <Link href={href} className="hover:underline">
              {text}
            </Link>
          ) : (
            text
          )}
        </p>
        {detail ? <p className="text-muted border-border border-l-2 pl-3 text-[14px]">{detail}</p> : null}
        {actions}
        <p className="text-muted text-[13px]">{formatRelative(n.created_at)}</p>
      </div>
      {!n.read ? <span className="bg-text mt-2 size-2 shrink-0 rounded-full" aria-label="Yangi" role="img" /> : null}
    </li>
  );
}
