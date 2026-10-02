import { UserAvatar } from "@/components/shared/user-avatar";
import { getT } from "@/lib/i18n/server";

type Member = { id: string; name: string; avatarUrl: string | null };

export function MemberStack({ members, max = 3 }: { members: Member[]; max?: number }) {
  return (
    <span className="flex -space-x-2">
      {members.slice(0, max).map((m) => (
        <UserAvatar key={m.id} name={m.name} url={m.avatarUrl} size="sm" className="ring-card rounded-full ring-2" />
      ))}
    </span>
  );
}

// "[avatars] 3 a'zo · Kerak: Frontend"
export async function ProjectCardFooter({ members, openRoles }: { members: Member[]; openRoles: { title: string }[] }) {
  const t = await getT();
  return (
    <div className="border-border flex items-center justify-between gap-3 border-t pt-4 text-[13px]">
      <span className="flex items-center gap-2">
        <MemberStack members={members} />
        <span className="text-muted whitespace-nowrap">{t("{n} a'zo", { n: members.length })}</span>
      </span>
      {openRoles.length > 0 ? (
        <span className="min-w-0 truncate">
          <span className="text-muted">{t("Kerak:")}{" "}</span>
          <span className="font-medium">{openRoles.map((r) => r.title).join(", ")}</span>
        </span>
      ) : null}
    </div>
  );
}
