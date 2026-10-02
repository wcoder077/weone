import Link from "next/link";
import { ChevronRight, LogOut, UserPen } from "lucide-react";
import { BackLink } from "@/components/shared/back-link";
import { SectionCard } from "@/components/shared/section-card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Sozlamalar") };
}

// Site settings only. Profile fields live on /settings/profile.
export default async function SettingsPage() {
  const t = await getT();
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <BackLink fallback="/home" />
      <h1 className="text-2xl font-bold lg:text-[32px]">{t("Sozlamalar")}</h1>
      <SectionCard title={t("Ko'rinish")}>
        <div className="flex flex-col gap-3">
          <p className="text-muted text-[14px]">{t("Mavzu. «Tizim» qurilmangiz sozlamasiga qarab o'zgaradi.")}</p>
          <ThemeToggle />
        </div>
      </SectionCard>
      <SectionCard title={t("Hisob")}>
        <div className="flex flex-col gap-2">
          <Link
            href="/settings/profile"
            className="hover:bg-surface -mx-2 flex min-h-11 items-center gap-3 rounded-2xl px-2 text-[15px] transition-colors"
          >
            <UserPen className="text-muted size-5" aria-hidden />
            <span className="flex-1">{t("Profilni tahrirlash")}</span>
            <ChevronRight className="text-muted size-4" aria-hidden />
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="lg" className="text-danger w-full sm:w-auto">
              <LogOut data-icon="inline-start" />
              {t("Hisobdan chiqish")}</Button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
