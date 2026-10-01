import { BackLink } from "@/components/shared/back-link";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderKanban, Newspaper, Pencil, Plus, Route, Trophy } from "lucide-react";
import { AddSkillDialog } from "@/components/profile/add-skill-dialog";
import { JourneyDialog } from "@/components/profile/journey-dialog";
import { ConfirmJourneyButton, DeleteJourneyButton } from "@/components/profile/journey-actions";
import {
  EducationList,
  ProfileHeader,
  SectionCard,
  SkillsList,
  TagList,
} from "@/components/profile/profile-sections";
import { BannerEditor } from "@/components/profile/banner-editor";
import { ConnectionsTab } from "@/components/profile/connections-tab";
import { ProfileSummary, ProfileSummarySkeleton } from "@/components/profile/profile-summary";
import { PostCard } from "@/components/posts/post-card";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { ShareButton } from "@/components/profile/share-button";
import { DeleteProjectButton } from "@/components/projects/team-actions";
import { ListRowSkeleton } from "@/components/shared/skeletons";
import { PersonActions } from "@/components/social/person-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { JourneyItem } from "@/components/shared/journey-item";
import { LinkTabs } from "@/components/shared/link-tabs";
import { ProjectCard } from "@/components/shared/project-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { CONFIRMABLE_TYPES, LOOKING_FOR, labelOf, memberRoleLabel, type SkillLevel } from "@/lib/constants";
import {
  getMyEventItems,
  getProfilePage,
  isSameEvent,
  type JourneyItem as JourneyRow,
  type ProfilePage,
} from "@/lib/queries/profile-page";
import { getUserPosts, PROFILE_POSTS_LIMIT } from "@/lib/queries/posts";
import { getAllSkills } from "@/lib/queries/skills";

const TABS = [
  { value: "journey", label: "Yo'l" },
  { value: "posts", label: "Postlar" },
  { value: "projects", label: "Loyihalar" },
  { value: "highlights", label: "Yutuqlar" },
  { value: "connections", label: "Bog'lanishlar" },
] as const;
type Tab = (typeof TABS)[number]["value"];

