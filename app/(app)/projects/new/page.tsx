import { ProjectForm } from "@/components/projects/project-form";
import { getProjectCategories } from "@/lib/queries/projects";
import { getAllSkills } from "@/lib/queries/skills";

export const metadata = { title: "Yangi loyiha" };

export default async function NewProjectPage() {
  const [skills, categories] = await Promise.all([getAllSkills(), getProjectCategories()]);
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold lg:text-[32px]">Yangi loyiha</h1>
        <p className="text-muted">Siz loyiha egasi bo&apos;lasiz. Logoni yaratilgandan keyin qo&apos;shasiz.</p>
      </div>
      <div className="bg-card border-border rounded-card border p-5 sm:p-6">
        <ProjectForm skills={skills} categories={categories} />
      </div>
    </div>
  );
}
