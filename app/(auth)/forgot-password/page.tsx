import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FormMessage } from "@/components/shared/form-field";

export const metadata = { title: "Parolni tiklash" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const params = await searchParams;
  const linkError =
    params.error === "link"
      ? "Havola eskirgan, allaqachon ishlatilgan yoki boshqa brauzerda ochilgan. Yangi havola so'rang."
      : undefined;

  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold sm:text-[28px]">Parolni tiklash</h1>
        <p className="text-muted">Emailingizni kiriting — yangi parol o&apos;rnatish havolasini yuboramiz</p>
      </header>
      <FormMessage error={linkError} />
      <ForgotPasswordForm />
      <p className="text-muted text-center text-[14px]">
        Parolni esladingizmi?{" "}
        <Link href="/login" className="text-text font-medium underline-offset-4 hover:underline">
          Kirish
        </Link>
      </p>
    </>
  );
}
