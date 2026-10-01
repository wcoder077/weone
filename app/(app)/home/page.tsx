import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, CircleCheck, FolderKanban, Users } from "lucide-react";
import { ProjectCardFooter } from "@/components/projects/project-card-footer";
import { SectionCard } from "@/components/profile/profile-sections";
import { ActivityRow } from "@/components/shared/activity-row";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineReasons, PersonCard } from "@/components/shared/person-card";
import { ProjectCard } from "@/components/shared/project-card";
import { CardGridSkeleton, ListRowSkeleton } from "@/components/shared/skeletons";
import { ConnectButton } from "@/components/social/connect-button";
import { getNetworkActivity, getPeopleForYou, getProfileChecklist } from "@/lib/queries/home";
import { getMyProfile, type MyProfile } from "@/lib/queries/profiles";
import { listProjects } from "@/lib/queries/projects";
import { getRelationships } from "@/lib/queries/social";

export const metadata = { title: "Asosiy" };

export default async function HomePage() {
  const me = await getMyProfile();
  if (!me) return null; // The (app) layout already redirects signed-out users.
  const firstName = me.full_name.split(" ")[0] || me.username;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold lg:text-[32px]">Salom, {firstName}</h1>
          <p className="text-muted">Ko&apos;nikmalaringizga mos odamlar va loyihalar</p>
        </header>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Siz uchun odamlar" href="/find" linkLabel="Ko'proq topish" />
          <Suspense fallback={<CardGridSkeleton count={3} />}>
            <PeopleForYou me={me} />
          </Suspense>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Siz uchun loyihalar" href="/projects" linkLabel="Hammasi" />
          <Suspense fallback={<CardGridSkeleton count={2} variant="project" />}>
            <ProjectsForYou userId={me.id} />
          </Suspense>
        </section>
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

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold whitespace-nowrap">{title}</h2>
      <Link href={href} className="text-muted hover:text-text inline-flex min-h-11 items-center gap-1 text-[14px] whitespace-nowrap">
        {linkLabel}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="bg-card border-border rounded-card flex flex-col gap-2 border p-5">
      <ListRowSkeleton />
      <ListRowSkeleton />
      <ListRowSkeleton />
    </div>
  );
}

async function PeopleForYou({ me }: { me: MyProfile }) {
  const [picks, relationships] = await Promise.all([getPeopleForYou(me), getRelationships(me.id)]);
  if (picks.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Hozircha tavsiya yo'q"
        description="Ko'proq ko'nikma qo'shing yoki talablaringiz bo'yicha odam qidiring."
        action={{ label: "Odam topish", href: "/find" }}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {picks.map(({ person, skills, sharedSkills, reasons }) => (
        <PersonCard
          key={person.id}
          person={person}
          skills={skills}
          matchedSkills={sharedSkills}
          reasons={<InlineReasons reasons={reasons} />}
          actions={<ConnectButton userId={person.id} connection={relationships.connection(person.id)} className="flex-1" />}
        />
      ))}
    </div>
  );
}

async function ProjectsForYou({ userId }: { userId: string }) {
  const projects = (await listProjects(userId, "for-you", {})).slice(0, 4);
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Mos ochiq rol yo'q"
        description="Ko'nikmalaringizga mos rol ochilsa, shu yerda ko'rasiz. Yoki o'z loyihangizni boshlang."
        action={{ label: "Loyiha yaratish", href: "/projects/new" }}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} footer={<ProjectCardFooter members={p.members} openRoles={p.openRoles} />} />
      ))}
    </div>
  );
}

async function Checklist({ me }: { me: MyProfile }) {
  const items = await getProfileChecklist(me);
  return (
    <SectionCard title="Profilingizni kuchaytiring">
      {items.length === 0 ? (
        <p className="text-muted inline-flex items-center gap-2 text-[14px]">
          <CircleCheck className="text-success size-4" aria-hidden />
          Profilingiz to&apos;liq. Zo&apos;r!
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="hover:text-text text-muted flex min-h-11 items-center gap-3 text-[14px]">
                <span className="border-border size-5 shrink-0 rounded-md border" aria-hidden />
                <span className="flex-1">{item.label}</span>
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
  const activities = await getNetworkActivity(userId);
  return (
    <SectionCard title="Tarmog'ingizdan">
      {activities.length === 0 ? (
        <p className="text-muted text-[14px]">
          Bog&apos;langan odamlaringiz loyiha boshlasa yoki qo&apos;shilsa, shu yerda ko&apos;rinadi.
        </p>
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
