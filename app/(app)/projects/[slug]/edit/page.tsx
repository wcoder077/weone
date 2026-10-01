import { notFound, redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { requireUserId } from "@/lib/auth";
import { getProject, getProjectCategories } from "@/lib/queries/projects";
import { getAllSkills } from "@/lib/queries/skills";

export const metadata = { title: "Loyihani tahrirlash" };

export default async function EditProjectPage({ params }: PageProps<"/projects/[slug]/edit">) {
  const { slug } = await params;
  const [userId, project, skills, categories] = await Promise.all([
    requireUserId(),
    getProject(slug),
    getAllSkills(),
    getProjectCategories(),
  ]);
  if (!project) notFound();
  if (project.owner_id !== userId) redirect(`/projects/${slug}`);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Loyihani tahrirlash</h1>
      <div className="bg-card border-border rounded-card border p-5 sm:p-6">
        <ProjectForm
          skills={skills}
          categories={categories}
          initial={{
            ...project,
            skill_ids: project.project_skills.map((s) => s.skill_id),
            roles: project.project_roles.map((r) => ({
              id: r.id,
              title: r.title,
              is_open: r.is_open,
              skill_ids: r.project_role_skills.map((s) => s.skill_id),
            })),
          }}
        />
      </div>
    </div>
  );
}
