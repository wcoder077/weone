import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { AboutStep } from "@/components/onboarding/about-step";
import { LookingForStep } from "@/components/onboarding/looking-for-step";
import { SkillsStep } from "@/components/onboarding/skills-step";
import { StepHeader } from "@/components/onboarding/step-shell";
import { requireUserId } from "@/lib/auth";
import type { SkillLevel } from "@/lib/constants";
import { getMyProfile } from "@/lib/queries/profiles";
import { getAllSkills, getUserSkills } from "@/lib/queries/skills";

export const metadata = { title: "Profilni sozlash" };

const STEPS = {
  1: {
    title: "O'zingiz haqingizda",
    description: "Odamlar sizni shu ma'lumotlar orqali taniydi.",
  },
  2: {
    title: "Nimani yaxshi bilasiz?",
    description:
      "3 tadan 10 tagacha ko'nikma tanlang. Keyinroq ularni loyihalar va tadbirlar bilan isbotlaysiz.",
  },
  3: {
    title: "Nimani qidiryapsiz?",
    description: "Sizga mos odamlar va loyihalarni shunga qarab ko'rsatamiz.",
  },
} as const;

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const userId = await requireUserId();
  const profile = await getMyProfile();
  if (!profile) redirect("/login"); // Narrows the type; the layout already redirected.

  const { step: rawStep } = await searchParams;
  const step = rawStep === "2" ? 2 : rawStep === "3" ? 3 : 1;

  return (
    <div className="min-h-dvh px-4 pb-16">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center lg:px-4">
        <Logo />
      </div>
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-8 pt-4">
        <StepHeader step={step} {...STEPS[step]} />
        {step === 1 ? <AboutStep profile={profile} /> : null}
        {step === 2 ? <SkillsStepLoader userId={userId} /> : null}
        {step === 3 ? (
          <LookingForStep initial={profile.looking_for} initialOnline={profile.is_online_ok} />
        ) : null}
      </main>
    </div>
  );
}

async function SkillsStepLoader({ userId }: { userId: string }) {
  const [skills, mine] = await Promise.all([getAllSkills(), getUserSkills(userId)]);
  return (
    <SkillsStep
      skills={skills}
      initial={mine.map((s) => ({ skill_id: s.skill_id, level: s.level as SkillLevel }))}
    />
  );
}
