import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProfileSummary } from "@/lib/queries/activities";
import { ACTIVITY_WEEKS, getActivityStats } from "@/lib/queries/activity-stats";
import { formatCount, formatRelative } from "@/lib/format";
import { activityText } from "@/components/shared/activity-row";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityBars } from "./activity-bars";
import { SectionCard } from "./profile-sections";

const TITLE = "Bog'lanishlar va faoliyat";

// Compact sidebar card: posts / reposts / connections / projects counts (each opens its tab) + latest activities.
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
  let stats;
  try {
    [summary, stats] = await Promise.all([getProfileSummary(profileId), getActivityStats(profileId)]);
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
      <div className="grid grid-cols-4 gap-1.5">
        <Stat href={`${path}?tab=posts#profile-tabs`} value={summary.posts} label="Post" />
        <Stat href={`${path}?tab=reposts#profile-tabs`} value={summary.reposts} label="Repost" />
        <Stat href={`${path}?tab=connections#profile-tabs`} value={summary.connections} label="Bog'lanish" />
        <Stat href={`${path}?tab=projects#profile-tabs`} value={projectCount} label="Loyiha" />
      </div>
      {/* Activity strip: weekly bars; opens the full statistics page. */}
      <Link
        href={`${path}/stats`}
        className="bg-surface border-border hover:border-primary/40 focus-visible:ring-ring/50 block rounded-xl border px-3 pt-2.5 pb-2 transition-colors outline-none focus-visible:ring-3"
      >
        <span className="flex items-center justify-between gap-2 text-[13px]">
          <span className="font-medium">Faoliyat</span>
          <span className="text-muted inline-flex items-center gap-0.5">
            {ACTIVITY_WEEKS} hafta · {stats.weeks.reduce((sum, w) => sum + w.count, 0)} ta
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </span>
        <ActivityBars weeks={stats.weeks} className="mt-2 h-14" />
      </Link>
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
      className="bg-surface hover:border-primary/40 border-border focus-visible:ring-ring/50 flex min-h-14 min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-center transition-colors outline-none focus-visible:ring-3"
    >
      <span className="text-[17px] leading-tight font-bold tabular-nums">{formatCount(value)}</span>
      <span className="text-muted truncate text-[12px]">{label}</span>
    </Link>
  );
}

export function ProfileSummarySkeleton() {
  return (
    <SectionCard title={TITLE}>
      <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-1.5">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </SectionCard>
  );
}
