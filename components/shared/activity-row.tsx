import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { NetworkActivity } from "@/lib/queries/activities";
import { UserAvatar } from "./user-avatar";
import type { TFunction } from "@/lib/i18n/core";
import { getT } from "@/lib/i18n/server";

const VERBS: Partial<Record<string, string>> = {
  joined_project: "«{name}» jamoasiga qo'shildi",
  launched_project: "«{name}» loyihasini ishga tushirdi",
  started_project: "«{name}» loyihasini boshladi",
  added_journey: "yo'liga «{name}» qo'shdi",
  connected: "{name} bilan bog'landi",
};

// "joined «X»" etc., or null for unknown types / missing targets.
export function activityText(a: NetworkActivity, t: TFunction) {
  const verb = VERBS[a.type];
  return verb && a.target ? t(verb, { name: a.target.label }) : null;
}

export async function ActivityRow({ activity: a }: { activity: NetworkActivity }) {
  const t = await getT();
  const text = activityText(a, t);
  if (!text || !a.target) return null;
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
            {text}
          </Link>
        </p>
        <span className="text-muted text-[12px]">{formatRelative(a.createdAt, t)}</span>
      </div>
    </li>
  );
}
