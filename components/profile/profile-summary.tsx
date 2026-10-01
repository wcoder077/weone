import Link from "next/link";
import { getProfileSummary } from "@/lib/queries/activities";
import { formatRelative } from "@/lib/format";
import { activityText } from "@/components/shared/activity-row";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "./profile-sections";

const TITLE = "Bog'lanishlar va faoliyat";

// Compact sidebar card: connections / projects counts + latest activities.
export async function ProfileSummary({
  profileId,
  path,
  projectCount,
}: {
  profileId: string;
  path: string;
  projectCount: number;
}) {
  let summary;
  try {
    summary = await getProfileSummary(profileId);
  } catch {
    return (
      <SectionCard title={TITLE}>
        <RetryErrorState description="Faoliyatni yuklab bo'lmadi." />
      </SectionCard>
    );
  }

  const activity = summary.activity.flatMap((a) => {
    const text = activityText(a);
    return text && a.target ? [{ id: a.id, text, href: a.target.href, createdAt: a.createdAt }] : [];
  });

  return (
    <SectionCard title={TITLE}>
      <div className="grid grid-cols-2 gap-2">
        <Stat href={`${path}?tab=connections`} value={summary.connections} label="Bog'lanish" />
        <Stat href={`${path}?tab=projects`} value={projectCount} label="Loyiha" />
      </div>
      {activity.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {activity.map((a) => (
            <li key={a.id} className="flex flex-col gap-0.5">
              <Link href={a.href} className="text-[14px] leading-snug hover:underline">
                {a.text}
              </Link>
              <span className="text-muted text-[12px]">{formatRelative(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-[14px]">Hali faoliyat yo&apos;q.</p>
      )}
    </SectionCard>
  );
}

function Stat({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link
      href={href}
      className="bg-surface hover:border-primary/40 border-border flex min-h-16 flex-col justify-center rounded-2xl border px-4 py-2 transition-colors"
    >
      <span className="text-xl font-bold">{value}</span>
      <span className="text-muted text-[13px]">{label}</span>
    </Link>
  );
}

export function ProfileSummarySkeleton() {
  return (
    <SectionCard title={TITLE}>
      <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </SectionCard>
  );
}
