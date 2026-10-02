import Link from "next/link";
import { Users } from "lucide-react";
import { getProfileConnections } from "@/lib/queries/social";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getT } from "@/lib/i18n/server";

const STATUS = {
  pending: { label: "Jarayonda", tone: "neutral" },
  rejected: { label: "Rad etildi", tone: "danger" },
  accepted: { label: "Muvaffaqiyatli", tone: "success" },
} as const;

// Status badges are shown only to the two people involved; others see accepted rows only.
export async function ConnectionsTab({ profileId, viewerId }: { profileId: string; viewerId: string }) {
  const t = await getT();
  let connections;
  try {
    connections = await getProfileConnections(profileId);
  } catch {
    return <RetryErrorState description={t("Bog'lanishlarni yuklab bo'lmadi.")} />;
  }

  if (connections.length === 0) {
    return <EmptyState icon={Users} title={t("Hali bog'lanishlar yo'q")} description={t("Bog'lanish so'rovlari shu yerda ko'rinadi.")} />;
  }

  const involved = (otherId: string) => viewerId === profileId || viewerId === otherId;

  return (
    <ul className="bg-card border-border rounded-card flex flex-col gap-1 border p-2">
      {connections.map(({ id, status, other }) => {
        const badge = STATUS[status as keyof typeof STATUS];
        return (
          <li key={id}>
            <Link
              href={`/u/${other.username}`}
              className="hover:bg-surface flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-150"
            >
              <UserAvatar name={other.full_name} url={other.avatar_url} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{other.full_name}</span>
                {other.headline ? <span className="text-muted truncate text-[13px]">{other.headline}</span> : null}
              </span>
              {badge && involved(other.id) ? <Badge tone={badge.tone}>{t(badge.label)}</Badge> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
