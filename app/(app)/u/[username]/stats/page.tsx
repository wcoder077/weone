import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, FolderKanban, MessageCircle, Newspaper, Repeat2, Route, UserPlus, type LucideIcon } from "lucide-react";
import { ActivityBars } from "@/components/profile/activity-bars";
import { BackLink } from "@/components/shared/back-link";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { requireUserId } from "@/lib/auth";
import { formatDay, formatDayMonth, formatTime } from "@/lib/format";
import {
  ACTIVITY_KINDS,
  ACTIVITY_LABELS,
  ACTIVITY_WEEKS,
  getActivityStats,
  type ActivityKind,
  type ActivityStats,
} from "@/lib/queries/activity-stats";
import { getProfilePage } from "@/lib/queries/profile-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/u/[username]/stats">) {
  const { username } = await params;
  return { title: `@${username} · statistika` };
}

const ICONS: Record<ActivityKind, LucideIcon> = {
  post: Newspaper,
  repost: Repeat2,
  connection: UserPlus,
  project: FolderKanban,
  journey: Route,
  comment: MessageCircle,
};

const TIMELINE_LIMIT = 60;

export default async function ProfileStatsPage({ params }: PageProps<"/u/[username]/stats">) {
  const t = await getT();
  const { username } = await params;
  await requireUserId();
  const page = await getProfilePage(username.toLowerCase());
  if (!page) notFound();
  const { profile } = page;

  let stats: ActivityStats;
  try {
    stats = await getActivityStats(profile.id);
  } catch {
    return <RetryErrorState description={t("Statistikani yuklab bo'lmadi.")} />;
  }

  const recent = stats.weeks.reduce((sum, w) => sum + w.count, 0);
  const allTime = ACTIVITY_KINDS.reduce((sum, k) => sum + stats.totals[k], 0);
  const best = stats.weeks.reduce((top, w) => (w.count > top.count ? w : top), stats.weeks[0]!);

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5">
      <BackLink fallback={`/u/${profile.username}`} />
      <header className="flex items-center gap-3">
        <UserAvatar name={profile.full_name} url={profile.avatar_url} size="lg" userId={profile.id} />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold lg:text-2xl">{profile.full_name}</h1>
          <p className="text-muted text-[14px]">{t("Faoliyat statistikasi")}</p>
        </div>
      </header>

      {allTime === 0 ? (
        <EmptyState icon={Activity} title={t("Hali faoliyat yo'q")} description={t("Post, bog'lanish yoki loyiha paydo bo'lganda statistika shu yerda chiqadi.")} />
      ) : (
        <>
          {/* Headline numbers. */}
          <section aria-label={t("Asosiy ko'rsatkichlar")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile value={recent} label={t("So'nggi {ACTIVITY_WEEKS} hafta", { ACTIVITY_WEEKS })} />
            <Tile value={stats.activeDays} label={t("Faol kunlar")} />
            <Tile value={best.count} label={best.count ? t("Eng faol hafta · {v0}", { v0: formatDayMonth(best.start) }) : t("Eng faol hafta")} />
            <Tile value={allTime} label={t("Jami faoliyat")} />
          </section>

          {/* All activity per week. */}
          <section className="bg-card border-border rounded-card flex flex-col gap-3 border p-5" aria-labelledby="weekly-title">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="weekly-title" className="text-[15px] font-semibold">
                {t("Haftalik faoliyat")}</h2>
              <span className="text-muted text-[13px]">{t("So'nggi")}{" "}{ACTIVITY_WEEKS} {" "}{t("hafta")}</span>
            </div>
            <ActivityBars weeks={stats.weeks} className="h-40" axis />
            <WeeklyTable stats={stats} />
          </section>

          {/* One small chart per kind (small multiples, same scale per chart). */}
          <section aria-label={t("Turlar bo'yicha")} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIVITY_KINDS.map((kind) => {
              const Icon = ICONS[kind];
              const weeks = stats.weeks.map((w, i) => ({ start: w.start, count: stats.weeksByKind[kind][i] ?? 0 }));
              const lately = stats.weeksByKind[kind].reduce((a, b) => a + b, 0);
              return (
                <div key={kind} className="bg-card border-border flex flex-col gap-2 rounded-[20px] border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-[14px] font-medium">
                      <Icon className="text-primary size-4" aria-hidden />
                      {ACTIVITY_LABELS[kind]}
                    </span>
                    <span className="text-lg font-bold tabular-nums">{stats.totals[kind]}</span>
                  </div>
                  <ActivityBars weeks={weeks} className="h-12" />
                  <span className="text-muted text-[12px]">{t("So'nggi")}{" "}{ACTIVITY_WEEKS} {" "}{t("haftada:")}{" "}{lately}</span>
                </div>
              );
            })}
          </section>

          {/* What happened when. */}
          <section className="bg-card border-border rounded-card flex flex-col gap-4 border p-5" aria-labelledby="timeline-title">
            <h2 id="timeline-title" className="text-[15px] font-semibold">
              {t("Nima qachon bo'ldi")}</h2>
            <Timeline stats={stats} />
          </section>
        </>
      )}
    </div>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-card border-border flex flex-col gap-0.5 rounded-[20px] border px-4 py-3">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-muted truncate text-[12px]">{label}</span>
    </div>
  );
}

