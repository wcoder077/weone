import { redirect } from "next/navigation";
import { SectionCard } from "@/components/profile/profile-sections";
import { EducationManager } from "@/components/settings/education-manager";
import { SettingsForm } from "@/components/settings/settings-form";
import { SkillsManager } from "@/components/settings/skills-manager";
import type { SkillLevel } from "@/lib/constants";
import { getProfilePage } from "@/lib/queries/profile-page";
import { getMyProfile } from "@/lib/queries/profiles";

export const metadata = { title: "Profil sozlamalari" };

export default async function SettingsProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  const page = await getProfilePage(profile.username);
  if (!page) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Profil sozlamalari</h1>
      <SectionCard title="Asosiy">
        <SettingsForm profile={profile} />
      </SectionCard>
      <SectionCard title="Ko'nikmalar">
        <SkillsManager
          skills={page.skills.map((s) => ({
            skill_id: s.skill_id ?? "",
            name: s.skill_name ?? "",
            level: s.level as SkillLevel,
          }))}
        />
      </SectionCard>
      <SectionCard title="Ta'lim">
        <EducationManager education={page.education} />
      </SectionCard>
    </div>
  );
}
