import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormMessage } from "@/components/shared/form-field";
import { buttonVariants } from "@/components/ui/button";
import { getUserId } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Yangi parol") };
}

// Reached from the recovery email via /auth/callback, which signs the user in.
export default async function ResetPasswordPage() {
  const t = await getT();
  const userId = await getUserId();

  if (!userId) {
    return (
      <>
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold sm:text-[28px]">{t("Havola yaroqsiz")}</h1>
        </header>
        <FormMessage error={t("Parolni tiklash havolasi eskirgan yoki noto'g'ri. Yangi havola so'rang.")} />
        <Link href="/forgot-password" className={buttonVariants({ size: "lg" })}>
          {t("Yangi havola so'rash")}</Link>
      </>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold sm:text-[28px]">{t("Yangi parol")}</h1>
        <p className="text-muted">{t("Hisobingiz uchun yangi parol o'rnating")}</p>
      </header>
      <ResetPasswordForm />
    </>
  );
}
