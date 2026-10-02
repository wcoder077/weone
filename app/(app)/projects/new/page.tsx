import { ProjectForm } from "@/components/projects/project-form";
import { getProjectCategories } from "@/lib/queries/projects";
import { getAllSkills } from "@/lib/queries/skills";
import { BackLink } from "@/components/shared/back-link";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Yangi loyiha") };
}

export default async function NewProjectPage() {
  const t = await getT();
  const [skills, categories] = await Promise.all([getAllSkills(), getProjectCategories()]);
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <BackLink fallback="/projects" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold lg:text-[32px]">{t("Yangi loyiha")}</h1>
        <p className="text-muted">{t("Siz loyiha egasi bo'lasiz. Logoni yaratilgandan keyin qo'shasiz.")}</p>
      </div>
      <div className="bg-card border-border rounded-card border p-5 sm:p-6">
        <ProjectForm skills={skills} categories={categories} />
      </div>
    </div>
  );
}
