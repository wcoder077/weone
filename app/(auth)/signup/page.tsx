import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { ENABLE_GOOGLE_AUTH } from "@/lib/constants";

export const metadata = { title: "Ro'yxatdan o'tish" };

export default function SignupPage() {
  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">WeOne&apos;ga qo&apos;shiling</h1>
        <p className="text-muted">O&apos;z odamlaringizni 2 daqiqada toping</p>
      </header>
      {ENABLE_GOOGLE_AUTH ? (
        <>
          <GoogleButton next="/onboarding" />
          <OrDivider />
        </>
      ) : null}
      <SignupForm />
      <p className="text-muted text-center text-[14px]">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="text-text font-medium underline-offset-4 hover:underline">
          Kirish
        </Link>
      </p>
    </>
  );
}
