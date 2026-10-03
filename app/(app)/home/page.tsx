import { Fragment, Suspense, type ReactNode } from "react";
import { LoadingRegion } from "@/components/shared/loading-region";
import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronRight, CircleCheck, Newspaper, Users } from "lucide-react";
import { LinkTabs } from "@/components/shared/link-tabs";
import { PeopleCarousel } from "@/components/home/people-carousel";
import { ProjectsStrip } from "@/components/home/projects-strip";
import { FeedSeenMarker } from "@/components/posts/feed-seen-marker";
import { FeedSkeleton } from "@/components/posts/feed-skeleton";
import { PostCard } from "@/components/posts/post-card";
import { SectionCard } from "@/components/profile/profile-sections";
import { ActivityRow } from "@/components/shared/activity-row";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { ListRowSkeleton } from "@/components/shared/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { FEED_SEEN_COOKIE } from "@/lib/feed";
import { memoize } from "@/lib/memo";
import { getNetworkActivity, getPeopleForYou, getProfileChecklist } from "@/lib/queries/home";
import { getFriendsFeed, getRecommendedFeed } from "@/lib/queries/posts";
import { getMyProfile, type MyProfile } from "@/lib/queries/profiles";
import { listProjects } from "@/lib/queries/projects";
import { getRelationships } from "@/lib/queries/social";
import { getT } from "@/lib/i18n/server";
import { single } from "@/lib/url";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Asosiy") };
}

// Recommendations are slotted in after these posts, so the feed stays mostly posts.
const PEOPLE_AFTER = 3;
const PROJECTS_AFTER = 8;
// Recommendations change slowly: recompute them at most every 5 minutes per person.
const RECOMMENDATIONS_TTL_MS = 5 * 60 * 1000;

export default async function HomePage({ searchParams }: PageProps<"/home">) {
  const t = await getT();
  const me = await getMyProfile();
  if (!me) return null; // The (app) layout already redirects signed-out users.
  const firstName = me.full_name.split(" ")[0] || me.username;
  const params = await searchParams;
  const tab = single(params.feed) === "friends" ? "friends" : "recommended";
  const before = single(params.before);
  const validBefore = before && !Number.isNaN(Date.parse(before)) ? before : undefined;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="mx-auto flex w-full max-w-[680px] min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h1 className="text-xl font-bold lg:text-2xl">{t("Salom, {name}", { name: firstName })}</h1>
          <LinkTabs
            label="Postlar turi"
            active={tab}
            tabs={[
              { value: "recommended", label: "Tavsiya", href: "/home" },
              { value: "friends", label: "Do'stlar", href: "/home?feed=friends" },
            ]}
          />
        </div>
        <Suspense key={`${tab}:${validBefore ?? ""}`} fallback={<FeedSkeleton />}>
          {tab === "friends" ? <FriendsFeed me={me} before={validBefore} /> : <HomeFeed me={me} />}
        </Suspense>
      </div>

      <aside className="flex flex-col gap-4">
        <Suspense fallback={<SidebarSkeleton />}>
          <Checklist me={me} />
        </Suspense>
        <Suspense fallback={<SidebarSkeleton />}>
          <Network userId={me.id} />
        </Suspense>
      </aside>
    </div>
  );
}

// Recommendations are extras: if they fail, the feed still shows.
async function optional<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

