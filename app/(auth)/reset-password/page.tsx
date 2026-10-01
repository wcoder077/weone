import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormMessage } from "@/components/shared/form-field";
import { buttonVariants } from "@/components/ui/button";
import { getUserId } from "@/lib/auth";

export const metadata = { title: "Yangi parol" };

// Reached from the recovery email via /auth/callback, which signs the user in.
export default async function ResetPasswordPage() {
  const userId = await getUserId();

  if (!userId) {
    return (
      <>
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Havola yaroqsiz</h1>
        </header>
        <FormMessage error="Parolni tiklash havolasi eskirgan yoki noto'g'ri. Yangi havola so'rang." />
        <Link href="/forgot-password" className={buttonVariants({ size: "lg" })}>
          Yangi havola so&apos;rash
        </Link>
      </>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Yangi parol</h1>
        <p className="text-muted">Hisobingiz uchun yangi parol o&apos;rnating</p>
      </header>
      <ResetPasswordForm />
    </>
  );
}
