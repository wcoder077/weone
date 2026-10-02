import Link from "next/link";
import type { ReactNode } from "react";
import { COLLAB_REASONS, labelOf } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import type { NotificationItem } from "@/lib/queries/notifications";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import type { TFunction } from "@/lib/i18n/core";
import { getT } from "@/lib/i18n/server";
import { richText } from "@/lib/i18n/rich";
import { ConnectionRequestActions, JoinRequestActions } from "./request-actions";

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}

// Sentence + optional detail + inline actions for one notification.
function describe(n: NotificationItem, t: TFunction): { text: ReactNode; detail?: string | null; href?: string; actions?: ReactNode } {
  const actor = <Strong>{n.actor?.full_name ?? t("Kimdir")}</Strong>;
  const target = n.target;

  switch (n.type) {
    case "connection_request":
      return {
        text: richText(t("{actor} siz bilan bog'lanmoqchi"), { actor }),
        detail: target.kind === "connection" ? target.message : null,
        actions: target.kind === "connection" && target.pending ? <ConnectionRequestActions connectionId={target.id} /> : null,
      };
    case "connection_accepted":
      return { text: richText(t("{actor} bog'lanish so'rovingizni qabul qildi"), { actor }) };
    case "collab_request":
      return target.kind === "collab"
        ? {
            text: (
              <>
                {richText(t("{actor} hamkorlik taklif qildi: {reason}"), {
                  actor,
                  reason: t(labelOf(COLLAB_REASONS, target.reason)).toLowerCase(),
                })}
                {target.projectName ? <> · «{target.projectName}»</> : null}
              </>
            ),
            detail: target.message,
          }
        : { text: richText(t("{actor} hamkorlik taklif qildi"), { actor }) };
    case "collab_accepted":
      return { text: richText(t("{actor} hamkorlik taklifingizni qabul qildi"), { actor }), href: "/messages" };
    case "join_request":
      return target.kind === "join"
        ? {
            text: richText(t("{actor} «{project}» loyihasiga qo'shilmoqchi"), { actor, project: target.projectName }),
            detail: target.message,
            href: `/projects/${target.projectSlug}`,
            actions: target.pending ? <JoinRequestActions requestId={target.id} /> : null,
          }
        : { text: richText(t("{actor} loyihangizga qo'shilmoqchi"), { actor }) };
    case "join_accepted":
      return target.kind === "project"
        ? { text: richText(t("«{project}» jamoasiga qabul qilindingiz"), { project: target.name }), href: `/projects/${target.slug}` }
        : { text: t("So'rovingiz qabul qilindi") };
    case "join_declined":
      return { text: richText(t("«{project}» so'rovingiz rad etildi"), { project: target.kind === "project" ? target.name : t("Loyiha") }) };
    case "project_invite":
      return target.kind === "invite"
        ? { text: richText(t("{actor} sizni «{project}» loyihasiga taklif qildi"), { actor, project: target.projectName }), href: `/messages/${target.conversationId}` }
        : { text: richText(t("{actor} sizni loyihaga taklif qildi"), { actor }) };
    case "new_project_member":
      return target.kind === "project"
        ? { text: richText(t("{actor} «{project}» jamoasiga qo'shildi"), { actor, project: target.name }), href: `/projects/${target.slug}` }
        : { text: richText(t("{actor} jamoangizga qo'shildi"), { actor }) };
    case "journey_confirmed":
      return { text: richText(t("{actor} «{title}» ishtirokingizni tasdiqladi"), { actor, title: target.kind === "journey" ? target.title : t("tadbir") }) };
    default:
      return { text: actor };
  }
}

export async function NotificationRow({ notification: n }: { notification: NotificationItem }) {
  const t = await getT();
  const { text, detail, href, actions } = describe(n, t);
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
        <p className="text-muted text-[13px]">{formatRelative(n.created_at, t)}</p>
      </div>
      {!n.read ? <span className="bg-text mt-2 size-2 shrink-0 rounded-full" aria-label={t("Yangi")} role="img" /> : null}
    </li>
  );
}
