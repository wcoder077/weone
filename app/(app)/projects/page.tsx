import { Suspense } from "react";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { ProjectCardFooter } from "@/components/projects/project-card-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkTabs } from "@/components/shared/link-tabs";
import { ProjectCard } from "@/components/shared/project-card";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { UrlFilterSelect } from "@/components/shared/url-filter-select";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { PROJECT_STATUSES } from "@/lib/constants";
import { getProjectCategories, listProjects, type ProjectListTab } from "@/lib/queries/projects";
import { getAllSkills } from "@/lib/queries/skills";

export const metadata = { title: "Loyihalar" };

const TABS: { value: ProjectListTab; label: string }[] = [
  { value: "for-you", label: "Siz uchun" },
  { value: "looking", label: "A'zo qidiryapti" },
  { value: "mine", label: "Mening loyihalarim" },
];

const EMPTY: Record<ProjectListTab, { title: string; description: string }> = {
  "for-you": {
    title: "Hozircha mos loyiha yo'q",
    description: "Ko'nikmalaringizga mos ochiq rollar paydo bo'lsa, shu yerda ko'rinadi.",
  },
  looking: { title: "Ochiq rollar yo'q", description: "Filtrlarni o'zgartirib ko'ring." },
  mine: { title: "Sizda hali loyiha yo'q", description: "Loyiha yarating va jamoa yig'ing." },
};

function param(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const params = await searchParams;
  const tab = TABS.find((t) => t.value === params.tab)?.value ?? "for-you";
  const filters = { category: param(params.category), status: param(params.status), stackSkillId: param(params.stack) };
  const [categories, skills] = await Promise.all([getProjectCategories(), getAllSkills()]);

  const hrefFor = (value: string) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) next.set(k === "stackSkillId" ? "stack" : k, v);
    next.set("tab", value);
    return `/projects?${next.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold lg:text-[32px]">Loyihalar</h1>
        <Link href="/projects/new" className={buttonVariants()}>
          <Plus data-icon="inline-start" />
          Loyiha yaratish
        </Link>
      </div>
      <LinkTabs label="Loyihalar bo'limlari" active={tab} tabs={TABS.map((t) => ({ ...t, href: hrefFor(t.value) }))} />
      <div className="flex flex-wrap gap-2">
        <UrlFilterSelect param="category" label="Soha" options={categories.map((c) => ({ value: c, label: c }))} />
        <UrlFilterSelect param="stack" label="Texnologiya" options={skills.map((s) => ({ value: s.id, label: s.name }))} />
        <UrlFilterSelect param="status" label="Holat" options={[...PROJECT_STATUSES]} />
      </div>
      <Suspense key={JSON.stringify({ tab, filters })} fallback={<CardGridSkeleton variant="project" count={6} />}>
        <ProjectGrid tab={tab} filters={filters} />
      </Suspense>
    </div>
  );
}

async function ProjectGrid({
  tab,
  filters,
}: {
  tab: ProjectListTab;
  filters: Parameters<typeof listProjects>[2];
}) {
  const userId = await requireUserId();
  const projects = await listProjects(userId, tab, filters);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        {...EMPTY[tab]}
        action={tab === "mine" ? { label: "Loyiha yaratish", href: "/projects/new" } : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          footer={<ProjectCardFooter members={p.members} openRoles={p.openRoles} />}
        />
      ))}
    </div>
  );
}
