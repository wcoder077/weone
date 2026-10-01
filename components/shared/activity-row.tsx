import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { NetworkActivity } from "@/lib/queries/home";
import { UserAvatar } from "./user-avatar";

const VERBS: Record<string, (target: string) => string> = {
  joined_project: (t) => `«${t}» jamoasiga qo'shildi`,
  launched_project: (t) => `«${t}» loyihasini ishga tushirdi`,
  started_project: (t) => `«${t}» loyihasini boshladi`,
  added_journey: (t) => `yo'liga «${t}» qo'shdi`,
  connected: (t) => `${t} bilan bog'landi`,
};

export function ActivityRow({ activity: a }: { activity: NetworkActivity }) {
  const verb = VERBS[a.type];
  if (!verb || !a.target) return null;
  return (
    <li className="flex gap-3">
      <Link href={`/u/${a.actor.username}`} aria-label={a.actor.full_name} className="shrink-0">
        <UserAvatar name={a.actor.full_name} url={a.actor.avatar_url} />
      </Link>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[14px] leading-snug">
          <Link href={`/u/${a.actor.username}`} className="font-semibold hover:underline">
            {a.actor.full_name}
          </Link>{" "}
          <Link href={a.target.href} className="text-muted hover:text-text">
            {verb(a.target.label)}
          </Link>
        </p>
        <span className="text-muted text-[12px]">{formatRelative(a.createdAt)}</span>
      </div>
    </li>
  );
}