async function HomeFeed({ me }: { me: MyProfile }) {
  const t = await getT();
  const seen = (await cookies()).get(FEED_SEEN_COOKIE)?.value;
  const seenAt = seen && !Number.isNaN(Date.parse(seen)) ? seen : undefined;
  const [feed, picks, relationships, projects] = await Promise.all([
    getRecommendedFeed(me.id, seenAt).catch(() => null),
    optional(memoize(`people-for-you:${me.id}`, RECOMMENDATIONS_TTL_MS, () => getPeopleForYou(me, 8)), []),
    getRelationships(me.id),
    optional(memoize(`projects-for-you:${me.id}`, RECOMMENDATIONS_TTL_MS, () => listProjects(me.id, "for-you", {})), []),
  ]);
  if (!feed) return <RetryErrorState description={t("Postlarni yuklab bo'lmadi.")} />;

  const people = <PeopleCarousel meId={me.id} picks={picks} relationships={relationships} />;
  const projectStrip = <ProjectsStrip projects={projects.slice(0, 6)} />;

  if (feed.posts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          icon={Newspaper}
          title={t("Hali postlar yo'q")}
          description={t("Birinchi bo'lib yozing yoki maqsaddoshlar bilan bog'laning: ularning postlari shu yerda chiqadi.")}
        />
        {people}
        {projectStrip}
      </div>
    );
  }

  // Short feeds still get the recommendations, right after the last post.
  const slots = new Map<number, ReactNode>([
    [Math.min(PEOPLE_AFTER, feed.posts.length) - 1, people],
    [Math.min(PROJECTS_AFTER, feed.posts.length) - 1, projectStrip],
  ]);
  if (PEOPLE_AFTER >= feed.posts.length && PROJECTS_AFTER >= feed.posts.length) {
    slots.set(feed.posts.length - 1, (
      <>
        {people}
        {projectStrip}
      </>
    ));
  }

  return (
    <div className="flex flex-col gap-4">
      {feed.newest ? <FeedSeenMarker newest={feed.newest} /> : null}
      {feed.posts.map((post, i) => (
        <Fragment key={post.id}>
          <PostCard post={post} isMine={post.author.id === me.id} />
          {slots.get(i)}
        </Fragment>
      ))}
      <Link href="/posts" className={buttonVariants({ variant: "outline", className: "self-center" })}>
        {t("Ko'proq postlar")}
      </Link>
    </div>
  );
}

async function FriendsFeed({ me, before }: { me: MyProfile; before?: string }) {
  const t = await getT();
  const feed = await getFriendsFeed(me.id, before).catch(() => null);
  if (!feed) return <RetryErrorState description={t("Postlarni yuklab bo'lmadi.")} />;

  if (feed.posts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={before ? t("Boshqa post yo'q") : t("Do'stlaringiz postlari yo'q")}
        description={
          feed.hasFriends
            ? t("Bog'langan odamlaringiz post yozsa, shu yerda chiqadi.")
            : t("Maqsaddoshlar bilan bog'laning: ularning postlari shu yerda chiqadi.")
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {feed.posts.map((post) => (
        <PostCard key={post.id} post={post} isMine={post.author.id === me.id} />
      ))}
      {feed.nextBefore ? (
        <Link
          href={`/home?feed=friends&before=${encodeURIComponent(feed.nextBefore)}`}
          className={buttonVariants({ variant: "outline", className: "self-center" })}
        >
          {t("Ko'proq postlar")}
        </Link>
      ) : null}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <LoadingRegion className="bg-card border-border rounded-card flex flex-col gap-2 border p-5">
      <ListRowSkeleton />
      <ListRowSkeleton />
      <ListRowSkeleton />
    </LoadingRegion>
  );
}

async function Checklist({ me }: { me: MyProfile }) {
  const t = await getT();
  const items = await getProfileChecklist(me);
  return (
    <SectionCard title={t("Profilingizni kuchaytiring")}>
      {items.length === 0 ? (
        <p className="text-muted inline-flex items-center gap-2 text-[14px]">
          <CircleCheck className="text-success size-4" aria-hidden />
          {t("Profilingiz to'liq. Zo'r!")}</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="hover:text-text text-muted flex min-h-11 items-center gap-3 text-[14px]">
                <span className="border-border size-5 shrink-0 rounded-md border" aria-hidden />
                <span className="flex-1">{t(item.label)}</span>
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

async function Network({ userId }: { userId: string }) {
  const t = await getT();
  const activities = await getNetworkActivity(userId);
  return (
    <SectionCard title={t("Tarmog'ingizdan")}>
      {activities.length === 0 ? (
        <p className="text-muted text-[14px]">
          {t("Bog'langan maqsaddoshlaringiz loyiha boshlasa yoki qo'shilsa, shu yerda ko'rinadi.")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {activities.map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
