import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { ENABLE_GOOGLE_AUTH } from "@/lib/constants";
import { LoginForm } from "@/components/auth/login-form";
import { FormMessage } from "@/components/shared/form-field";
import { safeNextPath } from "@/lib/validation/auth";

export const metadata = { title: "Kirish" };

const ERRORS: Record<string, string> = {
  google: "Google orqali kirib bo'lmadi. Qayta urinib ko'ring.",
  link: "Havola eskirgan yoki noto'g'ri. Qayta kirib ko'ring.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold sm:text-[28px]">Xush kelibsiz</h1>
        <p className="text-muted">Hisobingizga kiring</p>
      </header>
      <FormMessage error={error} />
      {ENABLE_GOOGLE_AUTH ? (
        <>
          <GoogleButton next={next} />
          <OrDivider />
        </>
      ) : null}
      <LoginForm next={next} />
      <p className="text-muted text-center text-[14px]">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/signup" className="text-text font-medium underline-offset-4 hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </>
  );
}