// The same weekly numbers as a table (screen readers, exact values).
async function WeeklyTable({ stats }: { stats: ActivityStats }) {
  const t = await getT();
  return (
    <details className="text-[13px]">
      <summary className="text-muted hover:text-text min-h-11 cursor-pointer content-center">{t("Jadval ko'rinishi")}</summary>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1.5 pr-3 font-medium">{t("Hafta")}</th>
              {ACTIVITY_KINDS.map((k) => (
                <th key={k} className="py-1.5 pr-3 font-medium">
                  {ACTIVITY_LABELS[k]}
                </th>
              ))}
              <th className="py-1.5 font-medium">{t("Jami")}</th>
            </tr>
          </thead>
          <tbody>
            {stats.weeks.map((w, i) => (
              <tr key={w.start} className="border-border border-t">
                <td className="py-1.5 pr-3">{formatDayMonth(w.start)}</td>
                {ACTIVITY_KINDS.map((k) => (
                  <td key={k} className="py-1.5 pr-3">
                    {stats.weeksByKind[k][i]}
                  </td>
                ))}
                <td className="py-1.5 font-semibold">{w.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

async function Timeline({ stats }: { stats: ActivityStats }) {
  const t = await getT();
  const events = stats.events.slice(0, TIMELINE_LIMIT);
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const day = formatDay(e.at);
    byDay.set(day, [...(byDay.get(day) ?? []), e]);
  }
  return (
    <div className="flex flex-col gap-5">
      {[...byDay].map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="text-muted text-[12px] font-semibold tracking-wide">{day}</h3>
          <ul className="border-border flex flex-col gap-3 border-l pl-4">
            {items.map((e, i) => {
              const Icon = ICONS[e.kind];
              const body = (
                <>
                  <Icon className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 text-[14px] leading-snug">{e.text}</span>
                  <time dateTime={e.at} className="text-muted shrink-0 text-[12px]">
                    {formatTime(e.at)}
                  </time>
                </>
              );
              return (
                <li key={`${e.at}-${i}`}>
                  {e.href ? (
                    <Link href={e.href} className="hover:bg-surface -mx-2 flex items-start gap-2 rounded-lg px-2 py-1 transition-colors">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2 py-1">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {stats.events.length > TIMELINE_LIMIT ? (
        <p className="text-muted text-[13px]">{t("Oxirgi")}{" "}{TIMELINE_LIMIT} {" "}{t("ta voqea ko'rsatilgan.")}</p>
      ) : null}
    </div>
  );
}
