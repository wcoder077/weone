import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { listProjects } from "@/lib/queries/projects";
import { ProjectCardFooter } from "@/components/projects/project-card-footer";
import { ProjectCard } from "@/components/shared/project-card";
import { getT } from "@/lib/i18n/server";

type Project = Awaited<ReturnType<typeof listProjects>>[number];

// Open roles that match my skills, as a swipeable row between posts.
export async function ProjectsStrip({ projects }: { projects: Project[] }) {
  const t = await getT();
  if (projects.length === 0) return null;
  return (
    <section aria-labelledby="projects-for-you" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="projects-for-you" className="text-lg font-semibold whitespace-nowrap">
          {t("Siz uchun loyihalar")}</h2>
        <Link href="/projects" className="text-muted hover:text-text inline-flex min-h-11 items-center gap-1 text-[14px] whitespace-nowrap">
          {t("Hammasi")}<ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {projects.map((p) => (
          <li key={p.id} className="flex w-[280px] shrink-0 snap-start *:w-full">
            <ProjectCard project={p} footer={<ProjectCardFooter members={p.members} openRoles={p.openRoles} />} />
          </li>
        ))}
      </ul>
    </section>
  );
}
