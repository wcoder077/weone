import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { ENABLE_GOOGLE_AUTH } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Ro'yxatdan o'tish") };
}

export default async function SignupPage() {
  const t = await getT();
  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold sm:text-[28px]">{t("WeOne'ga qo'shiling")}</h1>
        <p className="text-muted">{t("O'z maqsaddoshlaringizni 2 daqiqada toping")}</p>
      </header>
      {ENABLE_GOOGLE_AUTH ? (
        <>
          <GoogleButton next="/onboarding" />
          <OrDivider />
        </>
      ) : null}
      <SignupForm />
      <p className="text-muted text-center text-[14px]">
        {t("Hisobingiz bormi?")}{" "}
        <Link href="/login" className="text-text font-medium underline-offset-4 hover:underline">
          {t("Kirish")}</Link>
      </p>
    </>
  );
}