export async function generateMetadata({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePageRoute({ params, searchParams }: PageProps<"/u/[username]">) {
  const [{ username }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const viewerId = await requireUserId();
  const page = await getProfilePage(username.toLowerCase());
  if (!page) notFound();

  const isMe = page.profile.id === viewerId;
  const tab: Tab = TABS.some((t) => t.value === rawTab) ? (rawTab as Tab) : "journey";
  const path = `/u/${page.profile.username}`;
  const mySkillOptions = page.skills.map((s) => ({ id: s.skill_id ?? "", name: s.skill_name ?? "" }));

  return (
    <div className="flex flex-col gap-6">
      {/* Own profile is a tab; other people's profiles are inner pages. */}
      {isMe ? null : <BackLink fallback="/discover" className="-mb-2" />}
      <ProfileHeader
        profile={page.profile}
        bannerEditor={
          isMe ? (
            <BannerEditor
              userId={page.profile.id}
              initial={{ path: page.profile.banner_path, position: page.profile.banner_position }}
            />
          ) : null
        }
        actions={
          isMe ? (
            <>
              <Link href="/settings/profile" className={buttonVariants()}>
                Profilni tahrirlash
              </Link>
              <ShareButton path={path} />
            </>
          ) : (
            <>
              <PersonActions viewerId={viewerId} userId={page.profile.id} name={page.profile.full_name} />
              <ShareButton path={path} />
            </>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="flex flex-col gap-4">
          <Suspense fallback={<ProfileSummarySkeleton />}>
            <ProfileSummary profileId={page.profile.id} path={path} projectCount={page.projects.length} />
          </Suspense>
          <SectionCard title="Haqida">
            {page.profile.bio ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{page.profile.bio}</p>
            ) : (
              <p className="text-muted text-[14px]">Hali yozilmagan.</p>
            )}
          </SectionCard>
          <SectionCard
            title="Ko'nikmalar"
            action={isMe ? <SkillDialogLoader page={page} viewerId={viewerId} /> : null}
          >
            <SkillsList skills={page.skills} />
          </SectionCard>
          <SectionCard title="Ta'lim">
            <EducationList education={page.education} />
          </SectionCard>
          <SectionCard title="Qidiryapti">
            <TagList items={page.profile.looking_for.map((v) => labelOf(LOOKING_FOR, v))} empty="Ko'rsatilmagan." />
          </SectionCard>
          <SectionCard
            title="Tillar"
            action={
              isMe ? (
                <Link href="/settings/profile#languages" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Plus data-icon="inline-start" />
                  Qo&apos;shish
                </Link>
              ) : null
            }
          >
            <TagList items={page.profile.languages} empty="Ko'rsatilmagan." />
          </SectionCard>
          <SectionCard title="Qiziqishlar">
            <TagList items={page.profile.interests} empty="Ko'rsatilmagan." />
          </SectionCard>
        </aside>

        {/* The sidebar stats link to #profile-tabs, so on phones the tapped tab scrolls into view. */}
        <section id="profile-tabs" className="flex min-w-0 scroll-mt-24 flex-col gap-4" aria-label="Faoliyat">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LinkTabs
              label="Profil bo'limlari"
              active={tab}
              tabs={TABS.map((t) => ({ ...t, href: `${path}?tab=${t.value}#profile-tabs` }))}
            />
            {isMe && tab === "journey" ? <JourneyDialog mySkills={mySkillOptions} /> : null}
            {isMe && tab === "projects" ? (
              <Link href="/projects/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus data-icon="inline-start" />
                Loyiha qo&apos;shish
              </Link>
            ) : null}
          </div>
          {tab === "journey" ? (
            <JourneyTab page={page} isMe={isMe} viewerId={viewerId} mySkillOptions={mySkillOptions} />
          ) : null}
          {tab === "posts" ? (
            <Suspense fallback={<PostsSkeleton />}>
              <PostsTab authorId={page.profile.id} viewerId={viewerId} isMe={isMe} />
            </Suspense>
          ) : null}
          {tab === "projects" ? <ProjectsTab projects={page.projects} isMe={isMe} viewerId={viewerId} /> : null}
          {tab === "highlights" ? <HighlightsTab page={page} /> : null}
          {tab === "connections" ? (
            <Suspense fallback={<ConnectionsSkeleton />}>
              <ConnectionsTab profileId={page.profile.id} viewerId={viewerId} />
            </Suspense>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function toItemData(item: JourneyRow) {
  return {
    ...item,
    skills: item.journey_item_skills.flatMap((s) => (s.skills ? [s.skills.name] : [])),
  };
}

async function JourneyTab({
  page,
  isMe,
  viewerId,
  mySkillOptions,
}: {
  page: ProfilePage;
  isMe: boolean;
  viewerId: string;
  mySkillOptions: { id: string; name: string }[];
}) {
  if (page.journey.length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="Yo'l hali bo'sh"
        description={
          isMe
            ? "Hackathon, amaliyot yoki kurslaringizni qo'shing — bu sizning isbotingiz."
            : "Bu odam hali hech narsa qo'shmagan."
        }
      />
    );
  }

  const myEvents = isMe ? [] : await getMyEventItems(viewerId);
  const byYear = new Map<string, JourneyRow[]>();
  for (const item of page.journey) {
    const year = item.start_date?.slice(0, 4) ?? "Sanasiz";
    byYear.set(year, [...(byYear.get(year) ?? []), item]);
  }

  return (
    <div className="bg-card border-border rounded-card flex flex-col gap-6 border p-5">
      {[...byYear].map(([year, items]) => (
        <div key={year} className="flex flex-col gap-4">
          <h3 className="text-muted text-[13px] font-semibold tracking-wide">{year}</h3>
          <div>
            {items.map((item) => {
              const canConfirm =
                !isMe &&
                CONFIRMABLE_TYPES.includes(item.type) &&
                !item.journey_confirmations.some((c) => c.confirmer_id === viewerId) &&
                myEvents.some((mine) => isSameEvent(mine, item));
              return (
                <JourneyItem
                  key={item.id}
                  item={toItemData(item)}
                  actions={
                    isMe ? (
                      <>
                        <JourneyDialog
                          mySkills={mySkillOptions}
                          item={{ ...item, skill_ids: item.journey_item_skills.map((s) => s.skill_id) }}
                        />
                        <DeleteJourneyButton id={item.id} title={item.title} />
                      </>
                    ) : canConfirm ? (
                      <ConfirmJourneyButton id={item.id} />
                    ) : null
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

async function PostsTab({ authorId, viewerId, isMe }: { authorId: string; viewerId: string; isMe: boolean }) {
  let posts;
  try {
    posts = await getUserPosts(authorId, viewerId);
  } catch {
    return <RetryErrorState description="Postlarni yuklab bo'lmadi." />;
  }
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="Hali postlar yo'q"
        description={isMe ? "Nima ustida ishlayotganingizni yozing." : "Bu odam hali post joylamagan."}
        action={isMe ? { label: "Post yozish", href: "/posts" } : undefined}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isMine={isMe} />
      ))}
      {posts.length === PROFILE_POSTS_LIMIT ? (
        <p className="text-muted text-center text-[13px]">Oxirgi {PROFILE_POSTS_LIMIT} ta post ko&apos;rsatilgan.</p>
      ) : null}
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="bg-card border-border rounded-card flex flex-col gap-2 border p-4">
      <ListRowSkeleton />
      <ListRowSkeleton />
      <ListRowSkeleton />
    </div>
  );
}

function ProjectsTab({
  projects,
  isMe,
  viewerId,
}: {
  projects: ProfilePage["projects"];
  isMe: boolean;
  viewerId: string;
}) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Loyihalar yo'q"
        description={isMe ? "Loyiha yarating yoki jamoaga qo'shiling." : "Bu odam hali loyihada qatnashmagan."}
        action={isMe ? { label: "Loyiha yaratish", href: "/projects/new" } : undefined}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          meta={memberRoleLabel(p.role)}
          footer={
            isMe && p.owner_id === viewerId ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/projects/${p.slug}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Pencil data-icon="inline-start" />
                  Tahrirlash
                </Link>
                <DeleteProjectButton projectId={p.id} size="sm" />
              </div>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}

function HighlightsTab({ page }: { page: ProfilePage }) {
  const wins = page.journey.filter((j) => j.result);
  const launched = page.projects.filter((p) => p.status === "launched");
  if (wins.length + launched.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Hali yutuqlar yo'q"
        description="Natijali tadbirlar va ishga tushgan loyihalar shu yerda ko'rinadi."
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {wins.length > 0 ? (
        <div className="bg-card border-border rounded-card border p-5">
          {wins.map((item) => (
            <JourneyItem key={item.id} item={toItemData(item)} />
          ))}
        </div>
      ) : null}
      {launched.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {launched.map((p) => (
            <ProjectCard key={p.id} project={p} meta={memberRoleLabel(p.role)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

async function SkillDialogLoader({ page, viewerId }: { page: ProfilePage; viewerId: string }) {
  const allSkills = await getAllSkills();
  return (
    <AddSkillDialog
      allSkills={allSkills}
      mySkills={page.skills.map((s) => ({ skill_id: s.skill_id ?? "", level: s.level as SkillLevel }))}
      myProjects={page.projects.map((p) => ({
        id: p.id,
        name: p.name,
        owned: p.owner_id === viewerId,
        skillIds: p.skillIds,
      }))}
      myJourney={page.journey.map((j) => ({
        id: j.id,
        title: j.title,
        skillIds: j.journey_item_skills.map((s) => s.skill_id),
      }))}
    />
  );
}

function ConnectionsSkeleton() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="bg-card border-border rounded-card flex flex-col gap-2 border p-4">
      <ListRowSkeleton />
      <ListRowSkeleton />
      <ListRowSkeleton />
    </div>
  );
}
