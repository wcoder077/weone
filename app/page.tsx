import { Suspense } from "react";
import { LoadingRegion } from "@/components/shared/loading-region";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ProjectLogo, StatusBadge } from "@/components/shared/project-card";
import { SkillChip } from "@/components/shared/skill-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { getUserId } from "@/lib/auth";
import { getWelcomePreviews } from "@/lib/queries/public";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

const STEPS = [
  { title: "Ko'nikmalaringizni ko'rsating", text: "Har bir ko'nikma loyiha va tadbirlar bilan isbotlanadi." },
  { title: "O'z maqsaddoshlaringizni toping", text: "Kim kerakligini yozing — har bir moslik sababini ko'rasiz." },
  { title: "Birga yarating", text: "Jamoa yig'ing, loyihani boshlang va yo'lingiz o'sib boradi." },
];

export default async function WelcomePage() {
  const t = await getT();
  if (await getUserId()) redirect("/home");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 lg:h-20 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              {t("Kirish")}</Link>
            <Link href="/signup" className={buttonVariants()}>
              {t("Qo'shilish")}</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-20 px-4 py-12 lg:gap-28 lg:px-8 lg:py-20">
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <h1 className="text-[34px] leading-[1.05] font-bold tracking-tight break-words min-[400px]:text-[40px] sm:text-[56px] lg:text-[64px]">
              {t("Maqsaddoshlarni toping.")}<br />
              {t("Birga yarating.")}<br />
              {t("Birga o'sing.")}</h1>
            <p className="text-muted max-w-xl text-lg">
              {t("Hackathon, startap va loyihalar uchun jamoadoshlarni haqiqiy ko'nikmalar bo'yicha toping.")}</p>
            <form action="/start" role="search" className="bg-card border-border flex max-w-xl items-center gap-2 rounded-full border p-1.5">
              <label className="relative flex-1">
                <span className="sr-only">{t("Kim kerak?")}</span>
                <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                <input
                  name="q"
                  maxLength={120}
                  placeholder={t("Menga hackathon uchun backend dasturchi kerak")}
                  className="placeholder:text-muted h-11 w-full bg-transparent pr-2 pl-11 text-[15px] outline-none"
                />
              </label>
              <button type="submit" className={cn(buttonVariants(), "shrink-0")}>
                {t("Maqsaddosh topish")}</button>
            </form>
          </div>
          <Suspense fallback={<PreviewSkeleton />}>
            <Previews />
          </Suspense>
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-semibold">
            {t("Qanday ishlaydi")}</h2>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-card border-border rounded-card flex flex-col gap-3 border p-6">
                <span className="text-muted text-[14px]">{t("{n}-qadam", { n: i + 1 })}</span>
                <h3 className="text-xl font-semibold">{t(step.title)}</h3>
                <p className="text-muted">{t(step.text)}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[14px] lg:px-8">
          <Logo />
          <span>{t("Maqsaddoshlarni toping. Birga yarating. Birga o'sing.")}</span>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <LoadingRegion className="flex flex-col gap-4">
      <Skeleton className="rounded-card h-44" />
      <Skeleton className="rounded-card h-20" />
      <Skeleton className="rounded-card h-20" />
    </LoadingRegion>
  );
}

// Real people and projects from the database (safe fields only). Empty data simply hides the column.
async function Previews() {
  const t = await getT();
  const { people, projects } = await getWelcomePreviews().catch(() => ({ people: [], projects: [] }));
  if (people.length + projects.length === 0) return null;

  return (
    <div className="flex flex-col gap-4" aria-label={t("WeOne'dagi maqsaddoshlar va loyihalar")}>
      {projects.map((p) => (
        <Link key={p.slug} href="/signup" className="bg-card border-border rounded-card hover:border-muted/40 flex flex-col gap-4 border p-5 transition-colors">
          <div className="flex items-start gap-3">
            <ProjectLogo name={p.name} url={p.logo_url} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-lg font-semibold">{p.name}</span>
              {p.tagline ? <span className="text-muted line-clamp-2 text-[14px]">{p.tagline}</span> : null}
            </div>
            <StatusBadge status={p.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {p.skills.map((s) => (
              <SkillChip key={s}>{s}</SkillChip>
            ))}
          </div>
        </Link>
      ))}
      {people.map((p) => (
        <Link key={p.username} href="/signup" className="bg-card border-border rounded-card hover:border-muted/40 flex items-center gap-4 border p-4 transition-colors">
          <UserAvatar name={p.full_name} url={p.avatar_url} size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{p.full_name}</span>
            <span className="text-muted truncate text-[14px]">{[p.headline, p.city ? t(p.city) : null].filter(Boolean).join(" · ")}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
